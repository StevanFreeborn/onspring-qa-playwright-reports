import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';

let testContainer;
let client;
const timeout = 60000 * 10;

beforeAll(async () => {
  testContainer = await new PostgreSqlContainer().start();
  const connectionString = testContainer.getConnectionUri();
  process.env.DATABASE_URL = connectionString;
  execSync(
    `cross-env DATABASE_URL=${process.env.DATABASE_URL} prisma migrate dev`
  );
}, timeout);

beforeEach(async () => {
  client = new PrismaClient();
  await client.user.create({
    data: {
      email: `test@test.com`,
      passwordHash: 'password',
    },
  });
}, timeout);

afterEach(async () => {
  execSync(
    `cross-env DATABASE_URL=${process.env.DATABASE_URL} prisma migrate reset --force`
  );
}, timeout);

afterAll(async () => {
  await testContainer.stop();
}, timeout);
