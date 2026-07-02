import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { KeyVault } from '../utils/keyVault.js';
import { retry } from '../utils/retry.js';
import { cacheGet, cacheSet, cacheKey } from '../utils/cache.js';
import { logger } from '../middleware/logger.js';

// --- Key Vaults ---
const openaiVault = new KeyVault(config.llm.openaiKeys);
const geminiVault = new KeyVault(config.llm.geminiKeys);

// --- Model Mapping ---
const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
};

/**
 * Chat completion via OpenAI.
 */
async function chatOpenAI(messages, model, options = {}) {
  const apiKey = openaiVault.next();
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
    if (err.status === 429) openaiVault.cooldown(apiKey, 60_000);
    throw err;
  }
}

/**
 * Chat completion via Gemini.
 */
async function chatGemini(messages, model, _options = {}) {
  const apiKey = geminiVault.next();
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model: model || DEFAULT_MODELS.gemini });

    // Convert OpenAI-style messages to Gemini format
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
    if (err.message?.includes('429')) geminiVault.cooldown(apiKey, 60_000);
    throw err;
  }
}

// --- Provider Map ---
const providers = { openai: chatOpenAI, gemini: chatGemini };

/**
 * Main chat function with caching + fallback.
 *
 * @param {Object} params
 * @param {Array}  params.messages     - OpenAI-format messages
 * @param {string} params.model        - "auto" | specific model name
 * @param {string} params.provider     - "openai" | "gemini" | "auto"
 * @param {boolean} params.cache       - Enable response caching (default true)
 * @param {Object} params.options      - temperature, maxTokens, etc.
 */
export async function chat({ messages, model = 'auto', provider = 'auto', cache = true, options = {} }) {
  // Check cache
  if (cache) {
    const key = cacheKey('llm:chat', { messages, model, provider });
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };
  }

  const primary = provider === 'auto' ? config.llm.defaultProvider : provider;
  const fallback = primary === 'openai' ? 'gemini' : 'openai';
  const modelName = model === 'auto' ? undefined : model;

  let result;
  try {
    result = await retry(() => providers[primary](messages, modelName, options), {
      retries: 2,
      label: `llm:${primary}`,
    });
  } catch (primaryErr) {
    logger.warn({ message: `Primary LLM (${primary}) failed, falling back to ${fallback}`, error: primaryErr.message });
    result = await retry(() => providers[fallback](messages, undefined, options), {
      retries: 2,
      label: `llm:${fallback}`,
    });
    result.fallback = true;
  }

  // Cache result
  if (cache) {
    const key = cacheKey('llm:chat', { messages, model, provider });
    await cacheSet(key, result, config.llm.cacheTtl);
  }

  return result;
}

/**
 * List available models.
 */
export function listModels() {
  return {
    openai: {
      available: openaiVault.size > 0,
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      default: DEFAULT_MODELS.openai,
    },
    gemini: {
      available: geminiVault.size > 0,
      models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
      default: DEFAULT_MODELS.gemini,
    },
  };
}
