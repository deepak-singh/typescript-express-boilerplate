import jwt from 'jsonwebtoken';
import { config } from '@/config';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export class JWTUtils {
  /**
   * Generate a JWT token
   */
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    } as jwt.SignOptions);
  }

  /**
   * Verify a JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      } as jwt.VerifyOptions) as JWTPayload;
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1]!;
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(
    payload: Omit<JWTPayload, 'iat' | 'exp'>
  ): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    } as jwt.SignOptions);
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      } as jwt.VerifyOptions) as JWTPayload;
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }
}
