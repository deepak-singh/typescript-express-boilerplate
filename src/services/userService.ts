import { UserRepository } from '@/repositories';
import {
  UserResponse,
  CreateUserInput,
  UpdateUserInput,
  userToResponse,
} from '@/models';
import bcrypt from 'bcryptjs';
import { logWithContext } from '@/utils/logger';

export class UserService {
  static async createUser(userData: CreateUserInput): Promise<UserResponse> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const existingUser = await UserRepository.existsByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = await UserRepository.create({
        ...userData,
        password: hashedPassword,
      });

      logWithContext.info('User created successfully', { userId: user.id });
      return userToResponse(user);
    } catch (error) {
      logWithContext.error('Error creating user', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  static async getUserById(id: string): Promise<UserResponse | null> {
    try {
      const user = await UserRepository.findById(id);
      if (user) {
        logWithContext.info('User retrieved by ID', { userId: user.id });
        return userToResponse(user);
      }
      return null;
    } catch (error) {
      logWithContext.error('Error getting user by ID', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<UserResponse | null> {
    try {
      const user = await UserRepository.findByEmail(email);
      if (user) {
        logWithContext.info('User retrieved by email', { userId: user.id });
        return userToResponse(user);
      }
      return null;
    } catch (error) {
      logWithContext.error('Error getting user by email', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  static async getUsers(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    users: UserResponse[];
    total: number;
    totalPages: number;
  }> {
    try {
      if (page < 1) page = 1;
      if (limit < 1) limit = 10;
      if (limit > 100) limit = 100;

      const skip = (page - 1) * limit;
      const result = await UserRepository.findMany(skip, limit);
      const totalPages = Math.ceil(result.total / limit);

      logWithContext.info('Users retrieved', {
        total: result.total,
        page,
        limit,
        totalPages,
      });

      return {
        users: result.users.map(userToResponse),
        total: result.total,
        totalPages,
      };
    } catch (error) {
      logWithContext.error('Error getting users', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  static async updateUser(
    id: string,
    userData: UpdateUserInput
  ): Promise<UserResponse> {
    try {
      const userExists = await UserRepository.existsById(id);
      if (!userExists) {
        throw new Error('User not found');
      }

      if (userData.email) {
        const existingUser = await UserRepository.findByEmail(userData.email);
        if (existingUser && existingUser.id !== id) {
          throw new Error('Email is already taken by another user');
        }
      }

      const updateData: UpdateUserInput = { ...userData };
      if (userData.password) {
        updateData.password = await bcrypt.hash(userData.password, 12);
      }

      const user = await UserRepository.updateById(id, updateData);
      logWithContext.info('User updated successfully', { userId: user.id });
      return userToResponse(user);
    } catch (error) {
      logWithContext.error('Error updating user', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      const userExists = await UserRepository.existsById(id);
      if (!userExists) {
        throw new Error('User not found');
      }

      await UserRepository.deleteById(id);
      logWithContext.info('User deleted successfully', { userId: id });
    } catch (error) {
      logWithContext.error('Error deleting user', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  static async userExists(id: string): Promise<boolean> {
    try {
      return await UserRepository.existsById(id);
    } catch (error) {
      logWithContext.error('Error checking if user exists', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  static async userExistsByEmail(email: string): Promise<boolean> {
    try {
      return await UserRepository.existsByEmail(email);
    } catch (error) {
      logWithContext.error('Error checking if user exists by email', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  static async verifyPassword(
    email: string,
    password: string
  ): Promise<UserResponse | null> {
    try {
      const user = await UserRepository.findByEmail(email);

      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      return userToResponse(user);
    } catch (error) {
      logWithContext.error('Error verifying password', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
