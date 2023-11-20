import bcrypt from 'bcrypt';
import { usersService } from '../../../services/users.js';

describe('usersService', () => {
  const mockPrismaClient = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

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

  describe('getUserByToken', () => {});

  describe('getUserByEmail', () => {});

  describe('updateUserPassword', () => {});
});
