import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/errors/AppError';

/**
 * Generic Zod validation middleware
 */
export const validate = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data =
        source === 'body'
          ? req.body
          : source === 'query'
            ? req.query
            : req.params;
      const validatedData = schema.parse(data);

      // Replace the original data with validated data
      if (source === 'body') {
        req.body = validatedData;
      } else if (source === 'query') {
        // For query parameters, we don't replace the original object
        // The validated data is available in the controller
        req.validatedQuery = validatedData as { page?: number; limit?: number };
      } else {
        req.params = validatedData as Record<string, string>;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};

        error.issues.forEach(err => {
          const path = err.path.join('.');
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(err.message);
        });

        const validationError = new ValidationError(
          'Validation failed',
          details,
          req.path,
          req.method
        );

        return next(validationError);
      }

      next(error);
    }
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');

/**
 * Validate route parameters
 */
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

/**
 * Validate MongoDB ObjectId parameter
 */
export const validateMongoId = (paramName: string = 'id') => {
  return validateParams(
    z.object({
      [paramName]: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    })
  );
};
