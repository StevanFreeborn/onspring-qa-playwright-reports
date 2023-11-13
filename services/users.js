/**
 * @typedef { import("@prisma/client").PrismaClient } PrismaClient
 */
import bcrypt from 'bcrypt';
import { prismaClient } from '../data/prisma.js';
import { Result } from '../utils/result.js';

/**
 * @summary Registers a new user
 * @param {object} params - The options to use.
 * @param {string} params.email - The user's email address.
 * @param {string} params.password - The user's password.
 * @param {string} params.verifiedPassword - The user's verified password.
 * @param {PrismaClient} [params.client] - The Prisma client to use.
 * @returns {Promise<Result>} The result of the operation.
 */
export async function registerUser({
  email,
  password,
  verifiedPassword,
  client = prismaClient,
}) {
  const user = await client.user.findUnique({
    where: {
      email,
    },
  });

  if (user !== null) {
    return Result.failure(new Error('User already exists'));
  }

  if (password !== verifiedPassword) {
    return Result.failure(new Error('Passwords do not match'));
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await client.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  return Result.success(newUser);
}
