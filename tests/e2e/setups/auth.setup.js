import { expect } from '@playwright/test';
import path from 'path';
import { AUTH_STORAGE_PATH } from '../../../playwright.config.js';
import { test as setup } from '../fixtures/index.js';

setup('login as user with no role', async ({ page, testUser }) => {
  await login(page, testUser.withNoRole);
});

setup('login as user with user role', async ({ page, testUser }) => {
  await login(page, testUser.withUserRole);
});

setup('login as user with admin role', async ({ page, testUser }) => {
  await login(page, testUser.withAdminRole);
});

/**
 * @summary Login as a user
 * @param {import('playwright').Page} page - Page object
 * @param {object} user - User object
 * @param {string} user.email - User email
 * @param {string} user.password - User password
 * @returns {Promise<void>} Promise that resolves when login is complete
 */
async function login(page, user) {
  await page.goto('/login');

  const emailField = page.getByLabel('Email');
  const passwordField = page.getByLabel('Password');
  const loginButton = page.getByText('Login');

  await emailField.fill(user.email);
  await passwordField.fill(user.password);
  await loginButton.click();

  await expect(page).toHaveURL('/');

  const storagePath = path.join(AUTH_STORAGE_PATH, `${user.email}.json`);
  await page.context().storageState({ path: storagePath });
  await page.close();
}
