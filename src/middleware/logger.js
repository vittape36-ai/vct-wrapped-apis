import winston from 'winston';
import { config } from '../config/env.js';

import Transport from 'winston-transport';

class ClickHouseTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.buffer = [];
    setInterval(() => this.flush(), 5000); // Flush every 5s
  }

  log(info, callback) {
    this.buffer.push(info);
    callback();
  }

  async flush() {
    if (this.buffer.length === 0) return;
    const data = this.buffer.splice(0, this.buffer.length);
    try {
      // Send standard HTTP POST to ClickHouse JSONEachRow endpoint
      await fetch('http://clickhouse-server:8123/?query=INSERT INTO logs FORMAT JSONEachRow', {
        method: 'POST',
        body: data.map(d => JSON.stringify(d)).join('\n')
      });
    } catch {
      // Ignore clickhouse flush failures in dev/test
    }
  }
}

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
    new ClickHouseTransport(),
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
      message: `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
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
