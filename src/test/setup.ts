import { PrismaClient } from '@prisma/client';

// Mock Prisma client for testing
jest.mock('@/utils/database', () => ({
  getPrismaClient: jest.fn(() => new PrismaClient()),
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
}));

// Global test setup
beforeAll(async () => {
  // Setup code that runs before all tests
});

afterAll(async () => {
  // Cleanup code that runs after all tests
});

beforeEach(() => {
  // Setup code that runs before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup code that runs after each test
});
