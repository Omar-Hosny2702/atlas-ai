import { apiFetch } from './client';
import type { SettingsOptions } from '@/types';

export function getSettingsOptions(): Promise<SettingsOptions> {
  return apiFetch<SettingsOptions>('/settings/options');
}
