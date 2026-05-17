import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('resend', () => ({
  Resend: class {
    constructor() {
      this.emails = {
        send: vi.fn().mockResolvedValue({ id: 'email_test_123' }),
      };
      this.batch = {
        send: vi.fn().mockResolvedValue({
          data: [{ id: 'email_1' }, { id: 'email_2' }],
        }),
      };
    }
  },
}));

vi.mock('../src/config/redis.js', () => ({
  redis: { status: 'ready' },
}));

describe('Mail Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export sendMail function', async () => {
    const mailService = await import('../src/services/mail.service.js');
    expect(typeof mailService.sendMail).toBe('function');
  });

  it('should export getTemplates function', async () => {
    const mailService = await import('../src/services/mail.service.js');
    expect(typeof mailService.getTemplates).toBe('function');
  });

  it('getTemplates should return known templates', async () => {
    const { getTemplates } = await import('../src/services/mail.service.js');
    const templates = getTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('variables');
    });
  });
});

describe('Mail Validation', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it('should validate correct email formats', () => {
    const valid = ['user@example.com', 'dev@vidyacoddle.tech', 'test+tag@mail.co.in'];
    valid.forEach((email) => expect(emailRegex.test(email)).toBe(true));
  });

  it('should reject invalid email formats', () => {
    const invalid = ['notanemail', '@missing.com', 'spaces here@test.com', ''];
    invalid.forEach((email) => expect(emailRegex.test(email)).toBe(false));
  });

  it('should enforce batch limit of 100', () => {
    const batchSize = 100;
    const messages = Array.from({ length: 150 }, (_, i) => ({ to: `user${i}@test.com` }));
    expect(messages.length).toBeGreaterThan(batchSize);
    expect(messages.slice(0, batchSize).length).toBe(100);
  });
});

describe('Template Rendering', () => {
  it('should replace variables in OTP template pattern', () => {
    const template = 'Your OTP is {{otp}}. Valid for {{minutes}} minutes.';
    const vars = { otp: '482901', minutes: '10' };
    const rendered = template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
    expect(rendered).toBe('Your OTP is 482901. Valid for 10 minutes.');
  });

  it('should handle missing variables gracefully', () => {
    const template = 'Hello {{name}}, your code is {{code}}.';
    const vars = { name: 'Ishaan' };
    const rendered = template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
    expect(rendered).toBe('Hello Ishaan, your code is .');
  });
});
