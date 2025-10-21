import { Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth, requireRole, requireOwnership } from '@/middleware/auth';
import { JWTUtils } from '@/utils/jwt';
import { AuthError } from '@/errors/AppError';

// Mock JWTUtils
jest.mock('@/utils/jwt');
const mockJWTUtils = JWTUtils as jest.Mocked<typeof JWTUtils>;

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token and attach user to request', async () => {
      // Arrange
      const mockPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };
      const token = 'valid.jwt.token';
      
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      mockJWTUtils.extractTokenFromHeader.mockReturnValue(token);
      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockJWTUtils.extractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${token}`);
      expect(mockJWTUtils.verifyToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with AuthError for missing authorization header', async () => {
      // Arrange
      mockRequest.headers = {};
      mockJWTUtils.extractTokenFromHeader.mockImplementation(() => {
        throw new Error('Authorization header is required');
      });

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthError));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication failed',
      }));
    });

    it('should call next with AuthError for invalid token', async () => {
      // Arrange
      const token = 'invalid.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      mockJWTUtils.extractTokenFromHeader.mockReturnValue(token);
      mockJWTUtils.verifyToken.mockImplementation(() => {
        throw new Error('Invalid or expired token');
      });

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthError));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication failed',
      }));
    });

    it('should call next with AuthError for malformed authorization header', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };
      mockJWTUtils.extractTokenFromHeader.mockImplementation(() => {
        throw new Error('Invalid authorization header format');
      });

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthError));
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate valid token and attach user to request', async () => {
      // Arrange
      const mockPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };
      const token = 'valid.jwt.token';
      
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      mockJWTUtils.extractTokenFromHeader.mockReturnValue(token);
      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without authentication if no authorization header', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without authentication if token is invalid', async () => {
      // Arrange
      const token = 'invalid.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      mockJWTUtils.extractTokenFromHeader.mockReturnValue(token);
      mockJWTUtils.verifyToken.mockImplementation(() => {
        throw new Error('Invalid or expired token');
      });

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireRole', () => {
    it('should call next with AuthError if user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined as any;
      const requireAdminRole = requireRole('admin');

      // Act
      requireAdminRole(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthError));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication required',
      }));
    });

    it('should call next without error if user is authenticated (placeholder for future role-based access)', () => {
      // Arrange
      mockRequest.user = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };
      const requireAdminRole = requireRole('admin');

      // Act
      requireAdminRole(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireOwnership', () => {
    it('should call next with AuthError if user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined as any;
      mockRequest.params = { userId: '507f1f77bcf86cd799439011' };
      const requireOwnershipMiddleware = requireOwnership('userId');

      // Act
      requireOwnershipMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthError));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication required',
      }));
    });

    it('should call next with AuthError if user tries to access another user\'s resource', () => {
      // Arrange
      mockRequest.user = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };
      mockRequest.params = { userId: '507f1f77bcf86cd799439012' }; // Different user ID
      const requireOwnershipMiddleware = requireOwnership('userId');

      // Act
      requireOwnershipMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthError));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Access denied: You can only access your own resources',
      }));
    });

    it('should call next without error if user accesses their own resource via params', () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest.user = {
        userId,
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };
      mockRequest.params = { userId };
      const requireOwnershipMiddleware = requireOwnership('userId');

      // Act
      requireOwnershipMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next without error if user accesses their own resource via body', () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest.user = {
        userId,
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };
      mockRequest.body = { userId };
      mockRequest.params = {}; // Ensure params is defined
      const requireOwnershipMiddleware = requireOwnership('userId');

      // Act
      requireOwnershipMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should use default parameter name "userId"', () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest.user = {
        userId,
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };
      mockRequest.params = { userId };
      const requireOwnershipMiddleware = requireOwnership(); // No parameter name provided

      // Act
      requireOwnershipMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
