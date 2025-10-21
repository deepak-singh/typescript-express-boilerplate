import { PrismaClient } from '@prisma/client';

// Test database setup
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['TEST_DATABASE_URL'] || 'mongodb://localhost:27017/test-event-forge',
    },
  },
});

// Test data cleanup
export const cleanupTestData = async () => {
  try {
    await testPrisma.user.deleteMany();
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
};

// Test data setup
export const setupTestData = async () => {
  try {
    await cleanupTestData();
    
    // Create test users
    const testUsers = [
      {
        email: 'test@example.com',
        name: 'Test User',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HSbK6m', // 'password123'
      },
      {
        email: 'admin@example.com',
        name: 'Admin User',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HSbK6m', // 'password123'
      },
    ];

    for (const user of testUsers) {
      await testPrisma.user.create({
        data: user,
      });
    }
  } catch (error) {
    console.error('Error setting up test data:', error);
  }
};

// Global test setup
beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  // Clean up any data created during tests
  await cleanupTestData();
  await setupTestData();
});
