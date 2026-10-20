/**
 * Central registry of models available to Atlas AI.
 * The backend validates model selections here, and the settings API exposes
 * this same registry so the model picker stays in sync with the providers.
 */

export interface ModelDefinition {
  /** Provider-specific model identifier. */
  id: string;
  /** Human-readable name shown in the UI. */
  label: string;
  /** Short description shown under the model name in Settings. */
  description: string;
  /** Approximate context window in tokens, used for history truncation. */
  contextWindow: number;
  /** Sensible default generation parameters for this model. */
  defaults: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    description: "Google's fast model for coding and agent workflows.",
    contextWindow: 1048576,
    defaults: { temperature: 0.7, maxTokens: 2048, topP: 0.9 },
  },
  {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon',
    description: "Google's advanced reasoning model for complex tasks.",
    contextWindow: 1048576,
    defaults: { temperature: 0.7, maxTokens: 2048, topP: 0.9 },
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: "Google's fast multimodal model.",
    contextWindow: 1048576,
    defaults: { temperature: 0.7, maxTokens: 2048, topP: 0.9 },
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: "Google's most capable reasoning model.",
    contextWindow: 1048576,
    defaults: { temperature: 0.7, maxTokens: 2048, topP: 0.9 },
  },
  {
    id: 'nvidia/nemotron-3.5-super-vl-120b-a12b',
    label: 'NVIDIA Nemotron 3.5 Super VL',
    description: "NVIDIA's multimodal model for reasoning, coding, and image understanding.",
    contextWindow: 262144,
    defaults: { temperature: 1, maxTokens: 4096, topP: 0.95 },
  },
];

export const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id;

export function getModelById(id: string): ModelDefinition | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}

/** Hard safety bounds enforced server-side regardless of what the client sends. */
export const PARAM_BOUNDS = {
  temperature: { min: 0, max: 2 },
  maxTokens: { min: 1, max: 8192 },
  topP: { min: 0, max: 1 },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
