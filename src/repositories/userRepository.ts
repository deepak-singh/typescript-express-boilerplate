import { PrismaClient } from '@prisma/client';
import { User, CreateUserInput, UpdateUserInput } from '@/models';

export class UserRepository {
  private static prisma = new PrismaClient();
  static async create(userData: CreateUserInput): Promise<User> {
    const user = await this.prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  static async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }

  static async findMany(
    skip: number,
    take: number
  ): Promise<{
    users: User[];
    total: number;
  }> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total };
  }

  static async updateById(
    id: string,
    userData: UpdateUserInput
  ): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: userData,
    });
    return user;
  }

  static async deleteById(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  static async existsById(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!user;
  }

  static async existsByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  static getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}
