import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { retry } from '../utils/retry.js';
import { logger } from '../middleware/logger.js';

let razorpay = null;

function getRazorpay() {
  if (!razorpay && config.pay.keyId) {
    razorpay = new Razorpay({
      key_id: config.pay.keyId,
      key_secret: config.pay.keySecret,
    });
  }
  return razorpay;
}

/**
 * Create a payment order.
 */
export async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const rz = getRazorpay();
  if (!rz) throw Object.assign(new Error('Razorpay not configured'), { statusCode: 503 });

  return retry(
    () =>
      rz.orders.create({
        amount: Math.round(amount * 100), // paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes,
      }),
    { retries: 2, label: 'pay:createOrder' }
  );
}

/**
 * Initiate a payout via RazorpayX.
 *
 * @param {Object} params
 * @param {number} params.amount       - Amount in INR
 * @param {string} params.account      - Fund account ID
 * @param {string} params.purpose      - "payout" | "refund" | "salary"
 * @param {string} params.idempotencyKey - Unique key to prevent double-payouts
 * @param {Array}  params.splits       - Optional vendor splits [{ vendor, share }]
 */
export async function payout({ amount, account, purpose = 'payout', idempotencyKey, splits = [] }) {
  const rz = getRazorpay();
  if (!rz) throw Object.assign(new Error('Razorpay not configured'), { statusCode: 503 });

  // If splits are provided, calculate per-vendor amounts
  if (splits.length > 0) {
    const totalShare = splits.reduce((s, v) => s + v.share, 0);
    if (Math.abs(totalShare - 1.0) > 0.001) {
      throw Object.assign(new Error('Vendor splits must sum to 1.0'), { statusCode: 400 });
    }

    const results = [];
    for (const split of splits) {
      const splitAmount = Math.round(amount * split.share * 100); // paise
      const result = await retry(
        () =>
          rz.payouts?.create?.({
            account_number: account,
            fund_account_id: split.vendor,
            amount: splitAmount,
            currency: 'INR',
            mode: 'IMPS',
            purpose,
            idempotency_key: `${idempotencyKey}_${split.vendor}`,
          }),
        { retries: 2, label: `pay:payout:${split.vendor}` }
      );
      results.push({ vendor: split.vendor, amount: splitAmount / 100, result });
    }
    return { type: 'split_payout', splits: results };
  }

  // Single payout
  return retry(
    () =>
      rz.payouts?.create?.({
        account_number: account,
        amount: Math.round(amount * 100),
        currency: 'INR',
        mode: 'IMPS',
        purpose,
        idempotency_key: idempotencyKey,
      }),
    { retries: 2, label: 'pay:payout' }
  );
}

/**
 * Verify Razorpay webhook signature.
 */
export function verifyWebhook(body, signature) {
  if (!config.pay.webhookSecret) {
    throw Object.assign(new Error('Webhook secret not configured'), { statusCode: 503 });
  }

  const expected = crypto
    .createHmac('sha256', config.pay.webhookSecret)
    .update(JSON.stringify(body))
    .digest('hex');

  if (expected !== signature) {
    throw Object.assign(new Error('Invalid webhook signature'), { statusCode: 401 });
  }

  logger.info({ message: 'Webhook verified', event: body.event });
  return { verified: true, event: body.event, payload: body.payload };
}

/**
 * Fetch payment details.
 */
export async function fetchPayment(paymentId) {
  const rz = getRazorpay();
  if (!rz) throw Object.assign(new Error('Razorpay not configured'), { statusCode: 503 });

  return retry(() => rz.payments.fetch(paymentId), { retries: 2, label: 'pay:fetch' });
}
