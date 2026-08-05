import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { KeyVault } from '../utils/keyVault.js';
import { retry } from '../utils/retry.js';

const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
};

export class LLMService {
  constructor(config = {}) {
    this.config = config;
    const openaiKeys = Array.isArray(config.openaiKeys) ? config.openaiKeys : (config.openaiKey ? [config.openaiKey] : []);
    const geminiKeys = Array.isArray(config.geminiKeys) ? config.geminiKeys : (config.geminiKey ? [config.geminiKey] : []);
    
    this.openaiVault = new KeyVault(openaiKeys);
    this.geminiVault = new KeyVault(geminiKeys);
    this.defaultProvider = config.defaultProvider || 'openai';
  }

  async chatOpenAI(messages, model, options = {}) {
    const apiKey = this.openaiVault.next();
    try {
      const client = new OpenAI({ apiKey });
      const res = await client.chat.completions.create({
        model: model || DEFAULT_MODELS.openai,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
      });
      return {
        provider: 'openai',
        model: res.model,
        content: res.choices[0]?.message?.content || '',
        usage: res.usage,
      };
    } catch (err) {
      if (err.status === 429) this.openaiVault.cooldown(apiKey, 60_000);
      throw err;
    }
  }

  async chatGemini(messages, model, _options = {}) {
    const apiKey = this.geminiVault.next();
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const genModel = genAI.getGenerativeModel({ model: model || DEFAULT_MODELS.gemini });

      const history = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const lastMsg = history.pop();
      const chat = genModel.startChat({ history });
      const result = await chat.sendMessage(lastMsg.parts[0].text);
      const text = result.response.text();

      return {
        provider: 'gemini',
        model: model || DEFAULT_MODELS.gemini,
        content: text,
        usage: { prompt_tokens: null, completion_tokens: null },
      };
    } catch (err) {
      if (err.message?.includes('429')) this.geminiVault.cooldown(apiKey, 60_000);
      throw err;
    }
  }

  async chat({ messages, model = 'auto', provider = 'auto', options = {} }) {
    const primary = provider === 'auto' ? this.defaultProvider : provider;
    const fallback = primary === 'openai' ? 'gemini' : 'openai';
    const modelName = model === 'auto' ? undefined : model;

    let result;
    try {
      const fn = primary === 'openai' ? this.chatOpenAI.bind(this) : this.chatGemini.bind(this);
      result = await retry(() => fn(messages, modelName, options), {
        retries: 2,
        label: `llm:${primary}`,
      });
    } catch (primaryErr) {
      console.warn(JSON.stringify({ message: `Primary LLM (${primary}) failed, falling back to ${fallback}`, error: primaryErr.message }));
      const fallbackFn = fallback === 'openai' ? this.chatOpenAI.bind(this) : this.chatGemini.bind(this);
      result = await retry(() => fallbackFn(messages, undefined, options), {
        retries: 2,
        label: `llm:${fallback}`,
      });
      result.fallback = true;
    }

    return result;
  }

  listModels() {
    return {
      openai: {
        available: this.openaiVault.size > 0,
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        default: DEFAULT_MODELS.openai,
      },
      gemini: {
        available: this.geminiVault.size > 0,
        models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
        default: DEFAULT_MODELS.gemini,
      },
    };
  }

  async streamOpenAI(messages, model) {
    const client = new OpenAI({ apiKey: this.openaiVault.next() });
    return client.chat.completions.create({
      model: model || DEFAULT_MODELS.openai,
      messages,
      stream: true,
    });
  }
}
