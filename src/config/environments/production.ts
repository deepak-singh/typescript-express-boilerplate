import { Config } from '../config';

export const config: Config = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: 'production',
  database: {
    url: process.env['DATABASE_URL'] || '',
  },
  jwt: {
    secret: process.env['JWT_SECRET'] || '',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] || '',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    issuer: process.env['JWT_ISSUER'] || 'event-forge-service',
    audience: process.env['JWT_AUDIENCE'] || 'event-forge-users',
  },
  cors: {
    origin: process.env['CORS_ORIGIN']?.split(',') || [],
    credentials: true,
  },
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
    max: parseInt(process.env['RATE_LIMIT_MAX'] || '50', 10), // limit each IP to 50 requests per windowMs
  },
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
  },
};
