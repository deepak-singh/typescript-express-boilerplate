import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '@/services/userService';
import {
  validateBody,
  validateQuery,
  validateMongoId,
} from '@/validation/middleware';
import {
  createUserSchema,
  updateUserSchema,
  paginationSchema,
} from '@/validation/schemas';
import { authenticateToken } from '@/middleware/auth';
import { ValidationError, NotFoundError } from '@/errors/AppError';
import { logWithContext } from '@/utils/logger';
import { config } from '@/config';

const router = Router();

router.get(
  '/',
  validateQuery(paginationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = req.validatedQuery;
      const page = validatedQuery?.page || 1;
      const limit = validatedQuery?.limit || 10;

      const result = await UserService.getUsers(page, limit);

      res.json({
        success: true,
        data: result,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: page < result.totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      logWithContext.error(
        'Get users error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

router.get(
  '/:id',
  validateMongoId('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ValidationError('User ID is required'));
      }

      const user = await UserService.getUserById(id);
      if (!user) {
        return next(new NotFoundError('User'));
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logWithContext.error(
        'Get user by ID error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

router.post(
  '/',
  // Allow bypass in development with special header
  (req, res, next) => {
    if (
      config.nodeEnv === 'development' &&
      req.headers['x-admin-key'] === config.jwt.secret
    ) {
      return next();
    }
    return authenticateToken(req, res, next);
  },
  validateBody(createUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.createUser(req.body);

      logWithContext.info(
        `User created by admin: ${user.email}`,
        { userId: user.id },
        req
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user },
      });
    } catch (error) {
      logWithContext.error(
        'Create user error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

router.put(
  '/:id',
  (req, res, next) => {
    if (
      config.nodeEnv === 'development' &&
      req.headers['x-admin-key'] === config.jwt.secret
    ) {
      return next();
    }
    return authenticateToken(req, res, next);
  },
  validateMongoId('id'),
  validateBody(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ValidationError('User ID is required'));
      }

      const userExists = await UserService.userExists(id);
      if (!userExists) {
        return next(new NotFoundError('User'));
      }

      const user = await UserService.updateUser(id, req.body);

      logWithContext.info(
        `User updated by admin: ${user.email}`,
        { userId: user.id },
        req
      );

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user },
      });
    } catch (error) {
      logWithContext.error(
        'Update user error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

router.delete(
  '/:id',
  (req, res, next) => {
    if (
      config.nodeEnv === 'development' &&
      req.headers['x-admin-key'] === config.jwt.secret
    ) {
      return next();
    }
    return authenticateToken(req, res, next);
  },
  validateMongoId('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ValidationError('User ID is required'));
      }

      const userExists = await UserService.userExists(id);
      if (!userExists) {
        return next(new NotFoundError('User'));
      }

      await UserService.deleteUser(id);

      logWithContext.info(`User deleted by admin`, { userId: id }, req);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logWithContext.error(
        'Delete user error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

export default router;
