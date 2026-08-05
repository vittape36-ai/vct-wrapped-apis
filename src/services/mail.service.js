import { Resend } from 'resend';
import { retry } from '../utils/retry.js';

const TEMPLATES = {
  otp: ({ code, appName = 'VCT' }) => ({
    subject: `${code} is your ${appName} code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111">Your verification code</h2>
        <p style="font-size:32px;font-weight:700;letter-spacing:4px;color:#4F46E5;margin:24px 0">${code}</p>
        <p style="color:#666;font-size:14px">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:12px">${appName} — Powered by Vidya Coddle Tech</p>
      </div>
    `,
  }),

  welcome: ({ name, appName = 'VCT' }) => ({
    subject: `Welcome to ${appName}!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111">Hey ${name} 👋</h2>
        <p>Welcome aboard! We're thrilled to have you.</p>
        <p style="color:#666;font-size:14px">If you need anything, just reply to this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:12px">${appName} — Powered by Vidya Coddle Tech</p>
      </div>
    `,
  }),

  alert: ({ title, message, appName = 'VCT' }) => ({
    subject: `⚠️ ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#DC2626">${title}</h2>
        <p style="color:#333">${message}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:12px">${appName} — Powered by Vidya Coddle Tech</p>
      </div>
    `,
  }),
};

export class MailService {
  constructor(config = {}) {
    this.config = config;
    this.resend = null;
    if (config.resendKey) {
      this.resend = new Resend(config.resendKey);
    }
  }

  getResend() {
    if (!this.resend) throw new Error('Resend not configured');
    return this.resend;
  }

  async send({ to, subject, html, text, from, replyTo, template, data = {} }) {
    const client = this.getResend();

    let resolvedSubject = subject;
    let resolvedHtml = html;

    if (template) {
      const tmplFn = TEMPLATES[template];
      if (!tmplFn) {
        throw new Error(`Unknown template: "${template}". Available: ${Object.keys(TEMPLATES).join(', ')}`);
      }
      const rendered = tmplFn(data);
      resolvedSubject = resolvedSubject || rendered.subject;
      resolvedHtml = resolvedHtml || rendered.html;
    }

    if (!resolvedSubject || !resolvedHtml) {
      throw new Error('Either provide subject+html or a valid template');
    }

    const result = await retry(
      () =>
        client.emails.send({
          from: from || `${this.config.fromName} <${this.config.fromDefault}>`,
          to: Array.isArray(to) ? to : [to],
          subject: resolvedSubject,
          html: resolvedHtml,
          text,
          reply_to: replyTo,
        }),
      { retries: 2, label: 'mail:send' }
    );

    console.log(JSON.stringify({ message: 'Email sent', to, subject: resolvedSubject, id: result.data?.id }));
    return { id: result.data?.id, to, subject: resolvedSubject };
  }

  async sendBatch(emails) {
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error('Provide an array of emails');
    }
    if (emails.length > 100) {
      throw new Error('Batch limit is 100 emails');
    }

    const results = await Promise.allSettled(emails.map((e) => this.send(e)));

    return results.map((r, i) => ({
      index: i,
      status: r.status,
      ...(r.status === 'fulfilled' ? r.value : { error: r.reason?.message }),
    }));
  }

  listTemplates() {
    return Object.keys(TEMPLATES);
  }
}
