import { Resend } from 'resend';
import { config } from '../config/env.js';
import { retry } from '../utils/retry.js';
import { logger } from '../middleware/logger.js';

let resend = null;

function getResend() {
  if (!resend && config.mail.resendKey) {
    resend = new Resend(config.mail.resendKey);
  }
  if (!resend) throw Object.assign(new Error('Resend not configured'), { statusCode: 503 });
  return resend;
}

// ───────────── Built-in Templates ─────────────

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

/**
 * Send an email.
 *
 * @param {Object} params
 * @param {string|string[]} params.to      - Recipient(s)
 * @param {string} params.subject          - Subject line (ignored if template used)
 * @param {string} params.html             - HTML body (ignored if template used)
 * @param {string} params.text             - Plain text fallback
 * @param {string} params.from             - Override sender
 * @param {string} params.replyTo          - Reply-to address
 * @param {string} params.template         - Template name ("otp", "welcome", "alert")
 * @param {Object} params.data             - Template variables
 */
export async function send({ to, subject, html, text, from, replyTo, template, data = {} }) {
  const client = getResend();

  // Resolve template
  let resolvedSubject = subject;
  let resolvedHtml = html;

  if (template) {
    const tmplFn = TEMPLATES[template];
    if (!tmplFn) {
      throw Object.assign(new Error(`Unknown template: "${template}". Available: ${Object.keys(TEMPLATES).join(', ')}`), { statusCode: 400 });
    }
    const rendered = tmplFn(data);
    resolvedSubject = resolvedSubject || rendered.subject;
    resolvedHtml = resolvedHtml || rendered.html;
  }

  if (!resolvedSubject || !resolvedHtml) {
    throw Object.assign(new Error('Either provide subject+html or a valid template'), { statusCode: 400 });
  }

  const result = await retry(
    () =>
      client.emails.send({
        from: from || `${config.mail.fromName} <${config.mail.fromDefault}>`,
        to: Array.isArray(to) ? to : [to],
        subject: resolvedSubject,
        html: resolvedHtml,
        text,
        reply_to: replyTo,
      }),
    { retries: 2, label: 'mail:send' }
  );

  logger.info({ message: 'Email sent', to, subject: resolvedSubject, id: result.data?.id });
  return { id: result.data?.id, to, subject: resolvedSubject };
}

/**
 * Send batch emails (up to 100).
 */
export async function sendBatch(emails) {
  if (!Array.isArray(emails) || emails.length === 0) {
    throw Object.assign(new Error('Provide an array of emails'), { statusCode: 400 });
  }
  if (emails.length > 100) {
    throw Object.assign(new Error('Batch limit is 100 emails'), { statusCode: 400 });
  }

  const results = await Promise.allSettled(emails.map((e) => send(e)));

  return results.map((r, i) => ({
    index: i,
    status: r.status,
    ...(r.status === 'fulfilled' ? r.value : { error: r.reason?.message }),
  }));
}

/**
 * List available templates.
 */
export function listTemplates() {
  return Object.keys(TEMPLATES);
}
