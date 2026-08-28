import { apiFetch } from './client';
import type { SettingsOptions } from '@/types';

export interface UserPreferences {
  userId: string;
  tone: string;
  verbosity: string;
  personality: string;
  languageStyle: string;
  useEmojis: boolean;
  customInstructions: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  userId: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export function getSettingsOptions(): Promise<SettingsOptions> {
  return apiFetch<SettingsOptions>('/settings/options');
}

export function getPreferences(): Promise<UserPreferences> {
  return apiFetch<UserPreferences>('/settings/preferences');
}

export function updatePreferences(
  updates: Partial<{
    tone: string;
    verbosity: string;
    personality: string;
    languageStyle: string;
    useEmojis: boolean;
    customInstructions: string;
  }>
): Promise<UserPreferences> {
  return apiFetch<UserPreferences>('/settings/preferences', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export function addMemory(
  content: string,
  category = 'general'
): Promise<Memory> {
  return apiFetch<Memory>('/settings/memories', {
    method: 'POST',
    body: JSON.stringify({
      content,
      category,
    }),
  });
}

export function getMemories(): Promise<Memory[]> {
  return apiFetch<Memory[]>('/settings/memories');
}

export function deleteMemory(id: string): Promise<void> {
  return apiFetch<void>(`/settings/memories/${id}`, {
    method: 'DELETE',
  });
}

export function clearMemories(): Promise<void> {
  return apiFetch<void>('/settings/memories', {
    method: 'DELETE',
  });
}