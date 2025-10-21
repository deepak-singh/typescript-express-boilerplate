import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, ValidationError } from './AppError';
import { logger } from '@/utils/logger';

/**
 * Handle Prisma errors and convert them to AppError instances
 */
export const handlePrismaError = (error: unknown): AppError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new AppError(
          'A record with this information already exists',
          409
        );
      case 'P2025':
        return new AppError('Record not found', 404);
      case 'P2003':
        return new AppError('Foreign key constraint failed', 400);
      case 'P2014':
        return new AppError('Invalid ID provided', 400);
      default:
        return new AppError('Database operation failed', 500);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError('Invalid data provided', 400);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError('Database connection failed', 500);
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new AppError('Database engine error', 500);
  }

  return new AppError('Database operation failed', 500);
};

/**
 * Handle JWT errors
 */
export const handleJWTError = (error: unknown): AppError => {
  if (error instanceof Error) {
    if (error.name === 'JsonWebTokenError') {
      return new AppError('Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return new AppError('Token expired', 401);
    }
    if (error.name === 'NotBeforeError') {
      return new AppError('Token not active', 401);
    }
  }
  return new AppError('Authentication failed', 401);
};

/**
 * Handle validation errors from express-validator
 */
export const handleValidationError = (
  errors: Array<{ msg: string; param: string }>
): ValidationError => {
  const details: Record<string, string[]> = {};

  errors.forEach(error => {
    if (!details[error.param]) {
      details[error.param] = [];
    }
    details[error.param]!.push(error.msg);
  });

  return new ValidationError('Validation failed', details);
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line no-unused-vars
): void => {
  let appError: AppError;

  // Convert known errors to AppError instances
  if (error instanceof AppError) {
    appError = error;
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    appError = handlePrismaError(error);
  } else if (
    error.name === 'JsonWebTokenError' ||
    error.name === 'TokenExpiredError' ||
    error.name === 'NotBeforeError'
  ) {
    appError = handleJWTError(error);
  } else {
    // Unknown error - create a generic AppError
    appError = new AppError(
      process.env['NODE_ENV'] === 'production'
        ? 'Something went wrong'
        : error.message,
      500,
      false,
      req.path,
      req.method
    );
  }

  // Add request context to error
  if (appError.path === undefined) appError.path = req.path;
  if (appError.method === undefined) appError.method = req.method;

  // Log error
  if (appError.statusCode >= 500) {
    logger.error('Server Error:', {
      error: appError.toJSON(),
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        user: req.user?.userId,
      },
    });
  } else {
    logger.warn('Client Error:', {
      error: appError.toJSON(),
      request: {
        method: req.method,
        url: req.url,
        user: req.user?.userId,
      },
    });
  }

  // Send error response
  const errorResponse: {
    success: boolean;
    error: {
      message: string;
      statusCode: number;
      timestamp: string;
      path?: string;
      method?: string;
      details?: Record<string, string[]>;
      stack?: string | undefined;
    };
  } = {
    success: false,
    error: {
      message: appError.message,
      statusCode: appError.statusCode,
      timestamp: appError.timestamp,
      path: appError.path,
      method: appError.method,
    },
  };

  // Add details for validation errors
  if (
    appError instanceof AppError &&
    'details' in appError &&
    appError.details
  ) {
    errorResponse.error.details = appError.details as Record<string, string[]>;
  }

  // Add stack trace in development
  if (process.env['NODE_ENV'] === 'development') {
    errorResponse.error.stack = appError.stack || undefined;
  }

  res.status(appError.statusCode).json(errorResponse);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create a standardized error response
 */
export const createErrorResponse = (
  message: string,
  statusCode: number = 500,
  details?: Record<string, string[]>
) => {
  const error = new AppError(message, statusCode, true);
  if (details) {
    (error as ValidationError).details = details;
  }
  return error;
};
