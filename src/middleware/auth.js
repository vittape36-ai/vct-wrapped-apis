import { config } from '../config/env.js';
import { fail } from '../utils/response.js';

/**
 * Authenticate requests via x-api-key header.
 * In production, look up keys from a database.
 * For now, compare against VCT_MASTER_KEY.
 */
export function authenticate(req, res, next) {
  const key = req.headers['x-api-key'];

  if (!key) {
    return fail(res, 401, 'Missing x-api-key header');
  }

  // TODO: Replace with DB lookup for multi-tenant keys
  if (key !== config.vctMasterKey) {
    return fail(res, 403, 'Invalid API key');
  }

  // Attach caller identity for logging
  req.vctCaller = { keyId: key.slice(0, 8) + '...', plan: 'beta' };
  next();
}
