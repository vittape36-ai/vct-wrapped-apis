import { Router } from 'express';
import { chat, listModels } from '../services/llm.service.js';
import { ok, fail } from '../utils/response.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Rate limit: 30 req/min for LLM (expensive)
router.use(strictLimiter);

/**
 * POST /llm/v1/chat
 * Body: { messages, model?, provider?, cache?, options? }
 */
router.post('/v1/chat', async (req, res, next) => {
  try {
    const { messages, model, provider, cache, options } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return fail(res, 400, 'messages array is required');
    }

    const result = await chat({ messages, model, provider, cache, options });
    return ok(res, result, { wrapper: 'llm.vidyacoddle.tech' });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /llm/v1/models
 * List available models and providers.
 */
router.get('/v1/models', (_req, res) => {
  return ok(res, listModels(), { wrapper: 'llm.vidyacoddle.tech' });
});

/**
 * POST /llm/v1/chat/stream
 * Stream responses using Server-Sent Events (SSE)
 */
router.post('/v1/chat/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { streamOpenAI } = await import('../services/llm.service.js');
    const stream = await streamOpenAI(req.body.messages, req.body.model);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

export default router;
