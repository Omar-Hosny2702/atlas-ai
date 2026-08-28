import { nanoid } from 'nanoid';
import { getDatabase } from '../db/database.js';
import { config } from '../config/config.js';
import { AppError } from '../types/index.js';
import type {
  Conversation,
  ConversationSummary,
  ConversationWithMessages,
  CreateConversationBody,
  Message,
  MessageRole,
  UpdateConversationBody,
} from '../types/index.js';
import { getModelById } from '../ai/modelConfig.js';
import { DEFAULT_SYSTEM_PROMPT } from '../ai/systemPrompts.js';

interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  pinned: boolean | number;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  stopped: boolean | number;
  error: string | null;
  created_at: string;
}

function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    systemPrompt: row.system_prompt,
    model: row.model,
    temperature: Number(row.temperature),
    maxTokens: Number(row.max_tokens),
    topP: Number(row.top_p),
    pinned: Boolean(row.pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    stopped: Boolean(row.stopped),
    error: row.error,
    createdAt: row.created_at,
  };
}

export async function createConversation(
  userId: string,
  body: CreateConversationBody
): Promise<Conversation> {
  const sql = await getDatabase();

  const model = body.model ?? config.defaultModel;
  const modelDef = getModelById(model);

  if (!modelDef) {
    throw new AppError(`Unknown model "${model}".`, 400);
  }

  const now = new Date().toISOString();

  const conversation: ConversationRow = {
    id: nanoid(),
    user_id: userId,
    title: body.title?.trim() || 'New chat',
    system_prompt: body.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    model,
    temperature: body.temperature ?? modelDef.defaults.temperature,
    max_tokens: body.maxTokens ?? modelDef.defaults.maxTokens,
    top_p: body.topP ?? modelDef.defaults.topP,
    pinned: false,
    created_at: now,
    updated_at: now,
  };

  await sql`
    INSERT INTO conversations (
      id,
      user_id,
      title,
      system_prompt,
      model,
      temperature,
      max_tokens,
      top_p,
      pinned,
      created_at,
      updated_at
    )
    VALUES (
      ${conversation.id},
      ${conversation.user_id},
      ${conversation.title},
      ${conversation.system_prompt},
      ${conversation.model},
      ${conversation.temperature},
      ${conversation.max_tokens},
      ${conversation.top_p},
      ${conversation.pinned},
      ${conversation.created_at},
      ${conversation.updated_at}
    )
  `;

  return rowToConversation(conversation);
}

export async function listConversations(
  userId: string
): Promise<ConversationSummary[]> {
  const sql = await getDatabase();

  const rows = await sql<(ConversationRow & {
    message_count: number;
    last_message: string | null;
    })[]>`
    SELECT
      c.*,
      (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
      ) AS message_count,
      (
        SELECT content
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS last_message
    FROM conversations c
    WHERE c.user_id = ${userId}
    ORDER BY c.pinned DESC, c.updated_at DESC
  `;

  return rows.map((row) => ({
    ...rowToConversation(row),
    messageCount: Number(row.message_count),
    lastMessagePreview: row.last_message
      ? row.last_message.slice(0, 140)
      : null,
  }));
}

export async function getConversation(
  userId: string,
  id: string
): Promise<ConversationWithMessages> {
  const sql = await getDatabase();

  const rows = await sql<ConversationRow[]>`
    SELECT *
    FROM conversations
    WHERE id = ${id}
      AND user_id = ${userId}
    LIMIT 1
  `;

  const row = rows[0];

  if (!row) {
    throw new AppError('Conversation not found.', 404);
  }

  const messageRows = await sql<MessageRow[]>`
    SELECT *
    FROM messages
    WHERE conversation_id = ${id}
    ORDER BY created_at ASC
  `;

  return {
    ...rowToConversation(row),
    messages: messageRows.map(rowToMessage),
  };
}

export async function updateConversation(
  userId: string,
  id: string,
  body: UpdateConversationBody
): Promise<Conversation> {
  const sql = await getDatabase();

  const existingRows = await sql<ConversationRow[]>`
    SELECT *
    FROM conversations
    WHERE id = ${id}
      AND user_id = ${userId}
    LIMIT 1
  `;

  const existing = existingRows[0];

  if (!existing) {
    throw new AppError('Conversation not found.', 404);
  }

  if (body.model) {
    const modelDef = getModelById(body.model);

    if (!modelDef) {
      throw new AppError(`Unknown model "${body.model}".`, 400);
    }
  }

  const updated: ConversationRow = {
    ...existing,
    title: body.title?.trim() || existing.title,
    system_prompt: body.systemPrompt ?? existing.system_prompt,
    model: body.model ?? existing.model,
    temperature: body.temperature ?? Number(existing.temperature),
    max_tokens: body.maxTokens ?? Number(existing.max_tokens),
    top_p: body.topP ?? Number(existing.top_p),
    pinned:
      body.pinned === undefined
        ? existing.pinned
        : body.pinned,
    updated_at: new Date().toISOString(),
  };

  await sql`
    UPDATE conversations
    SET
      title = ${updated.title},
      system_prompt = ${updated.system_prompt},
      model = ${updated.model},
      temperature = ${updated.temperature},
      max_tokens = ${updated.max_tokens},
      top_p = ${updated.top_p},
      pinned = ${updated.pinned},
      updated_at = ${updated.updated_at}
    WHERE id = ${id}
      AND user_id = ${userId}
  `;

  return rowToConversation(updated);
}

export async function touchConversation(
  userId: string,
  id: string
): Promise<void> {
  const sql = await getDatabase();

  const result = await sql`
    UPDATE conversations
    SET updated_at = ${new Date().toISOString()}
    WHERE id = ${id}
      AND user_id = ${userId}
    RETURNING id
  `;

  if (result.length === 0) {
    throw new AppError('Conversation not found.', 404);
  }
}

export async function deleteConversation(
  userId: string,
  id: string
): Promise<void> {
  const sql = await getDatabase();

  const result = await sql`
    DELETE FROM conversations
    WHERE id = ${id}
      AND user_id = ${userId}
    RETURNING id
  `;

  if (result.length === 0) {
    throw new AppError('Conversation not found.', 404);
  }
}

export async function searchConversations(
  userId: string,
  query: string
): Promise<ConversationSummary[]> {
  const sql = await getDatabase();
  const trimmed = query.trim();

  if (!trimmed) {
    return listConversations(userId);
  }

  const like = `%${trimmed}%`;

  const rows = await sql<(ConversationRow & {
    message_count: number;
    last_message: string | null;
    })[]>`
    SELECT DISTINCT
      c.*,
      (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
      ) AS message_count,
      (
        SELECT content
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS last_message
    FROM conversations c
    LEFT JOIN messages msg
      ON msg.conversation_id = c.id
    WHERE c.user_id = ${userId}
      AND (
        c.title ILIKE ${like}
        OR msg.content ILIKE ${like}
      )
    ORDER BY c.pinned DESC, c.updated_at DESC
  `;

  return rows.map((row) => ({
    ...rowToConversation(row),
    messageCount: Number(row.message_count),
    lastMessagePreview: row.last_message
      ? row.last_message.slice(0, 140)
      : null,
  }));
}

export async function addMessage(
  userId: string,
  conversationId: string,
  role: MessageRole,
  content: string,
  extra: { stopped?: boolean; error?: string | null } = {}
): Promise<Message> {
  const sql = await getDatabase();

  const owns = await sql`
    SELECT 1
    FROM conversations
    WHERE id = ${conversationId}
      AND user_id = ${userId}
    LIMIT 1
  `;

  if (owns.length === 0) {
    throw new AppError('Conversation not found.', 404);
  }

  const row: MessageRow = {
    id: nanoid(),
    conversation_id: conversationId,
    role,
    content,
    stopped: extra.stopped ?? false,
    error: extra.error ?? null,
    created_at: new Date().toISOString(),
  };

  await sql`
    INSERT INTO messages (
      id,
      conversation_id,
      role,
      content,
      stopped,
      error,
      created_at
    )
    VALUES (
      ${row.id},
      ${row.conversation_id},
      ${row.role},
      ${row.content},
      ${row.stopped},
      ${row.error},
      ${row.created_at}
    )
  `;

  await touchConversation(userId, conversationId);

  return rowToMessage(row);
}

export async function deleteMessage(messageId: string): Promise<void> {
  const sql = await getDatabase();

  const result = await sql`
    DELETE FROM messages
    WHERE id = ${messageId}
    RETURNING id
  `;

  if (result.length === 0) {
    throw new AppError('Message not found.', 404);
  }
}

export async function deleteMessagesFrom(
  userId: string,
  conversationId: string,
  fromCreatedAt: string
): Promise<void> {
  const sql = await getDatabase();

  const owns = await sql`
    SELECT 1
    FROM conversations
    WHERE id = ${conversationId}
      AND user_id = ${userId}
    LIMIT 1
  `;

  if (owns.length === 0) {
    throw new AppError('Conversation not found.', 404);
  }

  await sql`
    DELETE FROM messages
    WHERE conversation_id = ${conversationId}
      AND created_at >= ${fromCreatedAt}
  `;
}

export async function getMessages(
  userId: string,
  conversationId: string
): Promise<Message[]> {
  const sql = await getDatabase();

  const owns = await sql`
    SELECT 1
    FROM conversations
    WHERE id = ${conversationId}
      AND user_id = ${userId}
    LIMIT 1
  `;

  if (owns.length === 0) {
    throw new AppError('Conversation not found.', 404);
  }

  const rows = await sql<MessageRow[]>`
    SELECT *
    FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;

  return rows.map(rowToMessage);
}

export async function maybeAutoTitle(
  userId: string,
  conversationId: string,
  firstUserMessage: string
): Promise<void> {
  const sql = await getDatabase();

  const rows = await sql<{ title: string }[]>`
    SELECT title
    FROM conversations
    WHERE id = ${conversationId}
      AND user_id = ${userId}
    LIMIT 1
  `;

  const row = rows[0];

  if (!row || row.title !== 'New chat') {
    return;
  }

  const title =
    firstUserMessage.trim().slice(0, 60) || 'New chat';

  await sql`
    UPDATE conversations
    SET title = ${title}
    WHERE id = ${conversationId}
      AND user_id = ${userId}
  `;
}

// --- long-chat handling -----------------------------------------------------

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function buildPromptHistory(
  conversation: Conversation,
  messages: Message[]
): Pick<Message, 'role' | 'content'>[] {
  const modelDef = getModelById(conversation.model);
  const contextWindow = modelDef?.contextWindow ?? 8192;
  const reserved = conversation.maxTokens + 512;
  const budget = Math.max(contextWindow - reserved, 1024);

  const system = conversation.systemPrompt.trim()
    ? [
        {
          role: 'system' as const,
          content: conversation.systemPrompt,
        },
      ]
    : [];

  const systemTokens = system.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0
  );

  const kept: Pick<Message, 'role' | 'content'>[] = [];
  let used = systemTokens;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const tokens = estimateTokens(msg.content);

    if (used + tokens > budget && kept.length > 0) {
      break;
    }

    kept.unshift({
      role: msg.role,
      content: msg.content,
    });

    used += tokens;
  }

  return [...system, ...kept];
}