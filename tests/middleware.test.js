import { describe, it, expect, vi } from 'vitest';

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

describe('Auth Middleware Shape', () => {
  it('should export authenticate function', async () => {
    const auth = await import('../src/middleware/auth.js');
    expect(typeof auth.authenticate).toBe('function');
  });
});

describe('Rate Limiter Shape', () => {
  it('should export defaultLimiter and strictLimiter', async () => {
    const rl = await import('../src/middleware/rateLimiter.js');
    expect(rl.defaultLimiter).toBeDefined();
    expect(rl.strictLimiter).toBeDefined();
  });
});
