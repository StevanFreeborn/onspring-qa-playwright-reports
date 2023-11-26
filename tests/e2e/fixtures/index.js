import { test as base } from '@playwright/test';
import path from 'path';
import { AUTH_STORAGE_PATH } from '../../../playwright.config.js';
import { testUser } from './testUsers.js';

/**
 * @summary Creates a user page using the users stored auth state
 * @param {object} params - The params
 * @param {import('playwright').BrowserContext} params.browser - The browser context
 * @param {Function} use - The test function
 * @param {object} user - The user object
 * @param {string} user.email - The user email
 * @returns {Promise<void>} A promise that resolves when the operation is complete
 */
async function createUserPage({ browser }, use, user) {
  const storagePath = path.join(AUTH_STORAGE_PATH, `${user.email}.json`);
  const context = await browser.newContext({
    storageState: storagePath,
  });

  const page = await context.newPage();
  await use(page);
  await context.close();
}

const test = base.extend({
  testUser: async ({}, use) => {
    await use(testUser);
  },
  userWithNoRole: async ({ browser, testUser }, use) => {
    await createUserPage({ browser }, use, testUser.withNoRole);
  },
  userWithUserRole: async ({ browser, testUser }, use) => {
    await createUserPage({ browser }, use, testUser.withUserRole);
  },
  userWithAdminRole: async ({ browser, testUser }, use) => {
    await createUserPage({ browser }, use, testUser.withAdminRole);
  },
});

export { test };
