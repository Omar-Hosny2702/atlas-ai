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
    ? String.fromCharCode(104,116,116,112,115,58,47,47,97,116,108,97,115,45,97,105,45,98,101,116,97,45,98,101,114,121,108,46,118,101,114,99,101,108,46,97,112,112)
    : String.fromCharCode(104,116,116,112,58,47,47,108,111,99,97,108,104,111,115,116,58,53,49,55,51);

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
    'gemini-3.8-flash',

  auth0Domain:
    process.env.AUTH0_DOMAIN ?? '',

  auth0Audience:
    process.env.AUTH0_AUDIENCE ?? '',

  auth0Issuer:
    process.env.AUTH0_ISSUER ?? '',

  auth0ManagementClientId:
    process.env.AUTH0_MANAGEMENT_CLIENT_ID ?? '',

  auth0ManagementClientSecret:
    process.env.AUTH0_MANAGEMENT_CLIENT_SECRET ?? '',

  atlasOwnerUserId:
    process.env.ATLAS_OWNER_USER_ID ?? '',

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
