import { fail } from '../utils/response.js';
import { cacheGet } from '../utils/cache.js';

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
    const tenantData = await cacheGet(`auth:apikey:${key}`);

    if (!tenantData) {
      return fail(res, 403, 'Invalid or revoked API key');
    }

    // Attach caller identity for logging
    req.vctCaller = { keyId: `${key.slice(0, 8)}...`, plan: tenantData.plan };
    next();
  } catch (err) {
    return fail(res, 500, 'Authentication service unavailable');
  }
}
