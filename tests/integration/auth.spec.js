/**
 * @typedef {object} AuthUser
 * @property {string} csrfCookie The csrf cookie
 * @property {string} sessionCookie The session cookie
 * @property {string} csrfToken The csrf token
 */

import { JSDOM } from 'jsdom';
import request from 'supertest';
import { app } from '../../app.js';
import { testAdminUser, testUser } from './db.setup.js';

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
  test('it should return a 500 error if no csrf token or cookie is in request', async () => {});

  test('it should return a 500 error if no csrf cookie is in request', async () => {});

  test('it should return a 500 error if no csrf token is in request body', async () => {});

  test('it should return a 302 redirect to login view when user is not signed in', async () => {});

  test('it should return a 401 error when user is not signed in and request is xhr', async () => {});

  test('it should return a 403 error when user is not signed in as an admin', async () => {});

  test('it should return a 403 error as json when user is not signed in as an admin and request is xhr', async () => {});

  test('it should return a 400 error if no email is provided', async () => {});

  test('it should return a 400 error if user already exists as admin', async () => {});

  test('it should return a 500 error if new account email fails to send', async () => {});

  test('it should return a 302 redirect to register view with a success query param', async () => {});
});

/**
 * @summary Logs in as a user and returns the artifacts needed to make authenticated requests
 * @param {object} user The user to log in as
 * @param {string} user.email The user's email
 * @param {string} user.password The user's password
 * @returns {Promise<AuthUser>} A promise that resolves with the artifacts needed to make authenticated requests
 */
async function logInAsUser(user) {
  const response = await request(app).get('/login');

  const {
    window: { document: loginView },
  } = new JSDOM(response.text);

  const csrfToken = loginView
    .querySelector('meta[name="csrf-token"]')
    .getAttribute('content');

  const cookies = response.headers['set-cookie'];

  const loginResponse = await request(app)
    .post('/login')
    .set('Cookie', cookies)
    .type('x-www-form-urlencoded')
    .send({
      email: user.email,
      password: user.password,
      _csrf: csrfToken,
    });

  const loginResponseCookies = loginResponse.headers['set-cookie'];
  const authSessionCookie = loginResponseCookies.find(cookie =>
    cookie.includes('connect.sid')
  );

  const indexResponse = await request(app)
    .get('/')
    .set('Cookie', loginResponseCookies);

  const {
    window: { document: indexView },
  } = new JSDOM(indexResponse.text);

  const indexResponseCookies = indexResponse.headers['set-cookie'];
  const authCsrfCookie = indexResponseCookies.find(cookie =>
    cookie.includes('csrfToken')
  );
  const authSessionCsrfToken = indexView
    .querySelector('meta[name="csrf-token"]')
    .getAttribute('content');

  return {
    csrfCookie: authCsrfCookie,
    sessionCookie: authSessionCookie,
    csrfToken: authSessionCsrfToken,
  };
}
