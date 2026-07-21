import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/index.js';
import type { Message } from '../types/index.js';
import { getModelById, clamp, PARAM_BOUNDS } from '../../../ai/modelConfig.js';

// Load GEMINI_API_KEY from backend/.env regardless of the working directory
// the process was started from (this file lives at backend/src/services/).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface GenerationParams {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

/** Fallback model used when a caller doesn't specify one. */
const DEFAULT_MODEL = 'gemini-2.5-flash';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  logger.warn('GEMINI_API_KEY is not set. Add it to backend/.env to use the Gemini API.');
}

const genAI = new GoogleGenAI({ apiKey: apiKey ?? '' });

type GeminiRole = 'user' | 'model';

interface GeminiContent {
  role: GeminiRole;
  parts: { text: string }[];
}

function sanitizeParams(raw: GenerationParams): GenerationParams {
  const modelId = raw.model || DEFAULT_MODEL;
  const modelDef = getModelById(modelId);
  if (!modelDef) {
    throw new AppError(
      `Unknown model "${modelId}". Add it to ai/modelConfig.ts first.`,
      400
    );
  }
  return {
    model: modelId,
    temperature: clamp(raw.temperature, PARAM_BOUNDS.temperature.min, PARAM_BOUNDS.temperature.max),
    maxTokens: clamp(raw.maxTokens, PARAM_BOUNDS.maxTokens.min, PARAM_BOUNDS.maxTokens.max),
    topP: clamp(raw.topP, PARAM_BOUNDS.topP.min, PARAM_BOUNDS.topP.max),
  };
}

/**
 * Converts the app's chat history into Gemini's `contents` shape. Any
 * `system` messages are pulled out and joined into a single system
 * instruction, since Gemini doesn't accept a `system` role inside `contents`.
 */
function toGeminiRequest(history: Pick<Message, 'role' | 'content'>[]): {
  contents: GeminiContent[];
  systemInstruction?: string;
} {
  const systemParts: string[] = [];
  const contents: GeminiContent[] = [];

  for (const message of history) {
    if ((message.role as string) === 'system') {
      systemParts.push(message.content);
      continue;
    }
    contents.push({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    });
  }

  return {
    contents,
    systemInstruction: systemParts.length ? systemParts.join('\n\n') : undefined,
  };
}

async function checkGeminiHealth(): Promise<{ reachable: boolean; models: string[] }> {
  if (!apiKey) {
    return { reachable: false, models: [] };
  }
  try {
    const pager = await genAI.models.list({ pageSize: 20 });
    const models: string[] = [];
    for await (const model of pager) {
      if (model.name) models.push(model.name.replace(/^models\//, ''));
    }
    return { reachable: true, models };
  } catch (err) {
    logger.warn('Gemini health check failed', err);
    return { reachable: false, models: [] };
  }
}

/**
 * Confirms the Gemini API is reachable with the configured API key. Used by
 * the health-check route and surfaced in the UI so a missing/invalid
 * GEMINI_API_KEY produces a clear error instead of a hang.
 *
 * Kept under its original name (`checkOllamaHealth`) for backwards
 * compatibility with existing callers; rename call sites to
 * `checkGeminiHealth` when convenient.
 */
export { checkGeminiHealth as checkOllamaHealth };

/**
 * Streams a chat completion from Gemini, invoking `onToken` for each piece
 * of generated text as it arrives. Resolves with the full text once
 * generation is complete. Honors `signal` for cancellation (Stop button).
 */
export async function streamChatCompletion(
  history: Pick<Message, 'role' | 'content'>[],
  params: GenerationParams,
  onToken: (token: string) => void,
  signal: AbortSignal
): Promise<{ fullText: string; stopped: boolean }> {
  if (!apiKey) {
    throw new AppError(
      'GEMINI_API_KEY is not set. Add it to backend/.env and restart the server.',
      503
    );
  }

  const safeParams = sanitizeParams(params);
  const { contents, systemInstruction } = toGeminiRequest(history);

  let stream: Awaited<ReturnType<typeof genAI.models.generateContentStream>>;
  try {
    stream = await genAI.models.generateContentStream({
      model: safeParams.model,
      contents,
      config: {
        temperature: safeParams.temperature,
        topP: safeParams.topP,
        maxOutputTokens: safeParams.maxTokens,
        abortSignal: signal,
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    });
  } catch (err) {
    if (signal.aborted) {
      return { fullText: '', stopped: true };
    }
    logger.error('Failed to reach Gemini', err);
    const message = err instanceof Error ? err.message : String(err);
    throw new AppError(
      `Could not get a response from Gemini. Check that GEMINI_API_KEY in backend/.env is valid. (${message})`,
      502
    );
  }

  let fullText = '';
  let stopped = false;

  try {
    for await (const chunk of stream) {
      if (signal.aborted) {
        stopped = true;
        break;
      }
      const token = chunk.text;
      if (token) {
        fullText += token;
        onToken(token);
      }
    }
  } catch (err) {
    if (signal.aborted) {
      stopped = true;
    } else {
      logger.error('Error while streaming from Gemini', err);
      throw new AppError('The response stream was interrupted unexpectedly.', 502);
    }
  }

  return { fullText, stopped };
}
