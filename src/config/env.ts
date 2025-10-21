import { config } from 'dotenv';
import { cleanEnv, str, num, bool, url, makeValidator } from 'envalid';

// Load environment variables from .env file
config();

/**
 * Custom validator for comma-separated strings
 */
const commaSeparatedString = makeValidator((input: string) => {
  return input.split(',').map(s => s.trim());
});

/**
 * Custom validator for JWT expiration strings
 */
const jwtExpiration = makeValidator((input: string) => {
  // Valid JWT expiration formats: 15m, 1h, 7d, etc.
  const validFormats = /^\d+[smhd]$/;
  if (!validFormats.test(input)) {
    throw new Error('JWT expiration must be in format like 15m, 1h, 7d');
  }
  return input;
});

/**
 * Environment validation schema
 */
const env = cleanEnv(process.env, {
  // Application
  NODE_ENV: str({
    choices: ['development', 'production', 'local', 'test'],
    default: 'development',
  }),
  PORT: num({ default: 3000 }),

  // Database
  DATABASE_URL: str({ desc: 'MongoDB connection string' }),

  // JWT Configuration
  JWT_SECRET: str({ desc: 'JWT secret key' }),
  JWT_REFRESH_SECRET: str({ desc: 'JWT refresh secret key' }),
  JWT_EXPIRES_IN: jwtExpiration({ default: '15m' }),
  JWT_REFRESH_EXPIRES_IN: jwtExpiration({ default: '7d' }),
  JWT_ISSUER: str({ default: 'typescript-express-prisma-boilerplate' }),
  JWT_AUDIENCE: str({ default: 'boilerplate-users' }),

  // CORS
  CORS_ORIGIN: commaSeparatedString({
    default: ['http://localhost:3000', 'http://localhost:3001'],
  }),
  CORS_CREDENTIALS: bool({ default: true }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }), // 15 minutes
  RATE_LIMIT_MAX: num({ default: 100 }),

  // Logging
  LOG_LEVEL: str({
    choices: ['error', 'warn', 'info', 'debug'],
    default: 'debug',
  }),

  // Optional: External services
  REDIS_URL: url({
    default: undefined,
    desc: 'Redis connection URL for caching',
  }),

  // Optional: Monitoring
  SENTRY_DSN: str({
    default: undefined,
    desc: 'Sentry DSN for error tracking',
  }),
});

export default env;

/**
 * Type-safe environment variables
 */
export type Env = typeof env;
