import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { execSync } from 'child_process';
import { prismaClient } from '../../data/prisma.js';

const timeout = 60000 * 10;

beforeAll(async () => {
  execSync(
    `cross-env DATABASE_URL=${process.env.TEST_DATABASE_URL} prisma migrate deploy`
  );
  await cleanDatabase();
  await seedTestData();
}, timeout);

export const testPassword = 'password';
export const hashedTestPassword = bcrypt.hashSync(testPassword, 10);

export const testAdminUser = {
  id: 0,
  email: `admin+${Date.now()}@test.com`,
  password: testPassword,
};

export const testUser = {
  id: 0,
  email: `user+${Date.now()}@test.com`,
  password: testPassword,
};

/**
 * @summary Seeds the test database with test data
 * @returns {Promise<void>} A promise that resolves when the operation is complete
 */
async function seedTestData() {
  await prismaClient.role.createMany({
    data: [
      {
        name: 'admin',
      },
      {
        name: 'user',
      },
    ],
  });

  const createdTestAdminUser = await prismaClient.user.create({
    data: {
      email: testAdminUser.email,
      passwordHash: hashedTestPassword,
      userRoles: {
        create: [
          {
            role: {
              connect: {
                name: 'admin',
              },
            },
          },
          {
            role: {
              connect: {
                name: 'user',
              },
            },
          },
        ],
      },
    },
  });

  const createdTestUser = await prismaClient.user.create({
    data: {
      email: testUser.email,
      passwordHash: hashedTestPassword,
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

  testUser.id = createdTestUser.id;
  testAdminUser.id = createdTestAdminUser.id;
}

/**
 * @summary Cleans up test data
 * @returns {Promise<void>} A promise that resolves when the operation is complete
 */
async function cleanDatabase() {
  const tables = Object.values(Prisma.ModelName);

  for (const table of tables) {
    await prismaClient.$queryRawUnsafe(`TRUNCATE "${table}" CASCADE;`);
  }
}
