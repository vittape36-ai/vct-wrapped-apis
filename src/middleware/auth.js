import { fail } from '../utils/response.js';
import { getRedis } from '../config/redis.js';

/**
 * Authenticate requests via x-api-key header.
 * Looks up keys from Redis for multi-tenant support.
 */
export async function authenticate(req, res, next) {
  const key = req.headers['x-api-key'];

  if (!key) {
    return fail(res, 401, 'Missing x-api-key header');
  }

  try {
    const redis = getRedis();
    const val = await redis.get(`auth:apikey:${key}`);

    if (!val) {
      return fail(res, 403, 'Invalid or revoked API key');
    }

    const tenantData = JSON.parse(val);

    // Attach caller identity for logging
    req.vctCaller = { keyId: `${key.slice(0, 8)}...`, plan: tenantData.plan };
    return next();
  } catch {
    return fail(res, 500, 'Authentication service unavailable');
  }
}
