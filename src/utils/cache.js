import { getRedis } from '../config/redis.js';
import { logger } from '../middleware/logger.js';

/**
 * Get a cached value. Returns null on miss or Redis error.
 */
export async function cacheGet(key) {
  try {
    const redis = getRedis();
    const val = await redis.get(key);
    if (val) {
      logger.debug({ message: 'Cache HIT', key });
      return JSON.parse(val);
    }
    logger.debug({ message: 'Cache MISS', key });
    return null;
  } catch {
    return null; // degrade gracefully
  }
}

/**
 * Set a cached value with TTL (seconds).
 */
export async function cacheSet(key, data, ttlSeconds = 3600) {
  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch {
    // cache write failures are non-fatal
  }
}

/**
 * Delete a cached key.
 */
export async function cacheDel(key) {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch {
    // non-fatal
  }
}

/**
 * Build a deterministic cache key from an object.
 */
export function cacheKey(prefix, params) {
  const sorted = JSON.stringify(params, Object.keys(params).sort());
  return `vct:${prefix}:${Buffer.from(sorted).toString('base64url')}`;
}
