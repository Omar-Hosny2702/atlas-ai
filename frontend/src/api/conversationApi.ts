import { apiFetch, BASE_URL } from './client';
import { getAccessToken } from '@/auth/authClient';
import type { Conversation, ConversationSummary, ConversationWithMessages } from '@/types';

export interface CreateConversationInput {
  title?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface UpdateConversationInput extends Partial<CreateConversationInput> {
  pinned?: boolean;
}

export function listConversations(query?: string): Promise<ConversationSummary[]> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  return apiFetch<ConversationSummary[]>(`/conversations${qs}`);
}

export function getConversation(id: string): Promise<ConversationWithMessages> {
  return apiFetch<ConversationWithMessages>(`/conversations/${id}`);
}

export function createConversation(input: CreateConversationInput): Promise<Conversation> {
  return apiFetch<Conversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateConversation(
  id: string,
  input: UpdateConversationInput
): Promise<Conversation> {
  return apiFetch<Conversation>(`/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteConversation(id: string): Promise<void> {
  return apiFetch<void>(`/conversations/${id}`, { method: 'DELETE' });
}

export async function exportConversation(
  id: string,
  format: 'md' | 'txt' | 'json'
): Promise<string> {
  const token = getAccessToken();
  const response = await fetch(`${BASE_URL}/conversations/${id}/export?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (response.status === 401) {
    throw new Error('Authentication required. Please log in again.');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Could not export that conversation.');
  }

  return response.text();
}

export async function importConversations(payload: unknown): Promise<Conversation[]> {
  return apiFetch<Conversation[]>('/conversations/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
