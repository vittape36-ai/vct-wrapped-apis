import Razorpay from 'razorpay';
import crypto from 'crypto';
import { retry } from '../utils/retry.js';

export class PayService {
  constructor(config = {}) {
    this.config = config;
    this.razorpay = null;
    if (config.keyId && config.keySecret) {
      this.razorpay = new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret,
      });
    }
  }

  getRazorpay() {
    if (!this.razorpay) throw new Error('Razorpay not configured');
    return this.razorpay;
  }

  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    const rz = this.getRazorpay();
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

  async payout({ amount, account, purpose = 'payout', idempotencyKey, splits = [] }) {
    const rz = this.getRazorpay();

    if (splits.length > 0) {
      const totalShare = splits.reduce((s, v) => s + v.share, 0);
      if (Math.abs(totalShare - 1.0) > 0.001) {
        throw new Error('Vendor splits must sum to 1.0');
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

  verifyWebhook(body, signature) {
    if (!this.config.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const expected = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expected !== signature) {
      throw new Error('Invalid webhook signature');
    }

    console.log(JSON.stringify({ message: 'Webhook verified', event: body.event }));
    return { verified: true, event: body.event, payload: body.payload };
  }

  async fetchPayment(paymentId) {
    const rz = this.getRazorpay();
    return retry(() => rz.payments.fetch(paymentId), { retries: 2, label: 'pay:fetch' });
  }
}
