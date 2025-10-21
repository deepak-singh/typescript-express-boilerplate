import {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Enable default metrics collection
collectDefaultMetrics();

/**
 * Custom metrics
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type'],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

export const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
});

export const jwtTokensIssued = new Counter({
  name: 'jwt_tokens_issued_total',
  help: 'Total number of JWT tokens issued',
  labelNames: ['token_type'], // access_token, refresh_token
});

export const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
});

export const userLogins = new Counter({
  name: 'user_logins_total',
  help: 'Total number of user logins',
  labelNames: ['success'], // true, false
});

export const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint'],
});

/**
 * Get metrics in Prometheus format
 */
export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

/**
 * Get metrics in JSON format
 */
export const getMetricsAsJSON = async () => {
  return register.getMetricsAsJSON();
};

/**
 * Clear all metrics
 */
export const clearMetrics = (): void => {
  register.clear();
};

/**
 * Middleware to collect HTTP metrics
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    httpRequestTotal.labels(req.method, route, res.statusCode.toString()).inc();

    if (res.statusCode >= 400) {
      httpRequestErrors
        .labels(
          req.method,
          route,
          res.statusCode >= 500 ? 'server_error' : 'client_error'
        )
        .inc();
    }
  });

  next();
};
