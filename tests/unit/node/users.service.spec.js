import bcrypt from 'bcrypt';
import { logger } from '../../../logging/logger.js';
import { usersService } from '../../../services/users.js';

jest.mock('../../../logging/logger.js');

describe('usersService', () => {
  const mockPrismaClient = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordToken: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    session: {
      deleteMany: jest.fn(),
    },
  };

  jest.spyOn(logger, 'error').mockImplementation();
  jest.spyOn(bcrypt, 'hash').mockReturnValue('hashedPassword');

  test('it should have a registerUser function', () => {
    expect(usersService.registerUser).toBeDefined();
  });

  test('it should have a getUserByToken function', () => {
    expect(usersService.getUserByToken).toBeDefined();
  });

  test('it should have a getUserByEmail function', () => {
    expect(usersService.getUserByEmail).toBeDefined();
  });

  test('it should have an updateUserPassword function', () => {
    expect(usersService.updateUserPassword).toBeDefined();
  });

  describe('registerUser', () => {
    test('it should return an error if user with given email already exists', async () => {
      mockPrismaClient.user.findUnique.mockReturnValue({});

      const result = await usersService.registerUser({
        email: 'email',
        password: 'password',
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('User already exists');
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.user.create).toHaveBeenCalledTimes(0);
    });

    test('it should save the user with password hashed if user with given email does not exist', async () => {
      const newUser = {
        id: 'id',
        email: 'email',
        password: 'password',
      };
      const createdUser = {
        ...newUser,
        passwordHash: 'hashedPassword',
      };

      mockPrismaClient.user.findUnique.mockReturnValue(null);
      mockPrismaClient.user.create.mockReturnValue(createdUser);

      const result = await usersService.registerUser({
        email: newUser.email,
        password: newUser.password,
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(createdUser);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.user.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: {
          email: newUser.email,
          passwordHash: 'hashedPassword',
          userRoles: {
            create: {
              role: {
                connect: {
                  name: 'user',
                },
              },
            },
          },
        },
      });
    });
  });

  describe('getUserByToken', () => {
    test('it should return an error if given token is not found', async () => {
      mockPrismaClient.passwordToken.findFirst.mockReturnValue(null);

      const result = await usersService.getUserByToken({
        token: 'token',
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Invalid token');
      expect(mockPrismaClient.passwordToken.findFirst).toHaveBeenCalledTimes(1);
    });

    test('it should return an error if given token is expired', async () => {
      mockPrismaClient.passwordToken.findFirst.mockReturnValue({
        expiresAt: Date.now() - 1000,
      });

      const result = await usersService.getUserByToken({
        token: 'token',
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Invalid token');
      expect(mockPrismaClient.passwordToken.findFirst).toHaveBeenCalledTimes(1);
    });

    test('it should return a user if given token is valid', async () => {
      const user = {
        id: 'id',
        email: 'email',
        passwordHash: 'password',
      };

      mockPrismaClient.passwordToken.findFirst.mockReturnValue({
        expiresAt: Date.now() + 5000,
        user,
      });

      const result = await usersService.getUserByToken({
        token: 'token',
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(user);
      expect(mockPrismaClient.passwordToken.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserByEmail', () => {
    test('it should return an error if user with given email is not found', async () => {
      mockPrismaClient.user.findFirst.mockReturnValue(null);

      const result = await usersService.getUserByEmail({
        email: 'email',
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe(`User not found`);
      expect(mockPrismaClient.user.findFirst).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    test('it should return a user if user with given email is found', async () => {
      const user = {
        id: 'id',
        email: 'email',
        passwordHash: 'password',
      };

      mockPrismaClient.user.findFirst.mockReturnValue(user);

      const result = await usersService.getUserByEmail({
        email: 'email',
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(user);
      expect(mockPrismaClient.user.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateUserPassword', () => {
    test('it should return an error if user with given email is not found', async () => {
      mockPrismaClient.user.findUnique.mockReturnValue(null);

      const result = await usersService.updateUserPassword({
        email: 'email',
        password: 'password',
        token: 'token',
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('User not found');
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledTimes(1);
    });

    test('it should return an error if token does not belong to user with given email', async () => {
      mockPrismaClient.user.findUnique.mockReturnValue({
        id: 'id',
        email: 'email',
        passwordHash: 'password',
        passwordTokens: [
          {
            token: 'differentToken',
            expiresAt: Date.now() + 5000,
          },
        ],
      });

      const result = await usersService.updateUserPassword({
        email: 'email',
        password: 'password',
        token: 'token',
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Invalid token');
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledTimes(1);
    });

    test('it should return an error if token is expired', async () => {
      mockPrismaClient.user.findUnique.mockReturnValue({
        id: 'id',
        email: 'email',
        passwordHash: 'password',
        passwordTokens: [
          {
            token: 'token',
            expiresAt: Date.now() - 5000,
          },
        ],
      });

      const result = await usersService.updateUserPassword({
        email: 'email',
        password: 'password',
        token: 'token',
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Invalid token');
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledTimes(1);
    });

    test("it should update the users password after hashing it, delete the user's invalid tokens, and delete user's existing sessions", async () => {
      const user = {
        id: 'id',
        email: 'email',
        passwordHash: 'existingPassword',
        passwordTokens: [
          {
            token: 'token',
            expiresAt: Date.now() + 5000,
          },
        ],
      };
      const updatedUser = {
        id: 'id',
        email: 'email',
        passwordHash: 'hashedPassword',
      };

      mockPrismaClient.user.findUnique.mockReturnValue(user);
      mockPrismaClient.user.update.mockReturnValue(updatedUser);

      const result = await usersService.updateUserPassword({
        email: 'email',
        password: 'password',
        token: 'token',
        client: mockPrismaClient,
      });

      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(updatedUser);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.user.update).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: {
          email: 'email',
        },
        data: {
          passwordHash: 'hashedPassword',
        },
      });
      expect(mockPrismaClient.passwordToken.deleteMany).toHaveBeenCalledTimes(
        1
      );
      expect(mockPrismaClient.session.deleteMany).toHaveBeenCalledTimes(1);
    });
  });
});
