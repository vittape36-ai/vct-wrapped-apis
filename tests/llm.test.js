import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('LLM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should instantiate VCT class and expose llm service', async () => {
    const { VCT } = await import('../src/index.js');
    const vct = new VCT({
      llm: { openaiKey: 'fake', geminiKey: 'fake' }
    });
    expect(typeof vct.llm.chat).toBe('function');
    expect(typeof vct.llm.listModels).toBe('function');
  });

  it('listModels should return provider-grouped models', async () => {
    const { VCT } = await import('../src/index.js');
    const vct = new VCT({
      llm: { openaiKey: 'fake', geminiKey: 'fake' }
    });
    const result = vct.llm.listModels();
    expect(result).toHaveProperty('openai');
    expect(result).toHaveProperty('gemini');
    expect(Array.isArray(result.openai.models)).toBe(true);
    expect(Array.isArray(result.gemini.models)).toBe(true);
  });
});
