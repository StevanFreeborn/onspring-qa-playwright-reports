import bcrypt from 'bcrypt';
import { logger } from '../../../logging/logger.js';
import { usersService } from '../../../services/users.js';

jest.mock('../../../logging/logger.js');

describe('usersService', () => {
  const mockContext = {
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
      mockContext.user.findUnique.mockReturnValue({});

      const result = await usersService.registerUser({
        email: 'email',
        password: 'password',
        context: mockContext,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('User already exists');
      expect(mockContext.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockContext.user.create).toHaveBeenCalledTimes(0);
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

      mockContext.user.findUnique.mockReturnValue(null);
      mockContext.user.create.mockReturnValue(createdUser);

      const result = await usersService.registerUser({
        email: newUser.email,
        password: newUser.password,
        context: mockContext,
      });

      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(createdUser);
      expect(mockContext.user.findUnique).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      expect(mockContext.user.create).toHaveBeenCalledTimes(1);
      expect(mockContext.user.create).toHaveBeenCalledWith({
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
      mockContext.passwordToken.findFirst.mockReturnValue(null);

      const result = await usersService.getUserByToken({
        token: 'token',
        context: mockContext,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Invalid token');
      expect(mockContext.passwordToken.findFirst).toHaveBeenCalledTimes(1);
    });

    test('it should return an error if given token is expired', async () => {
      mockContext.passwordToken.findFirst.mockReturnValue({
        expiresAt: Date.now() - 1000,
      });

      const result = await usersService.getUserByToken({
        token: 'token',
        context: mockContext,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Invalid token');
      expect(mockContext.passwordToken.findFirst).toHaveBeenCalledTimes(1);
    });

    test('it should return a user if given token is valid', async () => {
      const user = {
        id: 'id',
        email: 'email',
        passwordHash: 'password',
      };

      mockContext.passwordToken.findFirst.mockReturnValue({
        expiresAt: Date.now() + 5000,
        user,
      });

      const result = await usersService.getUserByToken({
        token: 'token',
        context: mockContext,
      });

      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(user);
      expect(mockContext.passwordToken.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserByEmail', () => {
    test('it should return an error if user with given email is not found', async () => {
      mockContext.user.findFirst.mockReturnValue(null);

      const result = await usersService.getUserByEmail({
        email: 'email',
        context: mockContext,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe(`User not found`);
      expect(mockContext.user.findFirst).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    test('it should return a user if user with given email is found', async () => {
      const user = {
        id: 'id',
        email: 'email',
        passwordHash: 'password',
      };

      mockContext.user.findFirst.mockReturnValue(user);

      const result = await usersService.getUserByEmail({
        email: 'email',
        context: mockContext,
      });

      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(user);
      expect(mockContext.user.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateUserPassword', () => {
    test('it should return an error if user with given email is not found', async () => {
      mockContext.user.findUnique.mockReturnValue(null);

      const result = await usersService.updateUserPassword({
        email: 'email',
        password: 'password',
        token: 'token',
        context: mockContext,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('User not found');
      expect(mockContext.user.findUnique).toHaveBeenCalledTimes(1);
    });

    test('it should return an error if token does not belong to user with given email', async () => {
      mockContext.user.findUnique.mockReturnValue({
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
        context: mockContext,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Invalid token');
      expect(mockContext.user.findUnique).toHaveBeenCalledTimes(1);
    });

    test('it should return an error if token is expired', async () => {
      mockContext.user.findUnique.mockReturnValue({
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
        context: mockContext,
      });

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Invalid token');
      expect(mockContext.user.findUnique).toHaveBeenCalledTimes(1);
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

      mockContext.user.findUnique.mockReturnValue(user);
      mockContext.user.update.mockReturnValue(updatedUser);

      const result = await usersService.updateUserPassword({
        email: 'email',
        password: 'password',
        token: 'token',
        context: mockContext,
      });

      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(updatedUser);
      expect(mockContext.user.findUnique).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      expect(mockContext.user.update).toHaveBeenCalledTimes(1);
      expect(mockContext.user.update).toHaveBeenCalledWith({
        where: {
          email: 'email',
        },
        data: {
          passwordHash: 'hashedPassword',
        },
      });
      expect(mockContext.passwordToken.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockContext.session.deleteMany).toHaveBeenCalledTimes(1);
    });
  });
});
