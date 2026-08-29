export type MessageRole =
  | 'system'
  | 'user'
  | 'assistant';

export interface ResearchSource {
  title: string;
  url: string;
}

export interface MessageMetadata {
  research?: {
    sources: ResearchSource[];
    searchQueries?: string[];
  };

  generatedImage?: {
    attachmentId?: string;
    storageUrl?: string;
    mimeType?: string;
    alt?: string;
  };

  attachments?: {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    kind: 'image' | 'file';
    storageUrl?: string | null;
  }[];

  [key: string]: unknown;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;

  /** Present when generation was interrupted by the user. */
  stopped?: boolean;

  /** Present when generation errored out. */
  error?: string | null;

  /** Structured message data such as sources and attachments. */
  metadata?: MessageMetadata;
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

export interface ConversationWithMessages
  extends Conversation {
  messages: Message[];
}

export interface ConversationSummary
  extends Conversation {
  messageCount: number;
  lastMessagePreview: string | null;
}

export interface ChatRequestBody {
  conversationId: string;
  content: string;

  /** Optional per-request overrides. */
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

  constructor(
    message: string,
    statusCode = 400
  ) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}