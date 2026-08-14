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

const defaultCorsOrigin = process.env.VERCEL
  ? 'https://atlas-ai-beta-beryl.vercel.app'
  : 'http://localhost:5173';

function normalizeCorsOrigins(value: string | undefined, fallback: string): string[] {
  const raw = (value ?? fallback).replace(/\\/g, '');

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  port: readInt('PORT', 8787),
  corsOrigins: normalizeCorsOrigins(process.env.CORS_ORIGIN, defaultCorsOrigin),
  ollamaHost: process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434',
  defaultModel: process.env.DEFAULT_MODEL ?? 'gemini-2.5-flash',
  // Determine database path with the following precedence:
  // 1. Explicit absolute `DATABASE_PATH` env var
  // 2. If running on Vercel (serverless, read-only project fs), use a writable tmp path
  // 3. Otherwise default to a local file under the backend `data` folder
  databasePath: (() => {
    const explicit = process.env.DATABASE_PATH ?? '';
    if (path.isAbsolute(explicit) && explicit) return explicit;

    // Vercel sets `VERCEL`=1 and `VERCEL_ENV` — prefer that detection when present.
    const onVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
    if (onVercel) {
      const tmpDir = process.env.TMPDIR || '/tmp';
      // If no explicit path provided, use a sane default inside tmp.
      if (!explicit) return path.resolve(tmpDir, 'atlas.db');

      // If an explicit path was provided but is relative, place it under tmp
      if (!path.isAbsolute(explicit)) {
        return path.resolve(tmpDir, path.basename(explicit));
      }

      // If explicit is absolute, it was already handled above.
    }

    return path.resolve(backendRoot, process.env.DATABASE_PATH ?? './data/atlas.db');
  })(),
  rateLimitPerMinute: readInt('RATE_LIMIT_PER_MINUTE', 30),
  logLevel: (process.env.LOG_LEVEL ?? 'info') as 'error' | 'warn' | 'info' | 'debug',
  isProduction: process.env.NODE_ENV === 'production',
};
