/**
 * @typedef { import("@prisma/client").User } User
 */

import { PrismaClient } from '@prisma/client';

const connectionString =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

export const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});
