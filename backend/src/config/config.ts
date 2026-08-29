/**
 * Centralized, validated application configuration.
 * Every environment variable the app reads is resolved here, once.
 */

import 'dotenv/config';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

function readInt(
  name: string,
  fallback: number
): number {
  const raw = process.env[name];

  if (!raw) return fallback;

  const parsed = parseInt(raw, 10);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

const defaultCorsOrigin =
  process.env.VERCEL
    ? 'https://atlas-ai-beta-beryl.vercel.app'
    : 'http://localhost:5173';

function normalizeCorsOrigins(
  value: string | undefined,
  fallback: string
): string[] {
  const raw = (
    value ?? fallback
  ).replace(/\/+$/g, '');

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const auth0DisabledSetting =
  process.env.AUTH0_DISABLED ??
  'true';

export const config = {
  port: readInt('PORT', 8787),

  corsOrigins:
    normalizeCorsOrigins(
      process.env.CORS_ORIGIN,
      defaultCorsOrigin
    ),

  ollamaHost:
    process.env.OLLAMA_HOST ??
    'http://127.0.0.1:11434',

  defaultModel:
    process.env.DEFAULT_MODEL ??
    'gemini-2.5-flash',

  auth0Domain:
    process.env.AUTH0_DOMAIN ?? '',

  auth0Audience:
    process.env.AUTH0_AUDIENCE ?? '',

  auth0Issuer:
    process.env.AUTH0_ISSUER ?? '',

  auth0Disabled:
    auth0DisabledSetting.toLowerCase() ===
      'true' ||
    (
      !process.env.AUTH0_DOMAIN &&
      !process.env.AUTH0_AUDIENCE &&
      !process.env.AUTH0_ISSUER
    ),

  databaseUrl:
    process.env.DATABASE_URL ?? '',

  attachmentUploadSecret:
    process.env
      .ATTACHMENT_UPLOAD_SECRET ??
    '',

  rateLimitPerMinute:
    readInt(
      'RATE_LIMIT_PER_MINUTE',
      30
    ),

  logLevel:
    (
      process.env.LOG_LEVEL ??
      'info'
    ) as
      | 'error'
      | 'warn'
      | 'info'
      | 'debug',

  isProduction:
    process.env.NODE_ENV ===
    'production',
};