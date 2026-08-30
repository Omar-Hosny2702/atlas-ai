import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { get } from '@vercel/blob';

import { logger } from '../utils/logger.js';
import {
  AppError,
  type Message,
} from '../types/index.js';

import {
  getModelById,
  clamp,
  PARAM_BOUNDS,
} from '../ai/modelConfig.js';

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

dotenv.config({
  path: path.resolve(
    __dirname,
    '../../.env'
  ),
});

export interface GenerationParams {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

const DEFAULT_MODEL =
  'gemini-2.5-flash';

/*
 * Inline image data expands when converted
 * to base64, so keep the vision limit below
 * the general 20 MB attachment limit.
 */
const MAX_VISION_IMAGE_SIZE =
  12 * 1024 * 1024;

const apiKey =
  process.env.GEMINI_API_KEY;

if (!apiKey) {
  logger.warn(
    'GEMINI_API_KEY is not set. Add it to backend/.env to use the Gemini API.'
  );
}

const genAI =
  new GoogleGenAI({
    apiKey:
      apiKey ?? '',
  });

type GeminiRole =
  | 'user'
  | 'model';

interface GeminiTextPart {
  text: string;
}

interface GeminiInlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

type GeminiPart =
  | GeminiTextPart
  | GeminiInlineDataPart;

interface GeminiContent {
  role: GeminiRole;
  parts: GeminiPart[];
}

type ChatHistoryMessage =
  Pick<
    Message,
    | 'role'
    | 'content'
  > & {
    metadata?:
      Message['metadata'];
  };

function sanitizeParams(
  raw: GenerationParams
): GenerationParams {
  const modelId =
    raw.model ||
    DEFAULT_MODEL;

  const modelDef =
    getModelById(
      modelId
    );

  if (!modelDef) {
    throw new AppError(
      `Unknown model "${modelId}". Add it to ai/modelConfig.ts first.`,
      400
    );
  }

  return {
    model:
      modelId,

    temperature:
      clamp(
        raw.temperature,
        PARAM_BOUNDS
          .temperature.min,
        PARAM_BOUNDS
          .temperature.max
      ),

    maxTokens:
      clamp(
        raw.maxTokens,
        PARAM_BOUNDS
          .maxTokens.min,
        PARAM_BOUNDS
          .maxTokens.max
      ),

    topP:
      clamp(
        raw.topP,
        PARAM_BOUNDS
          .topP.min,
        PARAM_BOUNDS
          .topP.max
      ),
  };
}

async function readPrivateImage(
  storageUrl: string,
  fallbackMimeType: string
): Promise<GeminiInlineDataPart> {
  const result =
    await get(
      storageUrl,
      {
        access:
          'private',

        /*
         * The image was just uploaded,
         * so don't allow a cached stale read.
         */
        useCache:
          false,
      }
    );

  if (
    !result ||
    result.statusCode !== 200
  ) {
    throw new AppError(
      'Atlas could not read the attached image.',
      502
    );
  }

  const size =
    result.blob.size ??
    0;

  if (
    size >
    MAX_VISION_IMAGE_SIZE
  ) {
    throw new AppError(
      'This image is too large for Atlas vision. Please use an image smaller than 12 MB.',
      400
    );
  }

  const arrayBuffer =
    await new Response(
      result.stream
    ).arrayBuffer();

  const data =
    Buffer.from(
      arrayBuffer
    ).toString(
      'base64'
    );

  const mimeType =
    result.blob
      .contentType ||
    fallbackMimeType ||
    'image/jpeg';

  return {
    inlineData: {
      mimeType,
      data,
    },
  };
}

async function buildMessageParts(
  message:
    ChatHistoryMessage
): Promise<GeminiPart[]> {
  const parts:
    GeminiPart[] = [];

  /*
   * Add images first so Gemini receives
   * the visual context together with the
   * user's message.
   */
  if (
    message.role ===
    'user'
  ) {
    const attachments =
      message.metadata
        ?.attachments ??
      [];

    for (
      const attachment
      of attachments
    ) {
      const mimeType =
        attachment.mimeType;

      /*
       * Check MIME type rather than only
       * attachment.kind. This means a PNG
       * uploaded through "Upload file"
       * can still be understood as an image.
       */
      if (
        !mimeType
          .toLowerCase()
          .startsWith(
            'image/'
          )
      ) {
        continue;
      }

      if (
        !attachment.storageUrl
      ) {
        logger.warn(
          `Image attachment ${attachment.id} has no storageUrl.`
        );

        continue;
      }

      try {
        const imagePart =
          await readPrivateImage(
            attachment.storageUrl,
            mimeType
          );

        parts.push(
          imagePart
        );
      } catch (error) {
        logger.error(
          `Failed to load image attachment ${attachment.id}`,
          error
        );

        if (
          error instanceof
          AppError
        ) {
          throw error;
        }

        throw new AppError(
          'Atlas could not load one of the attached images.',
          502
        );
      }
    }
  }

  if (
    message.content
      .trim()
  ) {
    parts.push({
      text:
        message.content,
    });
  }

  /*
   * Gemini content objects should not
   * have an empty parts array.
   */
  if (
    parts.length === 0
  ) {
    parts.push({
      text:
        '[Attachment]',
    });
  }

  return parts;
}

async function toGeminiRequest(
  history:
    ChatHistoryMessage[]
): Promise<{
  contents:
    GeminiContent[];
  systemInstruction?:
    string;
}> {
  const systemParts:
    string[] = [];

  const contents:
    GeminiContent[] = [];

  for (
    const message
    of history
  ) {
    if (
      (
        message.role as string
      ) === 'system'
    ) {
      systemParts.push(
        message.content
      );

      continue;
    }

    const parts =
      await buildMessageParts(
        message
      );

    contents.push({
      role:
        message.role ===
        'assistant'
          ? 'model'
          : 'user',

      parts,
    });
  }

  return {
    contents,

    systemInstruction:
      systemParts.length
        ? systemParts.join(
            '\n\n'
          )
        : undefined,
  };
}

export interface ExtractedMemory {
  content: string;
  category: string;
}

export async function extractMemoriesFromMessage(
  userMessage: string
): Promise<
  ExtractedMemory[]
> {
  if (
    !apiKey ||
    !userMessage.trim()
  ) {
    return [];
  }

  const prompt = `
You are the memory manager for an AI assistant.

Analyse the user's message and extract ONLY durable information that could
genuinely help the assistant in future conversations.

Good memories include:
- long-term preferences
- ongoing projects
- recurring interests
- communication preferences
- important non-sensitive facts the user explicitly wants remembered

Do NOT save:
- greetings
- jokes
- temporary situations
- one-off questions
- random conversation
- passwords, API keys, secrets, or authentication information
- highly sensitive personal information unless the user explicitly asks
  for it to be remembered

If nothing is worth remembering, return:
{"memories":[]}

Otherwise return ONLY valid JSON in this exact format:

{
  "memories": [
    {
      "content": "User prefers British English.",
      "category": "preference"
    }
  ]
}

Useful categories:
preference
project
interest
communication
general

User message:
${JSON.stringify(
  userMessage
)}
`;

  try {
    const response =
      await genAI.models
        .generateContent({
          model:
            DEFAULT_MODEL,

          contents: [
            {
              role:
                'user',

              parts: [
                {
                  text:
                    prompt,
                },
              ],
            },
          ],

          config: {
            temperature:
              0.1,

            responseMimeType:
              'application/json',
          },
        });

    const text =
      response.text
        ?.trim();

    if (!text) {
      return [];
    }

    const parsed =
      JSON.parse(
        text
      ) as {
        memories?: Array<{
          content?: unknown;
          category?: unknown;
        }>;
      };

    if (
      !Array.isArray(
        parsed.memories
      )
    ) {
      return [];
    }

    return parsed.memories
      .filter(
        (memory) =>
          typeof memory
            .content ===
            'string' &&
          memory.content
            .trim()
            .length > 0
      )
      .map(
        (memory) => ({
          content:
            String(
              memory.content
            ).trim(),

          category:
            typeof memory
              .category ===
              'string'
              ? memory.category
                  .trim()
              : 'general',
        })
      )
      .slice(
        0,
        5
      );
  } catch (err) {
    logger.warn(
      'Memory extraction failed',
      err
    );

    return [];
  }
}

async function checkGeminiHealth(): Promise<{
  reachable: boolean;
  models: string[];
}> {
  if (!apiKey) {
    return {
      reachable:
        false,

      models:
        [],
    };
  }

  try {
    const pager =
      await genAI.models
        .list();

    const models:
      string[] = [];

    for await (
      const model
      of pager
    ) {
      if (
        model.name
      ) {
        models.push(
          model.name.replace(
            /^models\//,
            ''
          )
        );
      }
    }

    return {
      reachable:
        true,

      models,
    };
  } catch (err) {
    logger.warn(
      'Gemini health check failed',
      err
    );

    return {
      reachable:
        false,

      models:
        [],
    };
  }
}

/*
 * Kept under the old name for
 * backwards compatibility.
 */
export {
  checkGeminiHealth
    as checkOllamaHealth,
};

export async function streamChatCompletion(
  history:
    ChatHistoryMessage[],

  params:
    GenerationParams,

  onToken:
    (
      token:
        string
    ) => void,

  signal:
    AbortSignal
): Promise<{
  fullText: string;
  stopped: boolean;
}> {
  if (!apiKey) {
    throw new AppError(
      'GEMINI_API_KEY is not set. Add it to backend/.env and restart the server.',
      503
    );
  }

  const safeParams =
    sanitizeParams(
      params
    );

  /*
   * This is now async because image
   * attachments have to be downloaded
   * from private Blob storage first.
   */
  const {
    contents,
    systemInstruction,
  } =
    await toGeminiRequest(
      history
    );

  let stream:
    Awaited<
      ReturnType<
        typeof genAI.models
          .generateContentStream
      >
    >;

  try {
    stream =
      await genAI.models
        .generateContentStream({
          model:
            safeParams.model,

          contents,

          config: {
            temperature:
              safeParams
                .temperature,

            topP:
              safeParams
                .topP,

            maxOutputTokens:
              safeParams
                .maxTokens,

            abortSignal:
              signal,

            ...(systemInstruction
              ? {
                  systemInstruction,
                }
              : {}),
          },
        });
  } catch (err) {
    if (
      signal.aborted
    ) {
      return {
        fullText: '',
        stopped:
          true,
      };
    }

    logger.error(
      'Failed to reach Gemini',
      err
    );

    const message =
      err instanceof Error
        ? err.message
        : String(err);

    throw new AppError(
      `Could not get a response from Gemini. Check that GEMINI_API_KEY in backend/.env is valid. (${message})`,
      502
    );
  }

  let fullText =
    '';

  let stopped =
    false;

  try {
    for await (
      const chunk
      of stream
    ) {
      if (
        signal.aborted
      ) {
        stopped =
          true;

        break;
      }

      const token =
        chunk.text;

      if (token) {
        fullText +=
          token;

        onToken(
          token
        );
      }
    }
  } catch (err) {
    if (
      signal.aborted
    ) {
      stopped =
        true;
    } else {
      logger.error(
        'Error while streaming from Gemini',
        err
      );

      throw new AppError(
        'The response stream was interrupted unexpectedly.',
        502
      );
    }
  }

  return {
    fullText,
    stopped,
  };
}