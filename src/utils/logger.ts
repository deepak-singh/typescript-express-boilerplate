import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config';

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(
    ({
      timestamp,
      level,
      message,
      stack,
      ...meta
    }: Record<string, unknown>) => {
      const logEntry: Record<string, unknown> = {
        timestamp,
        level,
        message,
        ...meta,
      };

      if (stack) {
        logEntry['stack'] = stack;
      }

      return JSON.stringify(logEntry);
    }
  )
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(
    ({ timestamp, level, message, ...meta }: Record<string, unknown>) => {
      const metaStr = Object.keys(meta).length
        ? ` ${JSON.stringify(meta)}`
        : '';
      return `${timestamp} ${level}: ${message}${metaStr}`;
    }
  )
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'typescript-express-prisma-boilerplate',
    environment: config.nodeEnv,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.nodeEnv === 'development' ? consoleFormat : logFormat,
    }),
  ],
});

// Add file transport in production
if (config.nodeEnv === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create Morgan stream for HTTP request logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Request ID middleware helper
export const addRequestId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestIdHeader = req.headers['x-request-id'];
  const correlationIdHeader = req.headers['x-correlation-id'];

  req.requestId =
    (Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader) ||
    (Array.isArray(correlationIdHeader)
      ? correlationIdHeader[0]
      : correlationIdHeader) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Enhanced logging methods with request context
export const logWithContext = {
  error: (
    message: string,
    meta: Record<string, unknown> = {},
    req?: Request
  ) => {
    const context = req
      ? {
          requestId: req.requestId,
          userId: req.user?.userId,
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        }
      : {};

    logger.error(message, { ...context, ...meta });
  },

  warn: (
    message: string,
    meta: Record<string, unknown> = {},
    req?: Request
  ) => {
    const context = req
      ? {
          requestId: req.requestId,
          userId: req.user?.userId,
          method: req.method,
          url: req.url,
        }
      : {};

    logger.warn(message, { ...context, ...meta });
  },

  info: (
    message: string,
    meta: Record<string, unknown> = {},
    req?: Request
  ) => {
    const context = req
      ? {
          requestId: req.requestId,
          userId: req.user?.userId,
        }
      : {};

    logger.info(message, { ...context, ...meta });
  },

  debug: (
    message: string,
    meta: Record<string, unknown> = {},
    req?: Request
  ) => {
    const context = req
      ? {
          requestId: req.requestId,
          userId: req.user?.userId,
        }
      : {};

    logger.debug(message, { ...context, ...meta });
  },
};

// Performance logging helper
export const logPerformance = (
  operation: string,
  startTime: number,
  req?: Request
) => {
  const duration = Date.now() - startTime;
  logWithContext.info(`Performance: ${operation}`, { duration }, req);
};

export default logger;
