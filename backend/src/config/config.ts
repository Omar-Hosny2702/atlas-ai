/**
 * Centralized, validated application configuration.
 * Every environment variable the app reads is resolved here, once, so the
 * rest of the codebase never touches `process.env` directly.
 */
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_MODEL_ID } from '../ai/modelConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..', '..');

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: readInt('PORT', 8787),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  ollamaHost: process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434',
  defaultModel: process.env.DEFAULT_MODEL ?? 'gemini-2.5-flash',
  databasePath: path.isAbsolute(process.env.DATABASE_PATH ?? '')
    ? (process.env.DATABASE_PATH as string)
    : path.resolve(backendRoot, process.env.DATABASE_PATH ?? './data/atlas.db'),
  rateLimitPerMinute: readInt('RATE_LIMIT_PER_MINUTE', 30),
  logLevel: (process.env.LOG_LEVEL ?? 'info') as 'error' | 'warn' | 'info' | 'debug',
  isProduction: process.env.NODE_ENV === 'production',
};
