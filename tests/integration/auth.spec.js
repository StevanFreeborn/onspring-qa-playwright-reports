/**
 * @typedef {object} AuthUser
 * @property {string} csrfCookie The csrf cookie
 * @property {string} sessionCookie The session cookie
 * @property {string} csrfToken The csrf token
 */

import { JSDOM } from 'jsdom';
import request from 'supertest';
import { app } from '../../app.js';
import { prismaClient } from '../../data/prisma.js';
import { emailService } from '../../services/email.js';
import { testAdminUser, testUser } from './db.setup.js';
import { logInAsUser } from './utils.js';

describe('GET /login', () => {
  test('it should return a 200 status code', async () => {
    const response = await request(app).get('/login');

    expect(response.statusCode).toBe(200);
  });

  test('it should set a csrf cookie', async () => {
    const response = await request(app).get('/login');

    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^csrfToken=.+/)])
    );
  });

  test('it should set a session cookie', async () => {
    const response = await request(app).get('/login');

    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^connect.sid=.+/)])
    );
  });

  test('it should return a login view that contains a csrf token', async () => {
    const response = await request(app).get('/login');

    const {
      window: { document: view },
    } = new JSDOM(response.text);

    const csrfToken = view
      .querySelector('meta[name="csrf-token"]')
      .getAttribute('content');

    expect(csrfToken).toBeDefined();
    expect(response.text).toContain('Login');
  });
});

describe('POST /login', () => {
  let csrfToken;
  let cookies;

  beforeAll(async () => {
    const response = await request(app).get('/login');

    const {
      window: { document: view },
    } = new JSDOM(response.text);

    csrfToken = view
      .querySelector('meta[name="csrf-token"]')
      .getAttribute('content');

    cookies = response.headers['set-cookie'];
  });

  test('it should return 500 error if no csrf token or cookie is in request', async () => {
    const response = await request(app)
      .post('/login')
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.statusCode).toBe(500);
  });

  test('it should return 500 error if no csrf cookie is in request', async () => {
    const response = await request(app)
      .post('/login')
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
        password: testUser.password,
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(500);
  });

  test('it should return 500 error if no csrf token is in request body', async () => {
    const response = await request(app)
      .post('/login')
      .type('x-www-form-urlencoded')
      .set('Cookie', cookies)
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.statusCode).toBe(500);
  });

  test('it should return a 400 error if no password or email is provided', async () => {
    const response = await request(app)
      .post('/login')
      .type('x-www-form-urlencoded')
      .set('Cookie', cookies)
      .send({
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
  });

  test('it should return a 400 error if no password is provided', async () => {
    const response = await request(app)
      .post('/login')
      .set('Cookie', cookies)
      .type('x-www-form-urlencoded')
      .send({ email: testUser.email, _csrf: csrfToken });

    expect(response.statusCode).toBe(400);
  });

  test('it should return a 400 error if no email is provided', async () => {
    const response = await request(app)
      .post('/login')
      .set('Cookie', cookies)
      .type('x-www-form-urlencoded')
      .send({ password: testUser.password, _csrf: csrfToken });

    expect(response.statusCode).toBe(400);
  });

  test('it should return a 400 error if the email is not valid', async () => {
    const response = await request(app)
      .post('/login')
      .set('Cookie', cookies)
      .type('x-www-form-urlencoded')
      .send({
        email: 'not-an-email',
        password: testUser.password,
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
  });

  test('it should return a 400 error if the password is not valid', async () => {
    const response = await request(app)
      .post('/login')
      .set('Cookie', cookies)
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
        password: 'short',
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
  });

  test('it should return a 302 redirect to index view and set a new session cookie if the email and password are valid', async () => {
    const response = await request(app)
      .post('/login')
      .set('Cookie', cookies)
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
        password: testUser.password,
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^connect.sid=.+/)])
    );
  });
});

describe('POST /logout', () => {
  /** @type {AuthUser} */
  let authTestUser;

  beforeAll(async () => {
    authTestUser = await logInAsUser(testUser);
  });

  test('it should return a 500 error if no csrf token or cookie is in request', async () => {
    const response = await request(app)
      .post('/logout')
      .type('application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({});

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error: 'An unexpected error has occurred',
    });
  });

  test('it should return a 500 error if no csrf cookie is in quest', async () => {
    const response = await request(app)
      .post('/logout')
      .type('application/json')
      .set('Cookie', [authTestUser.sessionCookie])
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        _csrf: authTestUser.csrfToken,
      });

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error: 'An unexpected error has occurred',
    });
  });

  test('it should return a 500 error if no csrf token is in request body', async () => {
    const response = await request(app)
      .post('/logout')
      .type('application/json')
      .set('Cookie', [authTestUser.csrfCookie, authTestUser.sessionCookie])
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({});

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error: 'An unexpected error has occurred',
    });
  });

  test('it should return a 302 redirect to login view when user is signed in', async () => {
    const response = await request(app)
      .post('/logout')
      .type('application/json')
      .set('Cookie', [authTestUser.csrfCookie, authTestUser.sessionCookie])
      .send({
        _csrf: authTestUser.csrfToken,
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('it should return a 401 error when user is not signed in', async () => {
    const response = await request(app)
      .post('/logout')
      .type('application/json')
      .set('Cookie', [authTestUser.csrfCookie])
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        _csrf: authTestUser.csrfToken,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });
});

describe('GET /register', () => {
  /** @type {AuthUser} */
  let authTestUser;
  /** @type {AuthUser} */
  let authTestAdminUser;

  beforeAll(async () => {
    authTestUser = await logInAsUser(testUser);
    authTestAdminUser = await logInAsUser(testAdminUser);
  });

  test('it should return a 302 redirect to login view when user is not signed in with redirect query param', async () => {
    const registerPath = '/register';
    const response = await request(app).get(registerPath);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      `/login?redirect=${encodeURIComponent(registerPath)}`
    );
  });

  test('it should return a 401 error when user is not signed in and request is xhr', async () => {
    const response = await request(app)
      .get('/register')
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  test('it should return a 403 error when user is not signed in as an admin', async () => {
    const response = await request(app)
      .get('/register')
      .set('Cookie', [authTestUser.csrfCookie, authTestUser.sessionCookie]);

    expect(response.statusCode).toBe(403);
    expect(response.text).toContain('Forbidden');
  });

  test('it should return a 403 error as json when user is not signed in as an admin and request is xhr', async () => {
    const response = await request(app)
      .get('/register')
      .set('Cookie', [authTestUser.csrfCookie, authTestUser.sessionCookie])
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });

  test('it should return a 200 status code and a register view when user is signed in as an admin', async () => {
    const response = await request(app)
      .get('/register')
      .set('Cookie', [
        authTestAdminUser.csrfCookie,
        authTestAdminUser.sessionCookie,
      ]);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Register');
  });
});

describe('POST /register', () => {
  /** @type {AuthUser} */
  let authTestUser;
  /** @type {AuthUser} */
  let authTestAdminUser;

  beforeAll(async () => {
    authTestUser = await logInAsUser(testUser);
    authTestAdminUser = await logInAsUser(testAdminUser);
  });

  test('it should return a 500 error if no csrf token or cookie is in request', async () => {
    const response = await request(app)
      .post('/register')
      .set('Cookie', [authTestAdminUser.sessionCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: 'new.user@test.com',
      });

    expect(response.statusCode).toBe(500);
  });

  test('it should return a 500 error if no csrf cookie is in request', async () => {
    const response = await request(app)
      .post('/register')
      .set('Cookie', [authTestAdminUser.sessionCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: 'new.user@test.com',
        _csrf: authTestAdminUser.csrfToken,
      });

    expect(response.statusCode).toBe(500);
  });

  test('it should return a 500 error if no csrf token is in request body', async () => {
    const response = await request(app)
      .post('/register')
      .set('Cookie', [
        authTestAdminUser.sessionCookie,
        authTestAdminUser.csrfCookie,
      ])
      .type('x-www-form-urlencoded')
      .send({
        email: 'new.user@test.com',
      });

    expect(response.statusCode).toBe(500);
  });

  test('it should return a 302 redirect to login view when user is not signed in with redirect query param', async () => {
    const registerPath = '/register';
    const response = await request(app)
      .post(registerPath)
      .set('Cookie', [authTestAdminUser.csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: 'new.user@test.com',
        _csrf: authTestAdminUser.csrfToken,
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      `/login?redirect=${encodeURIComponent(registerPath)}`
    );
  });

  test('it should return a 401 error when user is not signed in and request is xhr', async () => {
    const response = await request(app)
      .post('/register')
      .set('Cookie', [authTestAdminUser.csrfCookie])
      .set('X-Requested-With', 'XMLHttpRequest')
      .type('x-www-form-urlencoded')
      .send({
        email: 'new.user@test.com',
        _csrf: authTestAdminUser.csrfToken,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  test('it should return a 403 error when user is not signed in as an admin', async () => {
    const response = await request(app)
      .post('/register')
      .set('Cookie', [authTestUser.csrfCookie, authTestUser.sessionCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: 'new.user@test.com',
        _csrf: authTestUser.csrfToken,
      });

    expect(response.statusCode).toBe(403);
    expect(response.text).toContain('Forbidden');
  });

  test('it should return a 403 error as json when user is not signed in as an admin and request is xhr', async () => {
    const response = await request(app)
      .post('/register')
      .set('Cookie', [authTestUser.csrfCookie, authTestUser.sessionCookie])
      .set('X-Requested-With', 'XMLHttpRequest')
      .type('x-www-form-urlencoded')
      .send({
        email: 'new.user@test.com',
        _csrf: authTestUser.csrfToken,
      });

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });

  test('it should return a 400 error if no email is provided', async () => {
    const response = await request(app)
      .post('/register')
      .set('Cookie', [
        authTestAdminUser.csrfCookie,
        authTestAdminUser.sessionCookie,
      ])
      .type('x-www-form-urlencoded')
      .send({
        email: '',
        _csrf: authTestAdminUser.csrfToken,
      });

    expect(response.statusCode).toBe(400);
  });

  test('it should return a 400 error if user already exists with given email', async () => {
    const response = await request(app)
      .post('/register')
      .set('Cookie', [
        authTestAdminUser.csrfCookie,
        authTestAdminUser.sessionCookie,
      ])
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
        _csrf: authTestAdminUser.csrfToken,
      });

    expect(response.statusCode).toBe(400);
  });

  test('it should return a 500 error if new account email fails to send', async () => {
    jest.spyOn(emailService, 'sendNewAccountEmail').mockImplementation(() => ({
      isFailed: true,
      isSuccess: false,
      error: new Error('Failed to send email'),
    }));

    const response = await request(app)
      .post('/register')
      .set('Cookie', [
        authTestAdminUser.csrfCookie,
        authTestAdminUser.sessionCookie,
      ])
      .type('x-www-form-urlencoded')
      .send({
        email: `new.user+${Date.now()}@test.com`,
        _csrf: authTestAdminUser.csrfToken,
      });

    expect(response.statusCode).toBe(500);
    expect(emailService.sendNewAccountEmail).toHaveBeenCalledTimes(1);
  });

  test('it should return a 302 redirect to register view with a success query param', async () => {
    jest.spyOn(emailService, 'sendNewAccountEmail').mockImplementation(() => ({
      isFailed: false,
      isSuccess: true,
      value: 'Email sent to user: 1',
    }));

    const response = await request(app)
      .post('/register')
      .set('Cookie', [
        authTestAdminUser.csrfCookie,
        authTestAdminUser.sessionCookie,
      ])
      .type('x-www-form-urlencoded')
      .send({
        email: `new.user+${Date.now()}@test.com`,
        _csrf: authTestAdminUser.csrfToken,
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/register?success=true');
    expect(emailService.sendNewAccountEmail).toHaveBeenCalledTimes(1);
  });
});

describe('GET /forgot-password', () => {
  test('it should return a 200 status code with forgot password view', async () => {
    const response = await request(app).get('/forgot-password');

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Forgot Password');
  });
});

describe('POST /forgot-password', () => {
  let csrfToken;
  let csrfCookie;

  beforeAll(async () => {
    const response = await request(app).get('/forgot-password');

    const {
      window: { document: view },
    } = new JSDOM(response.text);

    csrfToken = view
      .querySelector('meta[name="csrf-token"]')
      .getAttribute('content');

    csrfCookie = response.headers['set-cookie'].find(cookie =>
      cookie.startsWith('csrfToken')
    );
  });

  beforeEach(async () => {
    jest.spyOn(emailService, 'sendForgotPasswordEmail');
  });

  test('it should return 500 error if no csrf token or cookie is in request', async () => {
    const response = await request(app)
      .post('/forgot-password')
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
      });

    expect(response.statusCode).toBe(500);
    expect(emailService.sendForgotPasswordEmail).toHaveBeenCalledTimes(0);
  });

  test('it should return 500 error if no csrf cookie is in request', async () => {
    const response = await request(app)
      .post('/forgot-password')
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(500);
    expect(emailService.sendForgotPasswordEmail).toHaveBeenCalledTimes(0);
  });

  test('it should return 500 error if no csrf token is in request body', async () => {
    const response = await request(app)
      .post('/forgot-password')
      .type('x-www-form-urlencoded')
      .set('Cookie', [csrfCookie])
      .send({
        email: testUser.email,
      });

    expect(response.statusCode).toBe(500);
    expect(emailService.sendForgotPasswordEmail).toHaveBeenCalledTimes(0);
  });

  test('it should return 400 status code if no email is provided', async () => {
    const response = await request(app)
      .post('/forgot-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: '',
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Forgot Password');
    expect(emailService.sendForgotPasswordEmail).toHaveBeenCalledTimes(0);
  });

  test('it should return 302 status code with redirect to forgot password view with success query param', async () => {
    const response = await request(app)
      .post('/forgot-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: 'does.not.exist@test.com',
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/forgot-password?success=true');
    expect(emailService.sendForgotPasswordEmail).toHaveBeenCalledTimes(0);
  });

  test('it should return 302 status code with redirect to forgot password view with success query param if user already has an unexpired password reset token', async () => {
    const passwordToken = await prismaClient.passwordToken.create({
      data: {
        expiresAt: Date.now() + 15 * 60 * 1000,
        token: 'test-token',
        user: {
          connect: {
            id: testUser.id,
          },
        },
      },
    });

    const response = await request(app)
      .post('/forgot-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/forgot-password?success=true');
    expect(emailService.sendForgotPasswordEmail).toHaveBeenCalledTimes(0);

    await prismaClient.passwordToken.delete({
      where: {
        id: passwordToken.id,
      },
    });
  });

  test('it should return 302 status code with redirect to forgot password view with success query param if email fails to send', async () => {
    emailService.sendForgotPasswordEmail.mockImplementation(() => ({
      isFailed: true,
      isSuccess: false,
      error: new Error('Failed to send email'),
    }));

    const response = await request(app)
      .post('/forgot-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/forgot-password?success=true');
    expect(emailService.sendForgotPasswordEmail).toHaveBeenCalledTimes(1);
  });

  test('it should return 302 status code with redirect to forgot password view with success query param if email is sent successfully', async () => {
    emailService.sendForgotPasswordEmail.mockImplementation(() => ({
      isFailed: false,
      isSuccess: true,
      value: 'Email sent to user: 1',
    }));

    const response = await request(app)
      .post('/forgot-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/forgot-password?success=true');
    expect(emailService.sendForgotPasswordEmail).toHaveBeenCalledTimes(1);
  });
});

describe('GET /set-password', () => {
  afterEach(async () => {
    await prismaClient.passwordToken.deleteMany();
  });

  test('it should return a 400 status code if no token is provided', async () => {
    const response = await request(app).get('/set-password');

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Invalid token');
  });

  test('it should return a 400 status code if token is expired', async () => {
    const passwordToken = await prismaClient.passwordToken.create({
      data: {
        expiresAt: Date.now() - 15 * 60 * 1000,
        token: 'test_token',
        user: {
          connect: {
            id: testUser.id,
          },
        },
      },
    });

    const response = await request(app).get(
      `/set-password?token=${passwordToken.token}`
    );

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Invalid token');
  });

  test('it should return 200 status code with set password view if token is valid', async () => {
    const passwordToken = await prismaClient.passwordToken.create({
      data: {
        expiresAt: Date.now() + 15 * 60 * 1000,
        token: 'test_token',
        user: {
          connect: {
            id: testUser.id,
          },
        },
      },
    });

    const response = await request(app).get(
      `/set-password?token=${passwordToken.token}`
    );

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain(testUser.email);
  });
});

describe('POST /set-password', () => {
  let csrfToken;
  let csrfCookie;
  let createdTestUser;

  beforeAll(async () => {
    const response = await request(app).get('/set-password');

    const {
      window: { document: view },
    } = new JSDOM(response.text);

    csrfToken = view
      .querySelector('meta[name="csrf-token"]')
      .getAttribute('content');

    csrfCookie = response.headers['set-cookie'].find(cookie =>
      cookie.startsWith('csrfToken')
    );

    createdTestUser = await prismaClient.user.create({
      data: {
        email: `new.test.user+${Date.now()}@test.com`,
        passwordHash: 'passwordHash',
      },
    });
  });

  afterEach(async () => {
    await prismaClient.passwordToken.deleteMany();
  });

  test('it should return 500 error if no csrf token or cookie is in request', async () => {
    const response = await request(app)
      .post('/set-password')
      .type('x-www-form-urlencoded')
      .send({
        email: testUser.email,
        password: '@New_password1',
        verifyPassword: '@New_password1',
        token: 'test_token',
      });

    expect(response.statusCode).toBe(500);
  });

  test('it should return 500 error if no csrf cookie is in request', async () => {
    const response = await request(app)
      .post('/set-password')
      .type('x-www-form-urlencoded')
      .send({
        email: createdTestUser.email,
        password: '@New_password1',
        verifyPassword: '@New_password1',
        token: 'test_token',
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(500);
  });

  test('it should return 500 error if no csrf token is in request body', async () => {
    const response = await request(app)
      .post('/set-password')
      .type('x-www-form-urlencoded')
      .set('Cookie', [csrfCookie])
      .send({
        email: createdTestUser.email,
        password: '@New_password1',
        verifyPassword: '@New_password1',
        token: 'test_token',
      });

    expect(response.statusCode).toBe(500);
  });

  test('it should return 400 status code if no token is provided', async () => {
    const response = await request(app)
      .post('/set-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: createdTestUser.email,
        password: '@New_password1',
        verifyPassword: '@New_password1',
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Token is required');
  });

  test('it should return 400 status code if email is not provided', async () => {
    const response = await request(app)
      .post('/set-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        password: '@New_password1',
        verifyPassword: '@New_password1',
        token: 'test_token',
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Email is required');
  });

  test('it should return 400 status code if password is not provided', async () => {
    const response = await request(app)
      .post('/set-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: createdTestUser.email,
        verifyPassword: '@New_password1',
        token: 'test_token',
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Password is required');
  });

  test('it should return 400 status code if password does not meet complexity requirements', async () => {
    const response = await request(app)
      .post('/set-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: createdTestUser.email,
        password: 'new_password',
        verifyPassword: 'new_password',
        token: 'test_token',
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Password is required');
  });

  test('it should return 400 status code if verify password is not provided', async () => {
    const response = await request(app)
      .post('/set-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: createdTestUser.email,
        password: '@New_password1',
        token: 'test_token',
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Verify password is required');
  });

  test('it should return 400 status code if password and verify password do not match', async () => {
    const response = await request(app)
      .post('/set-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: createdTestUser.email,
        password: '@New_password1',
        verifyPassword: '@New_password2',
        token: 'test_token',
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Passwords do not match');
  });

  test('it should return 400 status code if email is not for same user as token', async () => {
    const passwordToken = await prismaClient.passwordToken.create({
      data: {
        expiresAt: Date.now() + 15 * 60 * 1000,
        token: 'test_token',
        user: {
          connect: {
            id: testUser.id,
          },
        },
      },
    });

    const response = await request(app)
      .post('/set-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: createdTestUser.email,
        password: '@New_password1',
        verifyPassword: '@New_password1',
        token: passwordToken.token,
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Unable to set password');
  });

  test('it should return 400 status code if token is expired', async () => {
    const passwordToken = await prismaClient.passwordToken.create({
      data: {
        expiresAt: Date.now() - 15 * 60 * 1000,
        token: 'test_token',
        user: {
          connect: {
            id: createdTestUser.id,
          },
        },
      },
    });

    const response = await request(app)
      .post('/set-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: createdTestUser.email,
        password: '@New_password1',
        verifyPassword: '@New_password1',
        token: passwordToken.token,
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Unable to set password');
  });

  test('it should return 302 status code with redirect to login view if token is valid and password is updated', async () => {
    const passwordToken = await prismaClient.passwordToken.create({
      data: {
        expiresAt: Date.now() + 15 * 60 * 1000,
        token: 'test_token',
        user: {
          connect: {
            id: createdTestUser.id,
          },
        },
      },
    });

    const response = await request(app)
      .post('/set-password')
      .set('Cookie', [csrfCookie])
      .type('x-www-form-urlencoded')
      .send({
        email: createdTestUser.email,
        password: '@New_password1',
        verifyPassword: '@New_password1',
        token: passwordToken.token,
        _csrf: csrfToken,
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/login');
  });
});
