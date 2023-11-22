import { JSDOM } from 'jsdom';
import request from 'supertest';
import { app } from '../../app.js';

/**
 * @typedef {object} AuthUser
 * @property {string} csrfCookie The csrf cookie
 * @property {string} sessionCookie The session cookie
 * @property {string} csrfToken The csrf token
 */

/**
 * @summary Logs in as a user and returns the artifacts needed to make authenticated requests
 * @param {object} user The user to log in as
 * @param {string} user.email The user's email
 * @param {string} user.password The user's password
 * @returns {Promise<AuthUser>} A promise that resolves with the artifacts needed to make authenticated requests
 */
export async function logInAsUser(user) {
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
