import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/config.js';
import { AppError } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        claims: Record<string, unknown>;
      };
    }
  }
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64').toString('utf8');
}

function normalizeAuth0Url(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  return `https://${trimmed}`.replace(/\/$/, '') + '/';
}

function getAuth0JwksUrl(): URL | null {
  const domain = config.auth0Domain.trim();
  if (!domain) return null;
  return new URL('.well-known/jwks.json', normalizeAuth0Url(domain));
}

function getAuth0Issuer(): string {
  return config.auth0Issuer || normalizeAuth0Url(config.auth0Domain);
}

async function fetchJwkByKid(kid: string): Promise<crypto.KeyObject> {
  const jwksUrl = getAuth0JwksUrl();
  if (!jwksUrl) {
    throw new AppError('Authentication is not configured on the backend.', 500);
  }

  const response = await fetch(jwksUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new AppError('Unable to load Auth0 signing keys.', 500);
  }

  const body = (await response.json()) as { keys?: Array<Record<string, string>> };
  const jwk = body.keys?.find((key) => key.kid === kid);
  if (!jwk) {
    throw new AppError('No matching Auth0 signing key was found.', 401);
  }

  return crypto.createPublicKey({
    key: {
      kty: 'RSA',
      n: jwk.n,
      e: jwk.e,
    },
    format: 'jwk',
  });
}

async function verifyAuthToken(token: string): Promise<{ userId: string; claims: Record<string, unknown> }> {
  const sections = token.split('.');
  if (sections.length !== 3) {
    throw new AppError('Authentication token is malformed.', 401);
  }

  const [headerB64, payloadB64, signatureB64] = sections;
  const header = JSON.parse(base64UrlDecode(headerB64)) as { alg?: string; kid?: string };
  const payload = JSON.parse(base64UrlDecode(payloadB64)) as Record<string, unknown>;

  if (header.alg !== 'RS256') {
    throw new AppError('Unsupported authentication token algorithm.', 401);
  }

  const verifierKey = await fetchJwkByKid(header.kid ?? '');
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = Buffer.from(signatureB64, 'base64url');
  const valid = crypto.verify('RSA-SHA256', Buffer.from(signingInput), verifierKey, signature);
  if (!valid) {
    throw new AppError('Invalid authentication token signature.', 401);
  }

  const issuer = getAuth0Issuer();
  const audience = config.auth0Audience;
  if (typeof payload.iss !== 'string' || payload.iss !== issuer) {
    throw new AppError('Authentication token issuer is invalid.', 401);
  }

  if (
    (typeof payload.aud === 'string' && payload.aud !== audience) ||
    (Array.isArray(payload.aud) && !payload.aud.includes(audience))
  ) {
    throw new AppError('Authentication token audience is invalid.', 401);
  }

  if (typeof payload.exp !== 'number' && typeof payload.exp !== 'string') {
    throw new AppError('Authentication token is missing an expiration claim.', 401);
  }

  const expirationMs = Number(payload.exp) * 1000;
  if (Number.isFinite(expirationMs) && expirationMs <= Date.now()) {
    throw new AppError('Authentication token has expired.', 401);
  }

  const userId = typeof payload.sub === 'string' ? payload.sub : undefined;
  if (!userId) {
    throw new AppError('Authenticated user is missing.', 401);
  }

  return { userId, claims: payload };
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (config.auth0Disabled) {
      req.auth = { userId: 'local-dev-user', claims: { sub: 'local-dev-user' } };
      next();
      return;
    }

    const authorization = req.headers.authorization;
    if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
      throw new AppError('Authentication required.', 401);
    }

    const token = authorization.slice(7).trim();
    if (!token) {
      throw new AppError('Authentication required.', 401);
    }

    const verified = await verifyAuthToken(token);
    req.auth = verified;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (error instanceof Error) {
      next(new AppError('Invalid or expired authentication token.', 401));
      return;
    }

    next(error);
  }
}
