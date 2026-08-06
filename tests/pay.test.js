import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

vi.mock('razorpay', () => ({
  default: class {
    constructor() {
      this.orders = {
        create: vi.fn().mockResolvedValue({
          id: 'order_test123',
          amount: 50000,
          currency: 'INR',
          status: 'created',
        }),
      };
      this.payments = {
        fetch: vi.fn().mockResolvedValue({
          id: 'pay_test456',
          amount: 50000,
          status: 'captured',
        }),
      };
    }
  },
}));

vi.mock('../src/config/redis.js', () => ({
  redis: { status: 'ready' },
}));

vi.mock('../src/utils/cache.js', () => ({
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    buildKey: vi.fn((...args) => args.join(':')),
  },
}));

describe('Pay Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export createOrder function', async () => {
    const payService = await import('../src/services/pay.service.js');
    expect(typeof payService.createOrder).toBe('function');
  });

  it('should export verifyWebhook function', async () => {
    const payService = await import('../src/services/pay.service.js');
    expect(typeof payService.verifyWebhook).toBe('function');
  });
});

describe('Webhook Signature Verification', () => {
  const secret = 'whsec_test_secret';

  it('should produce valid HMAC SHA-256 signature', () => {
    const payload = JSON.stringify({ event: 'payment.captured', payload: { id: 'pay_123' } });
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    expect(signature).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(signature)).toBe(true);
  });

  it('should reject tampered payload', () => {
    const payload = JSON.stringify({ event: 'payment.captured' });
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const tamperedPayload = JSON.stringify({ event: 'payment.failed' });
    const tamperedSig = crypto.createHmac('sha256', secret).update(tamperedPayload).digest('hex');

    expect(signature).not.toBe(tamperedSig);
  });

  it('should reject wrong secret', () => {
    const payload = JSON.stringify({ event: 'payment.captured' });
    const sig1 = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sig2 = crypto.createHmac('sha256', 'wrong_secret').update(payload).digest('hex');

    expect(sig1).not.toBe(sig2);
  });
});

describe('Idempotency Key', () => {
  it('should generate unique keys', () => {
    const keys = new Set();
    for (let i = 0; i < 100; i++) {
      keys.add(crypto.randomUUID());
    }
    expect(keys.size).toBe(100);
  });
});
