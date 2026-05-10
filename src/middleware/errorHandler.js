import { logger } from './logger.js';
import { fail } from '../utils/response.js';

/**
 * Catch-all error handler.
 * Logs the full error, returns a sanitized response.
 */
export function errorHandler(err, req, res, _next) {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const status = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message =
    status === 500 ? 'Something went wrong. We\'re on it.' : err.message;

  fail(res, status, message, code);
}
