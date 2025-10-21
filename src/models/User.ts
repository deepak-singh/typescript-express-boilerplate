/**
 * User type definitions and interfaces
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
}

export interface UserAuthContext {
  userId: string;
  email: string;
}

export function userToResponse(user: User): UserResponse {
  const { password: _password, ...userResponse } = user; // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars
  return userResponse;
}

export function userToAuthContext(user: User | UserResponse): UserAuthContext {
  return {
    userId: user.id,
    email: user.email,
  };
}
