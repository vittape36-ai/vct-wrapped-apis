import winston from 'winston';
import { config } from '../config/env.js';

const logger = winston.createLogger({
  level: config.isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: config.isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
    }),
  ],
});

/**
 * Log every request with timing.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      caller: req.vctCaller?.keyId || 'anon',
      wrapper: req.path.split('/')[1] || 'unknown',
    });
  });

  next();
}

export { logger };
