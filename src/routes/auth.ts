import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '@/services/userService';
import { JWTUtils } from '@/utils/jwt';
import { validateBody } from '@/validation/middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from '@/validation/schemas';
import { authenticateToken } from '@/middleware/auth';
import { ConflictError, AuthError } from '@/errors/AppError';
import { logWithContext } from '@/utils/logger';
import { userToAuthContext } from '@/models';
import {
  userRegistrations,
  userLogins,
  jwtTokensIssued,
} from '@/utils/metrics';

const router = Router();

router.post(
  '/register',
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, password } = req.body;

      const userExists = await UserService.userExistsByEmail(email);
      if (userExists) {
        return next(new ConflictError('User with this email already exists'));
      }

      const user = await UserService.createUser({ email, name, password });

      const authContext = userToAuthContext(user);
      const accessToken = JWTUtils.generateToken(authContext);
      const refreshToken = JWTUtils.generateRefreshToken(authContext);

      userRegistrations.inc();

      logWithContext.info(
        `User registered: ${user.email}`,
        { userId: user.id },
        req
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      logWithContext.error(
        'Registration error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await UserService.verifyPassword(email, password);
      if (!user) {
        return next(new AuthError('Invalid email or password'));
      }

      const authContext = userToAuthContext(user);
      const accessToken = JWTUtils.generateToken(authContext);
      const refreshToken = JWTUtils.generateRefreshToken(authContext);

      userLogins.inc();
      jwtTokensIssued.inc({ token_type: 'access' });
      jwtTokensIssued.inc({ token_type: 'refresh' });

      logWithContext.info(
        `User logged in: ${user.email}`,
        { userId: user.id },
        req
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      logWithContext.error(
        'Login error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      const payload = JWTUtils.verifyRefreshToken(refreshToken);
      if (!payload) {
        return next(new AuthError('Invalid refresh token'));
      }

      const user = await UserService.getUserById(payload.userId);
      if (!user) {
        return next(new AuthError('User not found'));
      }

      const authContext = userToAuthContext(user);
      const newAccessToken = JWTUtils.generateToken(authContext);
      const newRefreshToken = JWTUtils.generateRefreshToken(authContext);

      jwtTokensIssued.inc({ token_type: 'access' });
      jwtTokensIssued.inc({ token_type: 'refresh' });

      logWithContext.info(
        `Token refreshed for user: ${user.email}`,
        { userId: user.id },
        req
      );

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      logWithContext.error(
        'Token refresh error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

router.get(
  '/profile',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(new AuthError('User not authenticated'));
      }

      const user = await UserService.getUserById(userId);
      if (!user) {
        return next(new AuthError('User not found'));
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logWithContext.error(
        'Get profile error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

router.put(
  '/profile',
  authenticateToken,
  validateBody(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(new AuthError('User not authenticated'));
      }

      const user = await UserService.updateUser(userId, req.body);

      logWithContext.info(
        `Profile updated: ${user.email}`,
        { userId: user.id },
        req
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error) {
      logWithContext.error(
        'Update profile error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

router.post(
  '/logout',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(new AuthError('User not authenticated'));
      }

      logWithContext.info(`User logged out`, { userId }, req);

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logWithContext.error(
        'Logout error',
        { error: (error as Error).message },
        req
      );
      next(error);
    }
  }
);

export default router;
