import Redis from 'ioredis';
import { config } from './env.js';

let redis = null;

export function getRedis() {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null;               // stop after 5 retries
        return Math.min(times * 200, 2000);        // exponential backoff
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.warn('⚠️  Redis connection error (cache disabled):', err.message);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }
  return redis;
}

/**
 * Gracefully close Redis on shutdown.
 */
export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
