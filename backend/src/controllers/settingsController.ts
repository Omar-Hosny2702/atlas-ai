import type { Request, Response } from 'express';
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

import { SYSTEM_PROMPT_PRESETS, DEFAULT_SYSTEM_PROMPT } from '../ai/systemPrompts.js';
import { checkOllamaHealth } from '../services/llmService.js';

export async function handleGetSettingsOptions(_req: Request, res: Response): Promise<void> {
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
