/**
 * Retry an async function with exponential backoff.
 *
 * @param {Function} fn        - Async function to retry
 * @param {Object}   opts
 * @param {number}   opts.retries    - Max retries (default 3)
 * @param {number}   opts.baseDelay  - Base delay in ms (default 200)
 * @param {number}   opts.maxDelay   - Max delay cap in ms (default 5000)
 * @param {string}   opts.label      - Label for logs
 * @returns {Promise<any>}
 */
export async function retry(fn, { retries = 3, baseDelay = 200, maxDelay = 5000, label = 'operation' } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === retries) break;

      const delay = Math.min(baseDelay * 2 ** attempt + Math.random() * 100, maxDelay);
      console.warn(JSON.stringify({
        message: `Retry ${attempt + 1}/${retries} for ${label}`,
        error: err.message,
        nextRetryMs: Math.round(delay),
      }));

      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}
