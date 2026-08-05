import { Router } from 'express';
import { cacheSet, cacheGet } from '../utils/cache.js';
import { ok, fail } from '../utils/response.js';

const router = Router();

/**
 * GET /admin/v1/keys/:key
 * Retrieve key details. (Minimal implementation for demo)
 */
router.get('/v1/keys/:key', async (req, res) => {
  const data = await cacheGet(`auth:apikey:${req.params.key}`);
  if (!data) return fail(res, 404, 'Key not found');
  return ok(res, data);
});

/**
 * POST /admin/v1/keys
 * Create a new API key configuration.
 * Body: { key, plan, rateLimit }
 */
router.post('/v1/keys', async (req, res) => {
  const { key, plan, rateLimit } = req.body;
  if (!key) return fail(res, 400, 'Key is required');
  
  const data = { plan: plan || 'free', rateLimit: rateLimit || 100 };
  await cacheSet(`auth:apikey:${key}`, data, 86400 * 365); // 1 year TTL
  return ok(res, { key, ...data });
});

export default router;
