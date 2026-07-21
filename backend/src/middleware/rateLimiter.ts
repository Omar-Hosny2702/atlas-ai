import { rateLimit } from 'express-rate-limit';
import { config } from '../config/config.js';

/**
 * Limits how many chat requests a single client can fire per minute.
 * Generation is expensive (it occupies the local model), so this protects
 * against runaway loops in the UI or misbehaving scripts, not abuse from
 * the public internet — Atlas AI is meant to run locally or on a trusted
 * network.
 */
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.rateLimitPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before sending another message.' },
});
