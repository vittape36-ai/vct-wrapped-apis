import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Per-key rate limiter.
 * Defaults: 100 requests / 60 seconds per API key.
 * In production, swap MemoryStore for RedisStore.
 */
export function createRateLimiter({ windowMs = 60_000, max = 100 } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
    message: {
      ok: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Limit: ${max} per ${windowMs / 1000}s.`,
      },
    },
  });
}

// Default limiter for all wrapped routes
export const defaultLimiter = createRateLimiter();

// Stricter limiter for expensive operations (LLM, Pay)
export const strictLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });
