export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  stopped?: boolean;
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

export interface ModelDefinition {
  id: string;
  label: string;
  description: string;
  contextWindow: number;
  defaults: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

export interface SystemPromptPreset {
  id: string;
  name: string;
  prompt: string;
}

export interface ParamBounds {
  temperature: { min: number; max: number };
  maxTokens: { min: number; max: number };
  topP: { min: number; max: number };
}

export interface SettingsOptions {
  models: ModelDefinition[];
  defaultModel: string;
  paramBounds: ParamBounds;
  systemPromptPresets: SystemPromptPreset[];
  defaultSystemPrompt: string;
  ollama: {
    reachable: boolean;
    pulledModels: string[];
  };
}

export type Theme = 'light' | 'dark';

export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  text: string;
}

/** Streaming protocol events sent by the backend over SSE. */
export type StreamEvent =
  | { type: 'token'; token: string }
  | { type: 'done'; message: Message }
  | { type: 'error'; message: string; savedMessage?: Message };
