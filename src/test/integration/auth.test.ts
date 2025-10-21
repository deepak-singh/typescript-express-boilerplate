import request from 'supertest';
import app from '../../index';
import { testPrisma, cleanupTestData } from './setup';

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      const response = await request(app.app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject registration with existing email', async () => {
      // First, create a user
      await testPrisma.user.create({
        data: {
          email: 'existing@example.com',
          name: 'Existing User',
          password: 'hashedpassword',
        },
      });

      const userData = {
        email: 'existing@example.com',
        name: 'Another User',
        password: 'password123',
      };

      const response = await request(app.app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should reject registration with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'a', // too short
        password: '123', // too short
      };

      const response = await request(app.app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with missing fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        // missing name and password
      };

      const response = await request(app.app)
        .post('/api/v1/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await testPrisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HSbK6m', // 'password123'
        },
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app.app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with invalid data format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '', // empty password
      };

      const response = await request(app.app)
        .post('/api/v1/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register to get tokens
      const registerResponse = await request(app.app)
        .post('/api/v1/auth/register')
        .send({
          email: 'refreshtest@example.com',
          name: 'Refresh Test User',
          password: 'password123',
        });

      refreshToken = registerResponse.body.data.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.accessToken).not.toBe(refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and get access token
      const registerResponse = await request(app.app)
        .post('/api/v1/auth/register')
        .send({
          email: 'profiletest@example.com',
          name: 'Profile Test User',
          password: 'password123',
        });

      accessToken = registerResponse.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app.app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('profiletest@example.com');
      expect(response.body.data.user.name).toBe('Profile Test User');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app.app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication failed');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app.app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication failed');
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and get access token
      const registerResponse = await request(app.app)
        .post('/api/v1/auth/register')
        .send({
          email: 'updatetest@example.com',
          name: 'Update Test User',
          password: 'password123',
        });

      accessToken = registerResponse.body.data.accessToken;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const response = await request(app.app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.email).toBe(updateData.email);
    });

    it('should update password successfully', async () => {
      const updateData = {
        password: 'newpassword123',
      };

      const response = await request(app.app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
    });

    it('should reject update with invalid data', async () => {
      const invalidData = {
        name: 'a', // too short
        email: 'invalid-email',
      };

      const response = await request(app.app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app.app)
        .put('/api/v1/auth/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and get access token
      const registerResponse = await request(app.app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logouttest@example.com',
          name: 'Logout Test User',
          password: 'password123',
        });

      accessToken = registerResponse.body.data.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
