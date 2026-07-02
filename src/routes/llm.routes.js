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
    next(err);
    return;
  }
});

/**
 * GET /llm/v1/models
 * List available models and providers.
 */
router.get('/v1/models', (_req, res) => {
  return ok(res, listModels(), { wrapper: 'llm.vidyacoddle.tech' });
});

export default router;
