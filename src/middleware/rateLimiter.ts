import rateLimit from 'express-rate-limit';
import { config } from '@/config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
      },
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    });
  },
});
