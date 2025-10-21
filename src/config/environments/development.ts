import { Config } from '../config';

export const config: Config = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: 'development',
  database: {
    url: process.env['DATABASE_URL'] || 'mongodb://admin:password123@localhost:27017/event-forge-dev?authSource=admin',
  },
  jwt: {
    secret: process.env['JWT_SECRET'] || 'dev-secret-key-change-in-production',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'dev-refresh-secret-key-change-in-production',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    issuer: process.env['JWT_ISSUER'] || 'event-forge-service',
    audience: process.env['JWT_AUDIENCE'] || 'event-forge-users',
  },
  cors: {
    origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
    max: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10), // limit each IP to 100 requests per windowMs
  },
  logging: {
    level: process.env['LOG_LEVEL'] || 'debug',
  },
};
