import bcrypt from 'bcrypt';
import { execSync } from 'child_process';
import { prismaClient } from '../../data/prisma.js';

const timeout = 60000 * 10;

const testPassword = 'password';
const hashedTestPassword = bcrypt.hashSync(testPassword, 10);

export const testAdminUser = {
  email: 'admin@test.com',
  password: testPassword,
};

export const testUser = {
  email: 'user@test.com',
  password: testPassword,
};

beforeAll(async () => {
  execSync(
    `cross-env DATABASE_URL=${process.env.TEST_DATABASE_URL} prisma migrate dev`
  );
  await seedTestData();
}, timeout);

afterAll(async () => {
  execSync(
    `cross-env DATABASE_URL=${process.env.TEST_DATABASE_URL} prisma migrate reset --force`
  );
}, timeout);

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
    skipDuplicates: true,
  });

  await prismaClient.user.create({
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

  await prismaClient.user.create({
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
}
