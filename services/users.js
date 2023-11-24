/**
 * @typedef { import("@prisma/client").PrismaClient } PrismaClient
 */

import bcrypt from 'bcrypt';
import { logger } from '../logging/logger.js';
import { Result } from '../utils/result.js';

/**
 * @summary The users service
 */
export const usersService = {
  /**
   * @summary Registers a new user
   * @param {object} params The params to use.
   * @param {string} params.email The user's email address.
   * @param {string} params.password The user's password.
   * @param {PrismaClient} [params.context] The Prisma client to use.
   * @returns {Promise<Result>} The result of the operation.
   */
  async registerUser({ email, password, context }) {
    const user = await context.user.findUnique({
      where: {
        email,
      },
    });

    if (user !== null) {
      return Result.failure(new Error('User already exists'));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await context.user.create({
      data: {
        email,
        passwordHash,
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

    return Result.success(newUser);
  },
  /**
   * @summary Retrieves the user related to the provided token
   * @param {object} params The params to use.
   * @param {string} params.token The user's token.
   * @param {PrismaClient} params.context The Prisma client to use.
   * @returns {Promise<Result>} The result of the operation.
   */
  async getUserByToken({ token, context }) {
    const storedToken = await context.passwordToken.findFirst({
      where: {
        token: token,
      },
      include: {
        user: true,
      },
    });

    if (storedToken === null || storedToken.expiresAt < Date.now()) {
      return Result.failure(new Error('Invalid token'));
    }

    return Result.success(storedToken.user);
  },
  /**
   * @summary Updates the user's password
   * @param {object} params The params to use.
   * @param {string} params.email The user's email address.
   * @param {string} params.password The user's password.
   * @param {string} params.token The user's token.
   * @param {PrismaClient} params.context The Prisma client to use.
   * @returns {Promise<Result>} The result of the operation.
   */
  async updateUserPassword({ email, password, token, context }) {
    const user = await context.user.findUnique({
      where: {
        email,
      },
      include: {
        passwordTokens: true,
      },
    });

    if (user === null) {
      return Result.failure(new Error('User not found'));
    }

    const userToken = user.passwordTokens.find(t => t.token === token);

    if (userToken === undefined || userToken.expiresAt < Date.now()) {
      return Result.failure(new Error('Invalid token'));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const updatedUser = await context.user.update({
      where: {
        email,
      },
      data: {
        passwordHash,
      },
    });

    await context.passwordToken.deleteMany({
      where: {
        OR: [
          {
            AND: [
              {
                expiresAt: {
                  lte: Date.now(),
                },
              },
              {
                userId: updatedUser.id,
              },
            ],
          },
          {
            id: userToken.id,
          },
        ],
      },
    });

    await context.session.deleteMany({
      where: {
        data: {
          contains: `"passport":{"user":${updatedUser.id}}`,
        },
      },
    });

    return Result.success(updatedUser);
  },
  /**
   * @summary Retrieves the user by email
   * @param {object} params The params to use.
   * @param {string} params.email The user's email.
   * @param {PrismaClient} params.context The Prisma client to use.
   * @returns {Promise<Result>} The result of the operation.
   */
  async getUserByEmail({ email, context }) {
    const user = await context.user.findFirst({
      where: {
        email,
      },
      include: {
        passwordTokens: {
          where: {
            expiresAt: {
              gt: Date.now(),
            },
          },
        },
      },
    });

    if (user === null) {
      logger.error(`User not found: ${email}`);
      return Result.failure(new Error('User not found'));
    }

    return Result.success(user);
  },
};
