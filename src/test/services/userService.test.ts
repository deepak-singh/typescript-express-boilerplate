import { UserService } from '@/services/userService';
import { UserRepository } from '@/repositories/userRepository';
import { User, CreateUserInput, UpdateUserInput } from '@/models';
import bcrypt from 'bcryptjs';

// Mock the UserRepository
jest.mock('@/repositories/userRepository');
jest.mock('bcryptjs');
jest.mock('@/utils/logger', () => ({
  logWithContext: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUserRepository = UserRepository as jest.Mocked<typeof UserRepository>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  const mockUser: User = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  };

  const mockUserInput: CreateUserInput = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepository.existsByEmail.mockResolvedValue(false);
      mockUserRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await UserService.createUser(mockUserInput);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith(mockUserInput.password, 12);
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(mockUserInput.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...mockUserInput,
        password: hashedPassword,
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      // Act & Assert
      await expect(UserService.createUser(mockUserInput)).rejects.toThrow(
        'User with this email already exists'
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockUserRepository.existsByEmail.mockResolvedValue(false);
      mockUserRepository.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(UserService.createUser(mockUserInput)).rejects.toThrow('Database error');
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await UserService.getUserById(mockUser.id);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await UserService.getUserById('nonexistent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(UserService.getUserById(mockUser.id)).rejects.toThrow('Database error');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user if found', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await UserService.getUserByEmail(mockUser.email);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await UserService.getUserByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      // Arrange
      const mockUsers = [mockUser];
      const total = 1;
      mockUserRepository.findMany.mockResolvedValue({ users: mockUsers, total });

      // Act
      const result = await UserService.getUsers(1, 10);

      // Assert
      expect(mockUserRepository.findMany).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual({
        users: [{
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        }],
        total: 1,
        totalPages: 1,
      });
    });

    it('should handle default pagination parameters', async () => {
      // Arrange
      mockUserRepository.findMany.mockResolvedValue({ users: [], total: 0 });

      // Act
      await UserService.getUsers();

      // Assert
      expect(mockUserRepository.findMany).toHaveBeenCalledWith(0, 10);
    });

    it('should enforce pagination limits', async () => {
      // Arrange
      mockUserRepository.findMany.mockResolvedValue({ users: [], total: 0 });

      // Act
      await UserService.getUsers(1, 150);

      // Assert
      expect(mockUserRepository.findMany).toHaveBeenCalledWith(0, 100);
    });

    it('should handle negative page numbers', async () => {
      // Arrange
      mockUserRepository.findMany.mockResolvedValue({ users: [], total: 0 });

      // Act
      await UserService.getUsers(-1, 10);

      // Assert
      expect(mockUserRepository.findMany).toHaveBeenCalledWith(0, 10);
    });
  });

  describe('updateUser', () => {
    const updateData: UpdateUserInput = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      // Arrange
      const updatedUser = { ...mockUser, ...updateData };
      mockUserRepository.existsById.mockResolvedValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.updateById.mockResolvedValue(updatedUser);

      // Act
      const result = await UserService.updateUser(mockUser.id, updateData);

      // Assert
      expect(mockUserRepository.existsById).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserRepository.updateById).toHaveBeenCalledWith(mockUser.id, updateData);
      expect(result).toEqual({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      });
    });

    it('should hash password if provided', async () => {
      // Arrange
      const updateDataWithPassword = { ...updateData, password: 'newPassword123' };
      const hashedPassword = 'hashedNewPassword123';
      const updatedUser = { ...mockUser, ...updateDataWithPassword, password: hashedPassword };
      
      mockUserRepository.existsById.mockResolvedValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepository.updateById.mockResolvedValue(updatedUser);

      // Act
      await UserService.updateUser(mockUser.id, updateDataWithPassword);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(mockUserRepository.updateById).toHaveBeenCalledWith(mockUser.id, {
        ...updateDataWithPassword,
        password: hashedPassword,
      });
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserRepository.existsById.mockResolvedValue(false);

      // Act & Assert
      await expect(UserService.updateUser('nonexistent-id', updateData)).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw error if email is taken by another user', async () => {
      // Arrange
      const otherUser = { ...mockUser, id: 'other-id' };
      mockUserRepository.existsById.mockResolvedValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(otherUser);

      // Act & Assert
      await expect(UserService.updateUser(mockUser.id, updateData)).rejects.toThrow(
        'Email is already taken by another user'
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      mockUserRepository.existsById.mockResolvedValue(true);
      mockUserRepository.deleteById.mockResolvedValue();

      // Act
      await UserService.deleteUser(mockUser.id);

      // Assert
      expect(mockUserRepository.existsById).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserRepository.deleteById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserRepository.existsById.mockResolvedValue(false);

      // Act & Assert
      await expect(UserService.deleteUser('nonexistent-id')).rejects.toThrow('User not found');
      expect(mockUserRepository.deleteById).not.toHaveBeenCalled();
    });
  });

  describe('userExists', () => {
    it('should return true if user exists', async () => {
      // Arrange
      mockUserRepository.existsById.mockResolvedValue(true);

      // Act
      const result = await UserService.userExists(mockUser.id);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      // Arrange
      mockUserRepository.existsById.mockResolvedValue(false);

      // Act
      const result = await UserService.userExists('nonexistent-id');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('userExistsByEmail', () => {
    it('should return true if user exists', async () => {
      // Arrange
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      // Act
      const result = await UserService.userExistsByEmail(mockUser.email);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      // Arrange
      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Act
      const result = await UserService.userExistsByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('should return user if password is correct', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await UserService.verifyPassword(mockUser.email, 'password123');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await UserService.verifyPassword('nonexistent@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null if password is incorrect', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await UserService.verifyPassword(mockUser.email, 'wrongpassword');

      // Assert
      expect(result).toBeNull();
    });
  });
});
