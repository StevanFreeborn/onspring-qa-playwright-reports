/**
 * @typedef {object} AuthUser
 * @property {string} csrfCookie The csrf cookie
 * @property {string} sessionCookie The session cookie
 * @property {string} csrfToken The csrf token
 */

import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
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

describe('GET /reports', () => {
  /** @type {AuthUser} */
  let authUserWithNoRole;
  let authTestUserWithUserRole;

  beforeAll(async () => {
    const newUserWithNoRole = {
      email: `new.test+${Date.now()}@test.com`,
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

  test('it should redirect to /login if user is not logged in with redirect query param', async () => {
    const reportsPath = '/reports';
    const response = await request(testApp).get(reportsPath);
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      `/login?redirect=${encodeURIComponent(reportsPath)}`
    );
  });

  test('it should return 403 status code if user is not authorized', async () => {
    const response = await request(testApp)
      .get('/reports')
      .set('Cookie', [authUserWithNoRole.sessionCookie]);

    expect(response.statusCode).toBe(403);
  });

  test('it should render reports view if user is authorized', async () => {
    const response = await request(testApp)
      .get('/reports')
      .set('Cookie', [authTestUserWithUserRole.sessionCookie]);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('QA Playwright Reports');
  });
});

describe('GET /reports/:name', () => {
  /** @type {AuthUser} */
  let authUserWithNoRole;
  let authTestUserWithUserRole;
  let testReportName = '1700262676280-QA-success-Playwright_Tests-63-1';

  beforeAll(async () => {
    const newUserWithNoRole = {
      email: `new.test+${Date.now()}@test.com`,
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

  test('it should return 302 status code with redirect to /login if user is not logged in with redirect query param', async () => {
    const reportsPath = `/reports/${testReportName}/`;
    const response = await request(testApp).get(reportsPath);
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      `/login?redirect=${encodeURIComponent(reportsPath)}`
    );
  });

  test('it should return 403 status code if user is not authorized', async () => {
    const response = await request(testApp)
      .get(`/reports/${testReportName}/`)
      .set('Cookie', [authUserWithNoRole.sessionCookie]);

    expect(response.statusCode).toBe(403);
  });

  test('it should return 200 status code and reports view if user is authorized and report exists', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);

    const testReport = fs.readFileSync(
      path.join(
        process.cwd(),
        'tests',
        'integration',
        'testReports',
        'index.html'
      ),
      'utf8'
    );

    jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(testReport);

    const response = await request(testApp)
      .get(`/reports/${testReportName}/`)
      .set('Cookie', [authTestUserWithUserRole.sessionCookie]);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Onspring QA Reports');
    expect(fs.existsSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });

  test('it should return a 302 status code and redirect to index of requested report name if index left off', async () => {
    const response = await request(testApp)
      .get(`/reports/${testReportName}`)
      .set('Cookie', [authTestUserWithUserRole.sessionCookie]);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(`/reports/${testReportName}/`);
  });

  test('it should return 404 status code and not found view if user is authorized and report does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);
    const reportPath = '/reports/does-not-exist/';

    const response = await request(testApp)
      .get(reportPath)
      .set('Cookie', [authTestUserWithUserRole.sessionCookie]);

    expect(response.statusCode).toBe(404);
    expect(response.text).toContain('Not Found');
    expect(fs.existsSync).toHaveBeenNthCalledWith(
      1,
      path.join(process.cwd(), reportPath)
    );
  });
});
