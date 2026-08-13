/**
 * ai/modelConfig.ts
 *
 * Central definition of the open-source language models Atlas AI knows how to
 * drive, plus the default generation parameters for each. This file is the
 * single source of truth for "what models exist" — the backend imports it to
 * validate requests, and the frontend's /api/settings/models endpoint mirrors
 * it to the UI so the model picker never drifts out of sync with reality.
 *
 * Atlas AI talks to models through Ollama (https://ollama.com), a local
 * runtime for open-source LLMs. Any model in Ollama's library can be added
 * here — nothing below is specific to one model family.
 */

export interface ModelDefinition {
  /** The identifier Ollama expects, e.g. "llama3.1:8b" */
  id: string;
  /** Human-readable name shown in the UI */
  label: string;
  /** Short description shown under the model name in Settings */
  description: string;
  /** Approximate context window in tokens, used for history truncation */
  contextWindow: number;
  /** Sensible default generation parameters for this model */
  defaults: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
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
