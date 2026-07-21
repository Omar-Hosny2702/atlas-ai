import type { Request, Response } from 'express';
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID, PARAM_BOUNDS } from '../../../ai/modelConfig.js';
import { SYSTEM_PROMPT_PRESETS, DEFAULT_SYSTEM_PROMPT } from '../../../ai/systemPrompts.js';
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
