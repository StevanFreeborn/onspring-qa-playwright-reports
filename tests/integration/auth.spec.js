import { JSDOM } from 'jsdom';
import request from 'supertest';
import { app } from '../../app.js';
import { testUser } from './db.setup.js';

describe('auth', () => {
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
    let authSessionCsrfToken;
    let authCsrfCookie;
    let authSessionCookie;

    beforeAll(async () => {
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
          email: testUser.email,
          password: testUser.password,
          _csrf: csrfToken,
        });

      const loginResponseCookies = loginResponse.headers['set-cookie'];
      authSessionCookie = loginResponseCookies.find(cookie =>
        cookie.includes('connect.sid')
      );

      const indexResponse = await request(app)
        .get('/')
        .set('Cookie', loginResponseCookies);

      const {
        window: { document: indexView },
      } = new JSDOM(indexResponse.text);

      const indexResponseCookies = indexResponse.headers['set-cookie'];
      authCsrfCookie = indexResponseCookies.find(cookie =>
        cookie.includes('csrfToken')
      );
      authSessionCsrfToken = indexView
        .querySelector('meta[name="csrf-token"]')
        .getAttribute('content');
    });

    test('it should return a 500 error if no csrf token or cookie is in request', async () => {
      const response = await request(app)
        .post('/logout')
        .type('application/json')
        .set('Accept', 'application/json')
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
        .set('Cookie', [authSessionCookie])
        .set('Accept', 'application/json')
        .send({
          _csrf: authSessionCsrfToken,
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
        .set('Cookie', [authCsrfCookie, authSessionCookie])
        .set('Accept', 'application/json')
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
        .set('Cookie', [authCsrfCookie, authSessionCookie])
        .send({
          _csrf: authSessionCsrfToken,
        });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/login');
    });

    test('it should return a 401 error when user is not signed in', async () => {
      const response = await request(app)
        .post('/logout')
        .type('application/json')
        .set('Cookie', [authCsrfCookie])
        .set('Accept', 'application/json')
        .send({
          _csrf: authSessionCsrfToken,
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('GET /register', () => {});

  describe('POST /register', () => {});
});
