import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const apiDocs = {
    name: 'TypeScript Express Prisma Boilerplate API',
    version: '1.0.0',
    description:
      'A production-ready TypeScript Express.js boilerplate with Prisma ORM, MongoDB, and JWT authentication',
    endpoints: {
      health: {
        'GET /health': 'Health check endpoint',
      },
      authentication: {
        'POST /api/v1/auth/register': 'Register a new user',
        'POST /api/v1/auth/login': 'Login user',
        'POST /api/v1/auth/refresh': 'Refresh access token',
        'GET /api/v1/auth/profile': 'Get current user profile (requires auth)',
        'PUT /api/v1/auth/profile':
          'Update current user profile (requires auth)',
        'POST /api/v1/auth/logout': 'Logout user (requires auth)',
      },
      users: {
        'GET /api/v1/users': 'Get all users with pagination',
        'GET /api/v1/users/:id': 'Get user by ID',
        'POST /api/v1/users': 'Create new user (admin only)',
        'PUT /api/v1/users/:id': 'Update user by ID (admin only)',
        'DELETE /api/v1/users/:id': 'Delete user by ID (admin only)',
      },
    },
    examples: {
      register: {
        method: 'POST',
        url: '/api/v1/auth/register',
        body: {
          email: 'user@example.com',
          name: 'John Doe',
          password: 'password123',
        },
      },
      login: {
        method: 'POST',
        url: '/api/v1/auth/login',
        body: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
      getUserProfile: {
        method: 'GET',
        url: '/api/v1/auth/profile',
        headers: {
          Authorization: 'Bearer your_jwt_token_here',
        },
      },
    },
    authentication:
      'JWT-based authentication. Include "Authorization: Bearer <token>" header for protected routes',
    rateLimiting: '100 requests per 15 minutes per IP',
  };

  res.json(apiDocs);
});

export default router;
