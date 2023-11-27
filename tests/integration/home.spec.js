/**
 * @typedef {object} AuthUser
 * @property {string} csrfCookie The csrf cookie
 * @property {string} sessionCookie The session cookie
 * @property {string} csrfToken The csrf token
 */

import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import request from 'supertest';
import { createApp } from '../../app.js';
import { sessionStore } from '../../auth/session.js';
import {
  SETUP_HOOKS_TIMEOUT,
  hashedTestPassword,
  logInAsUser,
  seedTestData,
  testPassword,
  testUser,
} from './utils.js';

let container;
let prismaClient;
let testApp;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();

  const connectionString = container.getConnectionUri();

  execSync(`cross-env DATABASE_URL=${connectionString} prisma migrate deploy`);
  prismaClient = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });

  await seedTestData(prismaClient);

  testApp = createApp({ context: prismaClient });
}, SETUP_HOOKS_TIMEOUT);

afterAll(async () => {
  await container.stop();
  await sessionStore.shutdown();
}, SETUP_HOOKS_TIMEOUT);

describe('GET /', () => {
  /** @type {AuthUser} */
  let authUserWithNoRole;
  let authTestUserWithUserRole;

  beforeAll(async () => {
    const newUserWithNoRole = {
      email: `new.test.user+${Date.now()}@test.com`,
      password: testPassword,
    };

    await prismaClient.user.create({
      data: {
        email: newUserWithNoRole.email,
        passwordHash: hashedTestPassword,
      },
    });

    authUserWithNoRole = await logInAsUser({
      app: testApp,
      user: newUserWithNoRole,
    });
    authTestUserWithUserRole = await logInAsUser({
      app: testApp,
      user: testUser,
    });
  });

  test('should redirect to /login if user is not logged in', async () => {
    const response = await request(testApp).get('/');
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('should return 403 status code if user is not authorized', async () => {
    const response = await request(testApp)
      .get('/')
      .set('Cookie', [authUserWithNoRole.sessionCookie]);

    expect(response.statusCode).toBe(403);
  });

  test('should render index view if user is authorized', async () => {
    const response = await request(testApp)
      .get('/')
      .set('Cookie', [authTestUserWithUserRole.sessionCookie]);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('QA Playwright Reports');
  });
});

describe('GET /api/ping', () => {
  test('should return pong', async () => {
    const response = await request(testApp).get('/api/ping');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'pong' });
  });
});
