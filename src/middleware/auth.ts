import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '@/utils/jwt';
import { AuthError } from '@/errors/AppError';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    const payload = JWTUtils.verifyToken(token);

    // Attach user info to request
    req.user = payload;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next(new AuthError('Authentication failed'));
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = JWTUtils.extractTokenFromHeader(authHeader);
      const payload = JWTUtils.verifyToken(token);
      req.user = payload;
    }
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    // Continue without authentication
    next();
  }
};

/**
 * Middleware to check if user has specific role (for future role-based access)
 */
export const requireRole = (role: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthError('Authentication required'));
    }

    // For now, we don't have roles in the user model
    // This is a placeholder for future role-based access control
    // You can extend the user model to include roles
    console.log(`Checking role: ${role}`); // TODO: Implement actual role checking
    next();
  };
};

/**
 * Middleware to check if user owns the resource
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthError('Authentication required'));
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    if (req.user.userId !== resourceUserId) {
      return next(
        new AuthError('Access denied: You can only access your own resources')
      );
    }

    next();
  };
};
