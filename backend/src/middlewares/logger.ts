import winston from 'winston';
import type { RequestHandler } from 'express';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    logger.info('http_request', {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });
  next();
};
