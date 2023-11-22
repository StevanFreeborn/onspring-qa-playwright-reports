import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import bcrypt from 'bcrypt';
import { execSync } from 'child_process';

let testContainer;
let client;
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
  testContainer = await new PostgreSqlContainer().start();
  const connectionString = testContainer.getConnectionUri();

  process.env.DATABASE_URL = connectionString;

  // want to instantiate a new client here so that we can use the
  // DATABASE_URL environment variable that we have just overwritten
  // with the test container connection string
  client = new PrismaClient();

  execSync(
    `cross-env DATABASE_URL=${process.env.DATABASE_URL} prisma migrate dev`
  );
}, timeout);

beforeEach(async () => {
  await seedTestData(client);
}, timeout);

afterEach(async () => {
  execSync(
    `cross-env DATABASE_URL=${process.env.DATABASE_URL} prisma migrate reset --force`
  );
}, timeout);

afterAll(async () => {
  await testContainer.stop();
}, timeout);

/**
 * @summary Seeds the test database with test data
 * @returns {Promise<void>} A promise that resolves when the operation is complete
 */
async function seedTestData() {
  await client.role.createMany({
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

  await client.user.create({
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

  await client.user.create({
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
