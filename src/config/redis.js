import Redis from 'ioredis';
import { config } from './env.js';

let redisInstance = null;

class InMemoryRedis {
  constructor() {
    this.store = new Map();
    this.status = 'ready';
    // Pre-seed default key for easy offline development testing
    this.store.set('auth:apikey:vct_live_123', JSON.stringify({ plan: 'premium', rateLimit: 100 }));
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, ...args) {
    let ttlSeconds = null;
    const exIndex = args.indexOf('EX');
    if (exIndex !== -1 && args[exIndex + 1]) {
      ttlSeconds = parseInt(args[exIndex + 1], 10);
    }
    this.store.set(key, value);
    if (ttlSeconds) {
      setTimeout(() => this.store.delete(key), ttlSeconds * 1000);
    }
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  on() {}
  once() {}
  quit() { return Promise.resolve(); }
  disconnect() {}
  connect() { return Promise.resolve(); }
}

export function getRedis() {
  if (!redisInstance) {
    const client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 1) return null; // fail fast to switch to fallback
        return 10;
      },
      lazyConnect: true,
    });

    client.on('error', (err) => {
      if (!(redisInstance instanceof InMemoryRedis)) {
        console.warn('⚠️  Redis connection error (switching to in-memory fallback):', err.message);
        redisInstance = new InMemoryRedis();
      }
    });

    redisInstance = client;
  }
  return redisInstance;
}

/**
 * Gracefully close Redis on shutdown.
 */
export async function closeRedis() {
  if (redisInstance) {
    if (typeof redisInstance.quit === 'function') {
      await redisInstance.quit();
    }
    redisInstance = null;
  }
}
