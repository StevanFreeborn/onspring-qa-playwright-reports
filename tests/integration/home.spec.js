/**
 * @typedef {object} AuthUser
 * @property {string} csrfCookie The csrf cookie
 * @property {string} sessionCookie The session cookie
 * @property {string} csrfToken The csrf token
 */

import request from 'supertest';
import { app } from '../../app.js';
import { prismaClient } from '../../data/prisma.js';
import { hashedTestPassword, testPassword, testUser } from './db.setup.js';
import { logInAsUser } from './utils.js';

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

    authUserWithNoRole = await logInAsUser(newUserWithNoRole);
    authTestUserWithUserRole = await logInAsUser(testUser);
  });

  test('should redirect to /login if user is not logged in', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('should return 403 status code if user is not authorized', async () => {
    const response = await request(app)
      .get('/')
      .set('Cookie', [authUserWithNoRole.sessionCookie]);

    expect(response.statusCode).toBe(403);
  });

  test('should render index view if user is authorized', async () => {
    const response = await request(app)
      .get('/')
      .set('Cookie', [authTestUserWithUserRole.sessionCookie]);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('QA Playwright Reports');
  });
});

describe('GET /api/ping', () => {
  test('should return pong', async () => {
    const response = await request(app).get('/api/ping');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'pong' });
  });
});
