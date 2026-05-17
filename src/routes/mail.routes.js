import { Router } from 'express';
import { send, sendBatch, listTemplates } from '../services/mail.service.js';
import { ok, fail } from '../utils/response.js';

const router = Router();

/**
 * POST /mail/v1/send
 * Body: { to, subject?, html?, text?, from?, replyTo?, template?, data? }
 */
router.post('/v1/send', async (req, res, next) => {
  try {
    const { to } = req.body;
    if (!to) return fail(res, 400, 'to address is required');

    const result = await send(req.body);
    ok(res, result, { wrapper: 'mail.vidyacoddle.tech' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /mail/v1/batch
 * Body: { emails: [{ to, subject, html, ... }] }
 */
router.post('/v1/batch', async (req, res, next) => {
  try {
    const { emails } = req.body;
    if (!emails) return fail(res, 400, 'emails array is required');

    const results = await sendBatch(emails);
    ok(res, results, { wrapper: 'mail.vidyacoddle.tech', count: results.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /mail/v1/templates
 * List available email templates.
 */
router.get('/v1/templates', (_req, res) => {
  ok(res, { templates: listTemplates() }, { wrapper: 'mail.vidyacoddle.tech' });
});

export default router;
