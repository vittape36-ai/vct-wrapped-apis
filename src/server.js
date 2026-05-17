import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { config } from './config/env.js';
import { getRedis, closeRedis } from './config/redis.js';
import { authenticate } from './middleware/auth.js';
import { requestLogger, logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { defaultLimiter } from './middleware/rateLimiter.js';
import { ok } from './utils/response.js';

// Route imports
import llmRoutes from './routes/llm.routes.js';
import payRoutes from './routes/pay.routes.js';
import fbRoutes from './routes/fb.routes.js';
import cdnRoutes from './routes/cdn.routes.js';
import mailRoutes from './routes/mail.routes.js';
import geoRoutes from './routes/geo.routes.js';

const app = express();

// ───────────── Global Middleware ─────────────
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(requestLogger);

// ───────────── Health Check (no auth) ─────────────
app.get('/health', (_req, res) => {
  ok(res, {
    status: 'healthy',
    version: '0.1.0',
    uptime: Math.round(process.uptime()),
    wrappers: ['llm', 'pay', 'fb', 'cdn', 'mail', 'geo'],
  });
});

// ───────────── Wrapper Discovery (no auth) ─────────────
app.get('/wrappers', (_req, res) => {
  ok(res, {
    wrappers: [
      { name: 'LLM',      prefix: '/llm',  domain: 'llm.vidyacoddle.tech',  description: 'OpenAI + Gemini with key rotation, caching, fallbacks' },
      { name: 'Pay',      prefix: '/pay',  domain: 'pay.vidyacoddle.tech',  description: 'RazorpayX payouts, vendor splits, webhook verification' },
      { name: 'Firebase', prefix: '/fb',   domain: 'fb.vidyacoddle.tech',   description: 'Firebase Auth/DB with Memora injection' },
      { name: 'CDN',      prefix: '/cdn',  domain: 'cdn.vidyacoddle.tech',  description: 'Cloudinary signed uploads + on-the-fly transforms' },
      { name: 'Mail',     prefix: '/mail', domain: 'mail.vidyacoddle.tech', description: 'Resend transactional email with templates' },
      { name: 'Geo',      prefix: '/geo',  domain: 'geo.vidyacoddle.tech',  description: 'MapMyIndia geocoding optimized for India' },
    ],
    docs: 'https://api.vidyacoddle.tech/docs',
    sdks: {
      node: 'npm i @vct/api-plus',
      rust: 'cargo add vct-api-plus',
      cpp:  'conan install vct-api-plus',
    },
  });
});

// ───────────── Authenticated Routes ─────────────
// Webhook route is exempt from API key auth (uses signature verification)
app.post('/pay/v1/webhook', express.raw({ type: '*/*' }), payRoutes);

// All other wrapper routes require API key
app.use('/llm',  authenticate, defaultLimiter, llmRoutes);
app.use('/pay',  authenticate, payRoutes);
app.use('/fb',   authenticate, defaultLimiter, fbRoutes);
app.use('/cdn',  authenticate, defaultLimiter, cdnRoutes);
app.use('/mail', authenticate, defaultLimiter, mailRoutes);
app.use('/geo',  authenticate, defaultLimiter, geoRoutes);

// ───────────── 404 ─────────────
app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found. GET /wrappers to see available endpoints.',
    },
  });
});

// ───────────── Error Handler ─────────────
app.use(errorHandler);

// ───────────── Start ─────────────
const server = app.listen(config.port, () => {
  logger.info(`🚀 VCT Wrapped APIs running on port ${config.port} [${config.env}]`);
  logger.info(`   Health:   http://localhost:${config.port}/health`);
  logger.info(`   Wrappers: http://localhost:${config.port}/wrappers`);

  // Connect Redis (lazy, non-blocking)
  try {
    getRedis().connect().catch(() => {
      logger.warn('⚠️  Redis not available — caching disabled, rate limiting in-memory');
    });
  } catch {
    logger.warn('⚠️  Redis not available');
  }
});

// ───────────── Graceful Shutdown ─────────────
async function shutdown(signal) {
  logger.info(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await closeRedis();
    logger.info('👋 Server closed.');
    process.exit(0);
  });
  // Force kill after 10s
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
