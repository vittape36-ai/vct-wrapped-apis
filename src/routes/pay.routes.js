import { Router } from 'express';
import { createOrder, payout, verifyWebhook, fetchPayment } from '../services/pay.service.js';
import { ok, fail } from '../utils/response.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(strictLimiter);

/**
 * POST /pay/v1/order
 * Body: { amount, currency?, receipt?, notes? }
 */
router.post('/v1/order', async (req, res, next) => {
  try {
    const result = await createOrder(req.body);
    return ok(res, result, { wrapper: 'pay.vidyacoddle.tech' });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /pay/v1/payout
 * Body: { amount, account, purpose?, idempotencyKey, splits? }
 */
router.post('/v1/payout', async (req, res, next) => {
  try {
    const { amount, account, purpose, idempotencyKey, splits } = req.body;

    if (!amount || !account) {
      return fail(res, 400, 'amount and account are required');
    }
    if (!idempotencyKey) {
      return fail(res, 400, 'idempotencyKey is required to prevent double payouts');
    }

    const result = await payout({ amount, account, purpose, idempotencyKey, splits });
    return ok(res, result, { wrapper: 'pay.vidyacoddle.tech' });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /pay/v1/webhook
 * Razorpay webhook receiver. No API key auth — uses signature verification.
 */
router.post('/v1/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) return fail(res, 400, 'Missing x-razorpay-signature header');

    const result = verifyWebhook(req.body, signature);
    return ok(res, result, { wrapper: 'pay.vidyacoddle.tech' });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /pay/v1/payment/:id
 * Fetch payment details.
 */
router.get('/v1/payment/:id', async (req, res, next) => {
  try {
    const result = await fetchPayment(req.params.id);
    return ok(res, result, { wrapper: 'pay.vidyacoddle.tech' });
  } catch (err) {
    return next(err);
  }
});

export default router;
