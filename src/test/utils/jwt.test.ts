import { JWTUtils, JWTPayload } from '../../utils/jwt';

// Mock the config
jest.mock('../../config', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
      issuer: 'test-issuer',
      audience: 'test-audience',
    },
  },
}));

describe('JWTUtils', () => {
  const mockPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      // Act
      const token = JWTUtils.generateToken(mockPayload);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      // Arrange
      const payload1 = { ...mockPayload, userId: 'user1' };
      const payload2 = { ...mockPayload, userId: 'user2' };

      // Act
      const token1 = JWTUtils.generateToken(payload1);
      const token2 = JWTUtils.generateToken(payload2);

      // Assert
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      // Arrange
      const token = JWTUtils.generateToken(mockPayload);

      // Act
      const payload = JWTUtils.verifyToken(token);

      // Assert
      expect(payload.userId).toBe(mockPayload.userId);
      expect(payload.email).toBe(mockPayload.email);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      // Arrange
      const invalidToken = 'invalid.token.here';

      // Act & Assert
      expect(() => JWTUtils.verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      // Arrange
      const expiredToken = JWTUtils.generateToken(mockPayload);
      
      // Mock Date.now to simulate expired token
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 2 * 60 * 60 * 1000); // 2 hours later

      // Act & Assert
      expect(() => JWTUtils.verifyToken(expiredToken)).toThrow('Invalid or expired token');

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Authorization header', () => {
      // Arrange
      const token = 'valid.jwt.token';
      const authHeader = `Bearer ${token}`;

      // Act
      const extractedToken = JWTUtils.extractTokenFromHeader(authHeader);

      // Assert
      expect(extractedToken).toBe(token);
    });

    it('should throw error for missing Authorization header', () => {
      // Act & Assert
      expect(() => JWTUtils.extractTokenFromHeader(undefined)).toThrow(
        'Authorization header is required'
      );
    });

    it('should throw error for invalid Authorization header format', () => {
      // Arrange
      const invalidHeader = 'InvalidFormat token';

      // Act & Assert
      expect(() => JWTUtils.extractTokenFromHeader(invalidHeader)).toThrow(
        'Invalid authorization header format'
      );
    });

    it('should throw error for Authorization header without Bearer', () => {
      // Arrange
      const invalidHeader = 'Basic token';

      // Act & Assert
      expect(() => JWTUtils.extractTokenFromHeader(invalidHeader)).toThrow(
        'Invalid authorization header format'
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      // Act
      const refreshToken = JWTUtils.generateRefreshToken(mockPayload);

      // Assert
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.')).toHaveLength(3);
    });

    it('should generate different refresh tokens for different payloads', () => {
      // Arrange
      const payload1 = { ...mockPayload, userId: 'user1' };
      const payload2 = { ...mockPayload, userId: 'user2' };

      // Act
      const token1 = JWTUtils.generateRefreshToken(payload1);
      const token2 = JWTUtils.generateRefreshToken(payload2);

      // Assert
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      // Arrange
      const refreshToken = JWTUtils.generateRefreshToken(mockPayload);

      // Act
      const payload = JWTUtils.verifyRefreshToken(refreshToken);

      // Assert
      expect(payload.userId).toBe(mockPayload.userId);
      expect(payload.email).toBe(mockPayload.email);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it('should throw error for invalid refresh token', () => {
      // Arrange
      const invalidToken = 'invalid.refresh.token';

      // Act & Assert
      expect(() => JWTUtils.verifyRefreshToken(invalidToken)).toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw error for expired refresh token', () => {
      // Arrange
      const expiredToken = JWTUtils.generateRefreshToken(mockPayload);
      
      // Mock Date.now to simulate expired token
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 8 * 24 * 60 * 60 * 1000); // 8 days later

      // Act & Assert
      expect(() => JWTUtils.verifyRefreshToken(expiredToken)).toThrow(
        'Invalid or expired refresh token'
      );

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('token roundtrip', () => {
    it('should generate and verify token successfully', () => {
      // Arrange
      const originalPayload = mockPayload;

      // Act
      const token = JWTUtils.generateToken(originalPayload);
      const verifiedPayload = JWTUtils.verifyToken(token);

      // Assert
      expect(verifiedPayload.userId).toBe(originalPayload.userId);
      expect(verifiedPayload.email).toBe(originalPayload.email);
    });

    it('should generate and verify refresh token successfully', () => {
      // Arrange
      const originalPayload = mockPayload;

      // Act
      const refreshToken = JWTUtils.generateRefreshToken(originalPayload);
      const verifiedPayload = JWTUtils.verifyRefreshToken(refreshToken);

      // Assert
      expect(verifiedPayload.userId).toBe(originalPayload.userId);
      expect(verifiedPayload.email).toBe(originalPayload.email);
    });
  });
});
