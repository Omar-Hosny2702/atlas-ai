import type { Request, Response } from 'express';
import { z } from 'zod';
import { saveUsefulMemories } from '../services/memoryExtractionService.js';
import {
  addMessage,
  buildPromptHistory,
  deleteMessagesFrom,
  getConversation,
  getMessages,
  maybeAutoTitle,
  updateConversation,
} from '../services/conversationService.js';
import {
  streamChatCompletion,
  extractMemoriesFromMessage,
} from '../services/llmService.js';
import { AppError } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { getMemories } from '../services/memoryService.js';
import { getPreferences } from '../services/preferenceService.js';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty.').max(32000, 'Message is too long.'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8192).optional(),
  topP: z.number().min(0).max(1).optional(),
  model: z.string().optional(),
});

/** Tracks in-flight generations so the Stop endpoint can cancel them. */
const activeGenerations = new Map<string, AbortController>();

function sseWrite(res: Response, payload: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function startSse(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
}

async function runGeneration(
  userId: string,
  conversationId: string,
  res: Response,
  regenerating: boolean
): Promise<void> {
  const conversation = await getConversation(userId, conversationId);
  const controller = new AbortController();
  activeGenerations.set(conversationId, controller);

  startSse(res);
  // If the client disconnects, treat it the same as pressing Stop.
  res.req.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
   const history = buildPromptHistory(
  conversation,
  await getMessages(userId, conversationId)
);


const preferences = await getPreferences(userId);
const memories = await getMemories(userId);

const userContext = `
USER PERSONALISATION:
- Tone: ${preferences.tone}
- Response length: ${preferences.verbosity}
- Personality: ${preferences.personality}
- Language style: ${preferences.languageStyle}
- Use emojis: ${preferences.useEmojis ? 'yes' : 'no'}
- Custom instructions: ${preferences.customInstructions || 'none'}

USER MEMORIES:
${memories.length
  ? memories.map((memory) => `- ${memory.content}`).join('\n')
  : '- No saved memories yet.'}

Follow the user's personalisation naturally. Use memories only when relevant.
`;

history.unshift({
  role: 'system',
  content: userContext,
});
    let assistantText = '';

    const { fullText, stopped } = await streamChatCompletion(
      history,
      {
        model: conversation.model,
        temperature: conversation.temperature,
        maxTokens: conversation.maxTokens,
        topP: conversation.topP,
      },
      (token) => {
        assistantText += token;
        sseWrite(res, { type: 'token', token });
      },
      controller.signal
    );

    const saved = await addMessage(userId, conversationId, 'assistant', fullText || assistantText, { stopped });

    if (!regenerating) {
      const firstUser = (await getMessages(userId, conversationId)).find((m) => m.role === 'user');
      if (firstUser) await maybeAutoTitle(userId, conversationId, firstUser.content);
    }

    sseWrite(res, { type: 'done', message: saved });
  } catch (err) {
    const message =
      err instanceof AppError ? err.message : 'The assistant ran into an unexpected error.';
    logger.error('Generation failed', err);
    const saved = addMessage(userId, conversationId, 'assistant', '', { error: message });
    sseWrite(res, { type: 'error', message, savedMessage: saved });
  } finally {
    activeGenerations.delete(conversationId);
    res.end();
  }
}

/** POST /api/chat/:conversationId — send a user message and stream the reply. */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';
  const { conversationId } = req.params;
  const { content, temperature, maxTokens, topP, model } = req.body as z.infer<
    typeof sendMessageSchema
  >;

  // Persist any per-message overrides onto the conversation before generating,
  // so the settings the user tweaked in the UI are actually used.
  const conversation = await getConversation(userId, conversationId); // throws 404 if missing
  if (
    temperature !== undefined ||
    maxTokens !== undefined ||
    topP !== undefined ||
    (model !== undefined && model !== conversation.model)
  ) {
    updateConversation(userId, conversationId, { temperature, maxTokens, topP, model });
  }

  await addMessage(userId, conversationId, 'user', content);
  const memoryWorthChecking =
  /\b(remember|my favourite|my favorite|i prefer|i like|i love|i hate|i use|i am|i'm|my project|from now on)\b/i.test(
    content
  );

if (memoryWorthChecking) {
  const extractedMemories = await extractMemoriesFromMessage(content);
  await saveUsefulMemories(userId, extractedMemories);
}
  await runGeneration(userId, conversationId, res, false);
}

/** POST /api/chat/:conversationId/regenerate — drop the last assistant reply and retry. */
export async function regenerateMessage(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';
  const { conversationId } = req.params;
  const messages = await getMessages(userId, conversationId);
  const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === 'assistant');

  if (lastAssistantIndex !== -1) {
    const target = messages[messages.length - 1 - lastAssistantIndex];
    deleteMessagesFrom(userId, conversationId, target.createdAt);
  }

  await runGeneration(userId, conversationId, res, true);
}

/** POST /api/chat/:conversationId/stop — cancel an in-flight generation. */
export function stopGeneration(req: Request, res: Response): void {
  const userId = req.auth?.userId ?? 'local-dev-user';
  const { conversationId } = req.params;

  try {
    getConversation(userId, conversationId);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }

  const controller = activeGenerations.get(conversationId);
  if (!controller) {
    res.status(404).json({ error: 'No generation is currently running for this conversation.' });
    return;
  }
  controller.abort();
  res.status(200).json({ stopped: true });
}
