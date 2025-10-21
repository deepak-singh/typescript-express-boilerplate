/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public path?: string;
  public method?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    path?: string,
    method?: string
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    if (path) this.path = path;
    if (method) this.method = method;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON format
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      path: this.path,
      method: this.method,
      stack: this.stack,
    };
  }
}

/**
 * Authentication related errors
 */
export class AuthError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    path?: string,
    method?: string
  ) {
    super(message, 401, true, path, method);
  }
}

/**
 * Authorization related errors
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Access denied',
    path?: string,
    method?: string
  ) {
    super(message, 403, true, path, method);
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends AppError {
  public details?: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    details?: Record<string, string[]>,
    path?: string,
    method?: string
  ) {
    super(message, 400, true, path, method);
    if (details) this.details = details;
  }
}

/**
 * Database related errors
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = 'Database operation failed',
    path?: string,
    method?: string
  ) {
    super(message, 500, true, path, method);
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', path?: string, method?: string) {
    super(`${resource} not found`, 404, true, path, method);
  }
}

/**
 * Conflict errors (e.g., duplicate resource)
 */
export class ConflictError extends AppError {
  constructor(
    message: string = 'Resource already exists',
    path?: string,
    method?: string
  ) {
    super(message, 409, true, path, method);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Too many requests',
    path?: string,
    method?: string
  ) {
    super(message, 429, true, path, method);
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    path?: string,
    method?: string
  ) {
    super(`${service}: ${message}`, 502, true, path, method);
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AppError {
  constructor(
    message: string = 'Configuration error',
    path?: string,
    method?: string
  ) {
    super(message, 500, false, path, method);
  }
}
