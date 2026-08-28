import type { Request, Response } from 'express';
import { z } from 'zod';

import { SYSTEM_PROMPT_PRESETS, DEFAULT_SYSTEM_PROMPT } from '../ai/systemPrompts.js';
import { checkOllamaHealth } from '../services/llmService.js';

import {
  getPreferences,
  updatePreferences,
} from '../services/preferenceService.js';

import {
  getMemories,
  deleteMemory,
  clearMemories,
} from '../services/memoryService.js';

const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: "Google's fast multimodal model.",
    contextWindow: 1048576,
    defaults: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
    },
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: "Google's most capable reasoning model.",
    contextWindow: 1048576,
    defaults: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
    },
  },
];

const DEFAULT_MODEL_ID = 'gemini-2.5-flash';

const PARAM_BOUNDS = {
  temperature: { min: 0, max: 2 },
  maxTokens: { min: 1, max: 8192 },
  topP: { min: 0, max: 1 },
};

export const updatePreferencesSchema = z.object({
  tone: z.string().max(50).optional(),
  verbosity: z.string().max(50).optional(),
  personality: z.string().max(50).optional(),
  languageStyle: z.string().max(50).optional(),
  useEmojis: z.boolean().optional(),
  customInstructions: z.string().max(4000).optional(),
});

export async function handleGetSettingsOptions(
  _req: Request,
  res: Response
): Promise<void> {
  const ollama = await checkOllamaHealth();

  res.json({
    models: AVAILABLE_MODELS,
    defaultModel: DEFAULT_MODEL_ID,
    paramBounds: PARAM_BOUNDS,
    systemPromptPresets: SYSTEM_PROMPT_PRESETS,
    defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
    ollama: {
      reachable: ollama.reachable,
      pulledModels: ollama.models,
    },
  });
}

export async function handleGetPreferences(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';

  const preferences = await getPreferences(userId);

  res.json(preferences);
}

export async function handleUpdatePreferences(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';

  const updates = updatePreferencesSchema.parse(req.body);

  const preferences = await updatePreferences(userId, updates);

  res.json(preferences);
}

export async function handleGetMemories(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';

  const memories = await getMemories(userId);

  res.json(memories);
}

export async function handleDeleteMemory(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';

  await deleteMemory(userId, req.params.id);

  res.status(204).send();
}

export async function handleClearMemories(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';

  await clearMemories(userId);

  res.status(204).send();
}