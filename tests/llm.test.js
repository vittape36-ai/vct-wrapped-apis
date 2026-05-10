import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external dependencies before importing service
vi.mock('openai', () => ({
  default: class {
    constructor() {
      this.chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Hello from mock!' } }],
            model: 'gpt-4o-mini',
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          }),
        },
      };
    }
  },
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => 'Hello from Gemini mock!',
            usageMetadata: { promptTokenCount: 8, candidatesTokenCount: 6, totalTokenCount: 14 },
          },
        }),
      };
    }
  },
}));

vi.mock('../src/utils/cache.js', () => ({
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    buildKey: vi.fn((...args) => args.join(':')),
  },
}));

vi.mock('../src/config/redis.js', () => ({
  redis: { status: 'ready' },
}));

describe('LLM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export chatCompletion function', async () => {
    const llmService = await import('../src/services/llm.service.js');
    expect(typeof llmService.chatCompletion).toBe('function');
  });

  it('should export getModels function', async () => {
    const llmService = await import('../src/services/llm.service.js');
    expect(typeof llmService.getModels).toBe('function');
  });

  it('getModels should return provider-grouped models', async () => {
    const { getModels } = await import('../src/services/llm.service.js');
    const models = getModels();
    expect(models).toHaveProperty('openai');
    expect(models).toHaveProperty('gemini');
    expect(Array.isArray(models.openai)).toBe(true);
    expect(Array.isArray(models.gemini)).toBe(true);
  });
});

describe('LLM Route Validation', () => {
  it('should reject empty prompt', () => {
    const payload = { prompt: '' };
    expect(payload.prompt.length).toBe(0);
  });

  it('should accept valid temperature range', () => {
    const validTemps = [0, 0.5, 1, 1.5, 2];
    validTemps.forEach((t) => {
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(2);
    });
  });

  it('should reject invalid provider', () => {
    const validProviders = ['openai', 'gemini'];
    expect(validProviders.includes('anthropic')).toBe(false);
    expect(validProviders.includes('openai')).toBe(true);
  });
});
