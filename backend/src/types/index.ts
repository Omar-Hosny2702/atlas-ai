export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string; // ISO timestamp
  /** Present when generation was interrupted by the user (Stop button). */
  stopped?: boolean;
  /** Present when generation errored out. */
  error?: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ConversationSummary extends Conversation {
  messageCount: number;
  lastMessagePreview: string | null;
}

export interface ChatRequestBody {
  conversationId: string;
  content: string;
  /** Optional per-request overrides; falls back to the conversation's stored settings. */
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  model?: string;
}

export interface CreateConversationBody {
  title?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface UpdateConversationBody {
  title?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  pinned?: boolean;
}

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
