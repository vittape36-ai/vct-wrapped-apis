import { describe, it, expect, vi } from 'vitest';

const mockGet = vi.fn();
vi.mock('../src/config/redis.js', () => ({
  getRedis: () => ({
    get: mockGet,
  }),
}));

describe('Response Helpers', () => {
  it('ok() should produce correct shape', async () => {
    const { ok } = await import('../src/utils/response.js');
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    ok(mockRes, { message: 'hello' }, { wrapper: 'test' });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: { message: 'hello' },
      })
    );
  });

  it('fail() should produce error shape', async () => {
    const { fail } = await import('../src/utils/response.js');
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    fail(mockRes, 400, 'Bad input');
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
      })
    );
  });
});

describe('Retry Utility', () => {
  it('should succeed on first try if no error', async () => {
    const { retry } = await import('../src/utils/retry.js');
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retry(fn, { retries: 2, baseDelay: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const { retry } = await import('../src/utils/retry.js');
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    const result = await retry(fn, { retries: 2, baseDelay: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after exhausting retries', async () => {
    const { retry } = await import('../src/utils/retry.js');
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(retry(fn, { retries: 1, baseDelay: 10 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('KeyVault', () => {
  it('should rotate through keys round-robin', async () => {
    const { KeyVault } = await import('../src/utils/keyVault.js');
    const vault = new KeyVault(['key-a', 'key-b', 'key-c']);
    const first = vault.next();
    const second = vault.next();
    const third = vault.next();
    const fourth = vault.next(); // wraps around

    expect(first).toBe('key-a');
    expect(second).toBe('key-b');
    expect(third).toBe('key-c');
    expect(fourth).toBe('key-a');
  });

  it('should skip cooled-down keys', async () => {
    const { KeyVault } = await import('../src/utils/keyVault.js');
    const vault = new KeyVault(['key-a', 'key-b'], { cooldownMs: 60000 });
    vault.cooldown('key-a');
    const next = vault.next();
    expect(next).toBe('key-b');
  });

  it('should throw when all keys are cooled down', async () => {
    const { KeyVault } = await import('../src/utils/keyVault.js');
    const vault = new KeyVault(['key-a'], { cooldownMs: 60000 });
    vault.cooldown('key-a');
    expect(() => vault.next()).toThrow();
  });
});

describe('Auth Middleware', () => {
  it('should return 401 if x-api-key header is missing', async () => {
    const { authenticate } = await import('../src/middleware/auth.js');
    const req = { headers: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Missing x-api-key header',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if key is not found in Redis', async () => {
    const { authenticate } = await import('../src/middleware/auth.js');
    mockGet.mockResolvedValueOnce(null);

    const req = { headers: { 'x-api-key': 'invalid_key_123' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(mockGet).toHaveBeenCalledWith('auth:apikey:invalid_key_123');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Invalid or revoked API key',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach req.vctCaller and call next() on valid key', async () => {
    const { authenticate } = await import('../src/middleware/auth.js');
    const tenantData = { plan: 'premium', rateLimit: 100 };
    mockGet.mockResolvedValueOnce(JSON.stringify(tenantData));

    const req = { headers: { 'x-api-key': 'vct_live_premium_abc123' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(mockGet).toHaveBeenCalledWith('auth:apikey:vct_live_premium_abc123');
    expect(req.vctCaller).toEqual({
      keyId: 'vct_live...',
      plan: 'premium',
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 500 if Redis throws an error', async () => {
    const { authenticate } = await import('../src/middleware/auth.js');
    mockGet.mockRejectedValueOnce(new Error('Redis connection lost'));

    const req = { headers: { 'x-api-key': 'some_key' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication service unavailable',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Rate Limiter Shape', () => {
  it('should export defaultLimiter and strictLimiter', async () => {
    const rl = await import('../src/middleware/rateLimiter.js');
    expect(rl.defaultLimiter).toBeDefined();
    expect(rl.strictLimiter).toBeDefined();
  });
});
