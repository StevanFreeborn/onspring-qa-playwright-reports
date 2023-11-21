import { JSDOM } from 'jsdom';
import request from 'supertest';
import { app } from '../../app.js';

describe('auth', () => {
  describe('login', () => {
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
});
