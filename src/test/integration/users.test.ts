import request from 'supertest';
import app from '../../index';
import { testPrisma, cleanupTestData } from './setup';

describe('Users Integration Tests', () => {
  let adminToken: string;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test users and get tokens
    const adminResponse = await request(app.app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'password123',
      });

    adminToken = adminResponse.body.data.accessToken;
  });

  describe('GET /api/v1/users', () => {
    it('should get users with pagination', async () => {
      const response = await request(app.app)
        .get('/api/v1/users')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
      expect(response.body.pagination).toHaveProperty('hasNext');
      expect(response.body.pagination).toHaveProperty('hasPrev');
    });

    it('should use default pagination parameters', async () => {
      const response = await request(app.app)
        .get('/api/v1/users')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle custom pagination parameters', async () => {
      const response = await request(app.app)
        .get('/api/v1/users')
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should enforce pagination limits', async () => {
      const response = await request(app.app)
        .get('/api/v1/users')
        .query({ limit: 150 })
        .expect(200);

      expect(response.body.pagination.limit).toBe(100);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app.app)
        .get('/api/v1/users')
        .query({ page: -1, limit: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await testPrisma.user.findFirst({
        where: { email: 'user@example.com' },
      });
      userId = user!.id;
    });

    it('should get user by ID', async () => {
      const response = await request(app.app)
        .get(`/api/v1/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe('user@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      const response = await request(app.app)
        .get(`/api/v1/users/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for invalid user ID format', async () => {
      const response = await request(app.app)
        .get('/api/v1/users/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create user with admin authentication', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should create user with admin key in development', async () => {
      const userData = {
        email: 'devuser@example.com',
        name: 'Dev User',
        password: 'password123',
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('x-admin-key', process.env['JWT_SECRET'] || 'test-secret')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should reject creation without authentication', async () => {
      const userData = {
        email: 'unauthorized@example.com',
        name: 'Unauthorized User',
        password: 'password123',
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .send(userData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject creation with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'a', // too short
        password: '123', // too short
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject creation with duplicate email', async () => {
      const userData = {
        email: 'user@example.com', // already exists
        name: 'Duplicate User',
        password: 'password123',
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await testPrisma.user.findFirst({
        where: { email: 'user@example.com' },
      });
      userId = user!.id;
    });

    it('should update user with admin authentication', async () => {
      const updateData = {
        name: 'Updated User Name',
        email: 'updated@example.com',
      };

      const response = await request(app.app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.email).toBe(updateData.email);
    });

    it('should update user with admin key in development', async () => {
      const updateData = {
        name: 'Dev Updated User',
      };

      const response = await request(app.app)
        .put(`/api/v1/users/${userId}`)
        .set('x-admin-key', process.env['JWT_SECRET'] || 'test-secret')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updateData.name);
    });

    it('should update user password', async () => {
      const updateData = {
        password: 'newpassword123',
      };

      const response = await request(app.app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        name: 'Unauthorized Update',
      };

      const response = await request(app.app)
        .put(`/api/v1/users/${userId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject update with invalid data', async () => {
      const invalidData = {
        name: 'a', // too short
        email: 'invalid-email',
      };

      const response = await request(app.app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app.app)
        .put(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should reject update with duplicate email', async () => {
      const updateData = {
        email: 'admin@example.com', // already exists
      };

      const response = await request(app.app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await testPrisma.user.findFirst({
        where: { email: 'user@example.com' },
      });
      userId = user!.id;
    });

    it('should delete user with admin authentication', async () => {
      const response = await request(app.app)
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await testPrisma.user.findUnique({
        where: { id: userId },
      });
      expect(deletedUser).toBeNull();
    });

    it('should delete user with admin key in development', async () => {
      // Create another user to delete
      const newUser = await testPrisma.user.create({
        data: {
          email: 'todelete@example.com',
          name: 'To Delete',
          password: 'hashedpassword',
        },
      });

      const response = await request(app.app)
        .delete(`/api/v1/users/${newUser.id}`)
        .set('x-admin-key', process.env['JWT_SECRET'] || 'test-secret')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app.app)
        .delete(`/api/v1/users/${userId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      const response = await request(app.app)
        .delete(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for invalid user ID format', async () => {
      const response = await request(app.app)
        .delete('/api/v1/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
