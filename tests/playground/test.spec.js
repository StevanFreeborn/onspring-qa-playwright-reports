import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { JSDOM } from 'jsdom';
import request from 'supertest';
import { sessionStore } from '../../auth/session.js';
import { hashedTestPassword } from '../integration/db.setup.js';

let container;
let prismaClient;
let sut;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  const connectionString = container.getConnectionUri();
  execSync(`cross-env DATABASE_URL=${connectionString} prisma migrate deploy`);
  prismaClient = new PrismaClient({
    datasources: {
      db: {
        url: container.getConnectionUri(),
      },
    },
  });

  jest.doMock('../../../data/prisma.js', () => ({
    prismaClient: prismaClient,
  }));

  await prismaClient.user.create({
    data: {
      email: 'test.user@test.com',
      passwordHash: hashedTestPassword,
    },
  });

  ({ app: sut } = await import('../../app.js'));
}, 60000 * 10);

afterAll(async () => {
  await container.stop();
  await sessionStore.shutdown();
}, 60000 * 10);

test('user can login', async () => {
  const getLoginResponse = await request(sut).get('/login');
  const {
    window: { document: loginView },
  } = new JSDOM(getLoginResponse.text);

  const csrfToken = loginView
    .querySelector('meta[name="csrf-token"]')
    .getAttribute('content');

  const cookies = getLoginResponse.headers['set-cookie'];

  const loginResponse = await request(sut)
    .post('/login')
    .set('Cookie', cookies)
    .type('x-www-form-urlencoded')
    .send({
      email: 'test.user@test.com',
      password: 'password',
      _csrf: csrfToken,
    });

  expect(loginResponse.status).toBe(302);
});
