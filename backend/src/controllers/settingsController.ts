import type { Request, Response } from 'express';
import { z } from 'zod';

import {
  SYSTEM_PROMPT_PRESETS,
  DEFAULT_SYSTEM_PROMPT,
} from '../ai/systemPrompts.js';

import { checkOllamaHealth } from '../services/llmService.js';

import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL_ID,
  PARAM_BOUNDS,
} from '../ai/modelConfig.js';

import {
  getMemories,
  addMemory,
  deleteMemory,
  clearMemories,
} from '../services/memoryService.js';

import {
  getPreferences,
  updatePreferences,
} from '../services/preferenceService.js';



export const updatePreferencesSchema = z.object({
  tone: z.string().max(50).optional(),
  verbosity: z.string().max(50).optional(),
  personality: z.string().max(50).optional(),
  languageStyle: z.string().max(50).optional(),
  useEmojis: z.boolean().optional(),
  customInstructions: z.string().max(4000).optional(),
});

export const addMemorySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Memory cannot be empty.')
    .max(1000, 'Memory is too long.'),
  category: z
    .string()
    .trim()
    .max(50)
    .optional(),
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
  const userId = req.auth!.userId;

  const preferences = await getPreferences(userId);

  res.json(preferences);
}

export async function handleUpdatePreferences(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth!.userId;

  const updates = updatePreferencesSchema.parse(req.body);

  const preferences = await updatePreferences(
    userId,
    updates
  );

  res.json(preferences);
}

export async function handleGetMemories(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth!.userId;

  const memories = await getMemories(userId);

  res.json(memories);
}

export async function handleAddMemory(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth!.userId;

  const { content, category } =
    addMemorySchema.parse(req.body);

  const memory = await addMemory(
    userId,
    content,
    category ?? 'general'
  );

  res.status(201).json(memory);
}

export async function handleDeleteMemory(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth!.userId;

  await deleteMemory(userId, req.params.id);

  res.status(204).send();
}

export async function handleClearMemories(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth!.userId;

  await clearMemories(userId);

  res.status(204).send();
}