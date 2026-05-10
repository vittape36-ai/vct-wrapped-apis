/**
 * Standardized VCT API response format.
 *
 * Success: { ok: true, data: {...}, meta: {...} }
 * Error:   { ok: false, error: { code, message } }
 */

export function ok(res, data, meta = {}, status = 200) {
  return res.status(status).json({
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

export function fail(res, status = 500, message = 'Internal error', code = 'INTERNAL_ERROR') {
  return res.status(status).json({
    ok: false,
    error: {
      code,
      message,
    },
  });
}
