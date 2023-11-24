import bcrypt from 'bcrypt';
import { JSDOM } from 'jsdom';
import request from 'supertest';

/**
 * @summary The timeout to use for hooks that setup the test environment.
 */
export const SETUP_HOOKS_TIMEOUT = 60000 * 2; // 2 minutes

/**`
 * @summary A generic test password.
 */
export const testPassword = 'password';

/**
 * @summary A hashed version of the test password.
 */
export const hashedTestPassword = bcrypt.hashSync(testPassword, 10);

/**
 * @summary A test admin user. It is used when seeding the test database.
 */
export const testAdminUser = {
  id: 0,
  email: `admin+${Date.now()}@test.com`,
  password: testPassword,
};

/**
 * @summary A test user. It is used when seeding the test database.
 */
export const testUser = {
  id: 0,
  email: `user+${Date.now()}@test.com`,
  password: testPassword,
};

/**
 * @typedef {object} AuthUser
 * @property {string} csrfCookie The csrf cookie
 * @property {string} sessionCookie The session cookie
 * @property {string} csrfToken The csrf token
 */

/**
 * @summary Logs in as a user and returns the artifacts needed to make authenticated requests
 * @param {object} params The params to use
 * @param {import('express').Express} params.app The Express app
 * @param {import('.prisma/client').User} params.user The user to log in as
 * @returns {Promise<AuthUser>} A promise that resolves with the artifacts needed to make authenticated requests
 */
export async function logInAsUser({ app, user }) {
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

/**
 * @summary Seeds the test database with test data
 * @param {import('.prisma/client').PrismaClient} prismaClient The prisma client
 * @returns {Promise<void>} A promise that resolves when the operation is complete
 */
export async function seedTestData(prismaClient) {
  await prismaClient.role.createMany({
    data: [
      {
        name: 'admin',
      },
      {
        name: 'user',
      },
    ],
  });

  const createdTestAdminUser = await prismaClient.user.create({
    data: {
      email: testAdminUser.email,
      passwordHash: hashedTestPassword,
      userRoles: {
        create: [
          {
            role: {
              connect: {
                name: 'admin',
              },
            },
          },
          {
            role: {
              connect: {
                name: 'user',
              },
            },
          },
        ],
      },
    },
  });

  const createdTestUser = await prismaClient.user.create({
    data: {
      email: testUser.email,
      passwordHash: hashedTestPassword,
      userRoles: {
        create: {
          role: {
            connect: {
              name: 'user',
            },
          },
        },
      },
    },
  });

  testUser.id = createdTestUser.id;
  testAdminUser.id = createdTestAdminUser.id;
}
