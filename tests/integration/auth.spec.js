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

    test('it should return 500 error if no csrf tokens are present', async () => {
      const response = await request(app)
        .post('/login')
        .type('x-www-form-urlencoded')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.statusCode).toBe(500);
    });

    test('it should return 500 error if no csrf cookie is present', async () => {
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

    test('it should return 500 error if no csrf token is present in request body', async () => {
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
});
