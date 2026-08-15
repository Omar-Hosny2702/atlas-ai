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

// --- row <-> domain mapping -------------------------------------------------

interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  pinned: number;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  stopped: number;
  error: string | null;
  created_at: string;
}

function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    systemPrompt: row.system_prompt,
    model: row.model,
    temperature: row.temperature,
    maxTokens: row.max_tokens,
    topP: row.top_p,
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

// --- conversations -----------------------------------------------------------

export function createConversation(userId: string, body: CreateConversationBody): Conversation {
  const db = getDatabase();
  const now = new Date().toISOString();
  const model = body.model ?? config.defaultModel;
  const modelDef = getModelById(model);
  if (!modelDef) {
    throw new AppError(`Unknown model "${model}".`, 400);
  }

  const conversation: ConversationRow = {
    id: nanoid(),
    user_id: userId,
    title: body.title?.trim() || 'New chat',
    system_prompt: body.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    model,
    temperature: body.temperature ?? modelDef.defaults.temperature,
    max_tokens: body.maxTokens ?? modelDef.defaults.maxTokens,
    top_p: body.topP ?? modelDef.defaults.topP,
    pinned: 0,
    created_at: now,
    updated_at: now,
  };

  db.prepare(
    `INSERT INTO conversations
      (id, user_id, title, system_prompt, model, temperature, max_tokens, top_p, pinned, created_at, updated_at)
     VALUES (@id, @user_id, @title, @system_prompt, @model, @temperature, @max_tokens, @top_p, @pinned, @created_at, @updated_at)`
  ).run(conversation);

  return rowToConversation(conversation);
}

export function listConversations(userId: string): ConversationSummary[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT c.*,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
              (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message
       FROM conversations c
       WHERE c.user_id = @user_id
       ORDER BY c.pinned DESC, c.updated_at DESC`
    )
    .all({ user_id: userId }) as Array<ConversationRow & { message_count: number; last_message: string | null }>;

  return rows.map((row) => ({
    ...rowToConversation(row),
    messageCount: row.message_count,
    lastMessagePreview: row.last_message ? row.last_message.slice(0, 140) : null,
  }));
}

export function getConversation(userId: string, id: string): ConversationWithMessages {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(id, userId) as
    | ConversationRow
    | undefined;
  if (!row) throw new AppError('Conversation not found.', 404);

  const messageRows = db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(id) as MessageRow[];

  return {
    ...rowToConversation(row),
    messages: messageRows.map(rowToMessage),
  };
}

export function updateConversation(userId: string, id: string, body: UpdateConversationBody): Conversation {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(id, userId) as
    | ConversationRow
    | undefined;
  if (!existing) throw new AppError('Conversation not found.', 404);

  if (body.model) {
    const modelDef = getModelById(body.model);
    if (!modelDef) throw new AppError(`Unknown model "${body.model}".`, 400);
  }

  const updated: ConversationRow = {
    ...existing,
    title: body.title?.trim() || existing.title,
    system_prompt: body.systemPrompt ?? existing.system_prompt,
    model: body.model ?? existing.model,
    temperature: body.temperature ?? existing.temperature,
    max_tokens: body.maxTokens ?? existing.max_tokens,
    top_p: body.topP ?? existing.top_p,
    pinned: body.pinned === undefined ? existing.pinned : body.pinned ? 1 : 0,
    updated_at: new Date().toISOString(),
  };

  db.prepare(
    `UPDATE conversations SET
       title = @title, system_prompt = @system_prompt, model = @model,
       temperature = @temperature, max_tokens = @max_tokens, top_p = @top_p,
       pinned = @pinned, updated_at = @updated_at
     WHERE id = @id AND user_id = @user_id`
  ).run({ ...updated, user_id: userId });

  return rowToConversation(updated);
}

export function touchConversation(userId: string, id: string): void {
  const result = getDatabase()
    .prepare('UPDATE conversations SET updated_at = ? WHERE id = ? AND user_id = ?')
    .run(new Date().toISOString(), id, userId);
  if (result.changes === 0) {
    throw new AppError('Conversation not found.', 404);
  }
}

export function deleteConversation(userId: string, id: string): void {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(id, userId);
  if (result.changes === 0) throw new AppError('Conversation not found.', 404);
}

export function searchConversations(userId: string, query: string): ConversationSummary[] {
  const db = getDatabase();
  const trimmed = query.trim();
  if (!trimmed) return listConversations(userId);

  // Match conversations by title OR by full-text search over their messages.
  const ftsQuery = trimmed
    .split(/\s+/)
    .map((term) => `"${term.replace(/"/g, '')}"*`)
    .join(' ');

  const rows = db
    .prepare(
      `SELECT DISTINCT c.*,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
              (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message
       FROM conversations c
       LEFT JOIN messages msg ON msg.conversation_id = c.id
       LEFT JOIN messages_fts fts ON fts.rowid = msg.rowid
       WHERE c.user_id = @user_id AND (c.title LIKE @like OR messages_fts MATCH @fts)
       ORDER BY c.pinned DESC, c.updated_at DESC`
    )
    .all({ user_id: userId, like: `%${trimmed}%`, fts: ftsQuery }) as Array<
    ConversationRow & { message_count: number; last_message: string | null }
  >;

  return rows.map((row) => ({
    ...rowToConversation(row),
    messageCount: row.message_count,
    lastMessagePreview: row.last_message ? row.last_message.slice(0, 140) : null,
  }));
}

// --- messages -----------------------------------------------------------

export function addMessage(
  userId: string,
  conversationId: string,
  role: MessageRole,
  content: string,
  extra: { stopped?: boolean; error?: string | null } = {}
): Message {
  const db = getDatabase();
  const owns = db.prepare('SELECT 1 FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
  if (!owns) {
    throw new AppError('Conversation not found.', 404);
  }

  const row: MessageRow = {
    id: nanoid(),
    conversation_id: conversationId,
    role,
    content,
    stopped: extra.stopped ? 1 : 0,
    error: extra.error ?? null,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO messages (id, conversation_id, role, content, stopped, error, created_at)
     VALUES (@id, @conversation_id, @role, @content, @stopped, @error, @created_at)`
  ).run(row);
  touchConversation(userId, conversationId);
  return rowToMessage(row);
}

export function deleteMessage(messageId: string): void {
  const result = getDatabase().prepare('DELETE FROM messages WHERE id = ?').run(messageId);
  if (result.changes === 0) throw new AppError('Message not found.', 404);
}

/** Deletes a message and everything after it in the conversation — used by Regenerate. */
export function deleteMessagesFrom(userId: string, conversationId: string, fromCreatedAt: string): void {
  const db = getDatabase();
  const owns = db.prepare('SELECT 1 FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
  if (!owns) {
    throw new AppError('Conversation not found.', 404);
  }

  db.prepare('DELETE FROM messages WHERE conversation_id = ? AND created_at >= ?').run(conversationId, fromCreatedAt);
}

export function getMessages(userId: string, conversationId: string): Message[] {
  const db = getDatabase();
  const owns = db.prepare('SELECT 1 FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
  if (!owns) {
    throw new AppError('Conversation not found.', 404);
  }

  const rows = db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(conversationId) as MessageRow[];
  return rows.map(rowToMessage);
}

/**
 * Auto-titles a conversation from its first user message the first time a
 * reply completes, if the title is still the default placeholder.
 */
export function maybeAutoTitle(userId: string, conversationId: string, firstUserMessage: string): void {
  const db = getDatabase();
  const row = db.prepare('SELECT title FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, userId) as
    | { title: string }
    | undefined;
  if (!row || row.title !== 'New chat') return;

  const title = firstUserMessage.trim().slice(0, 60) || 'New chat';
  db.prepare('UPDATE conversations SET title = ? WHERE id = ? AND user_id = ?').run(title, conversationId, userId);
}

// --- long-chat handling -----------------------------------------------------

/** Rough token estimate: ~4 characters per token for English text. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Builds the message array to send to the model, keeping the system prompt
 * and as much recent history as fits the model's context window (reserving
 * room for the reply itself). Oldest turns are dropped first. This is what
 * lets Atlas AI "handle long chats gracefully" instead of erroring once a
 * model's context window is exceeded.
 */
export function buildPromptHistory(
  conversation: Conversation,
  messages: Message[]
): Pick<Message, 'role' | 'content'>[] {
  const modelDef = getModelById(conversation.model);
  const contextWindow = modelDef?.contextWindow ?? 8192;
  const reserved = conversation.maxTokens + 512; // headroom for the reply + prompt overhead
  const budget = Math.max(contextWindow - reserved, 1024);

  const system = conversation.systemPrompt.trim()
    ? [{ role: 'system' as const, content: conversation.systemPrompt }]
    : [];
  const systemTokens = system.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  const kept: Pick<Message, 'role' | 'content'>[] = [];
  let used = systemTokens;

  // Walk backwards from the most recent message, keeping as many as fit.
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const tokens = estimateTokens(msg.content);
    if (used + tokens > budget && kept.length > 0) break;
    kept.unshift({ role: msg.role, content: msg.content });
    used += tokens;
  }

  return [...system, ...kept];
}
