import env from './env';

export interface Config {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  logging: {
    level: string;
  };
  redis?: {
    url: string;
  };
  sentry?: {
    dsn: string;
  };
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

export const config: Config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  },
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  ...(env.REDIS_URL && {
    redis: {
      url: env.REDIS_URL,
    },
  }),
  ...(env.SENTRY_DSN && {
    sentry: {
      dsn: env.SENTRY_DSN,
    },
  }),
};
