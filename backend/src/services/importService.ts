import { z } from 'zod';
import { AppError } from '../types/index.js';
import { createConversation, addMessage } from './conversationService.js';
import type { Conversation } from '../types/index.js';
import { config } from '../config/config.js';
import { getModelById } from '../../../ai/modelConfig.js';

const importedMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
});

const importedConversationSchema = z.object({
  title: z.string().optional(),
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  topP: z.number().optional(),
  messages: z.array(importedMessageSchema),
});

/**
 * Accepts either a single exported conversation object or an array of them
 * (so users can re-import a batch exported earlier). Unknown models fall
 * back to the server default rather than rejecting the whole import.
 */
export function importConversations(payload: unknown): Conversation[] {
  const arraySchema = z.union([importedConversationSchema, z.array(importedConversationSchema)]);
  const parsed = arraySchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError(
      `Import file is not a valid Atlas AI export: ${parsed.error.issues[0]?.message ?? 'invalid format'}`,
      400
    );
  }

  const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  if (items.length === 0) {
    throw new AppError('Import file contains no conversations.', 400);
  }

  const created: Conversation[] = [];

  for (const item of items) {
    const resolvedModel = item.model && getModelById(item.model) ? item.model : config.defaultModel;
    const conversation = createConversation({
      title: item.title ?? 'Imported chat',
      systemPrompt: item.systemPrompt,
      model: resolvedModel,
      temperature: item.temperature,
      maxTokens: item.maxTokens,
      topP: item.topP,
    });

    for (const message of item.messages) {
      addMessage(conversation.id, message.role, message.content);
    }

    created.push(conversation);
  }

  return created;
}
