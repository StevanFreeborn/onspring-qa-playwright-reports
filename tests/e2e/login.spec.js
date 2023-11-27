import { AxeBuilder } from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { saveAccessibilityResultsToReport } from './utils.js';

test.describe('Login', () => {
  test('it should pass all accessibility checks', async ({
    page,
  }, testInfo) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('.login-button')
      .analyze();

    await saveAccessibilityResultsToReport(testInfo, accessibilityScanResults);

    expect(accessibilityScanResults.violations.length).toBe(0);
  });

  test('it should contain a heading that has expected text', async ({
    page,
  }) => {
    await page.goto('/login');

    const heading = await page.innerText('h1');

    expect(heading).toBe('Onspring QA Reports');
  });

  test('it should contain login form', async ({ page }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Email');
    const passwordField = page.getByLabel('Password');
    const csrfField = page.locator('input[name="_csrf"]');
    const loginButton = page.getByText('Login');
    const forgotPasswordLink = page.getByText('Forgot password?');

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(csrfField).toBeHidden();
    await expect(loginButton).toBeVisible();
    await expect(forgotPasswordLink).toBeVisible();
  });

  test('it should make email and password fields required', async ({
    page,
  }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Email');
    const passwordField = page.getByLabel('Password');

    await expect(emailField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });

  test('it should have a link to the forgot password page', async ({
    page,
  }) => {
    await page.goto('/login');

    const forgotPasswordLink = page.getByText('Forgot password?');

    await expect(forgotPasswordLink).toHaveAttribute(
      'href',
      '/forgot-password'
    );
  });

  test('it should display an error message when login fails', async ({
    page,
  }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Email');
    const passwordField = page.getByLabel('Password');
    const loginButton = page.getByText('Login');

    await emailField.fill('fake.user@test.com');
    await passwordField.fill('password');
    await loginButton.click();

    const errors = page.locator('.error');

    await expect(errors).toBeVisible();
  });

  test('it should redirect to index view and display 403 error when login succeeds for user with no role', async ({
    page,
    testUser,
  }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Email');
    const passwordField = page.getByLabel('Password');
    const loginButton = page.getByText('Login');
    const heading = page.locator('h2');

    await emailField.fill(testUser.withNoRole.email);
    await passwordField.fill(testUser.withNoRole.password);
    await loginButton.click();

    await expect(page).toHaveURL('/');
    await expect(heading).toHaveText('Forbidden');
  });

  test('it should redirect to index view when login succeeds for user with user role', async ({
    page,
    testUser,
  }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Email');
    const passwordField = page.getByLabel('Password');
    const loginButton = page.getByText('Login');
    const heading = page.locator('h2');

    await emailField.fill(testUser.withUserRole.email);
    await passwordField.fill(testUser.withUserRole.password);
    await loginButton.click();

    await expect(page).toHaveURL('/');
    await expect(heading).toHaveText(/Playwright Reports/);
  });

  test('it should redirect to index view when login succeeds for user with admin role', async ({
    page,
    testUser,
  }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Email');
    const passwordField = page.getByLabel('Password');
    const loginButton = page.getByText('Login');
    const heading = page.locator('h2');

    await emailField.fill(testUser.withAdminRole.email);
    await passwordField.fill(testUser.withAdminRole.password);
    await loginButton.click();

    await expect(page).toHaveURL('/');
    await expect(heading).toHaveText(/Playwright Reports/);
  });

  test('it should redirect logged in user with no role to index view when they navigate to login page', async ({
    userWithNoRole,
  }) => {
    await userWithNoRole.goto('/login');

    await expect(userWithNoRole).toHaveURL('/');
  });

  test('it should redirect logged in user with user role to index view when they navigate to login page', async ({
    userWithUserRole,
  }) => {
    await userWithUserRole.goto('/login');

    await expect(userWithUserRole).toHaveURL('/');
  });

  test('it should redirect logged in user with admin role to index view when they navigate to login page', async ({
    userWithAdminRole,
  }) => {
    await userWithAdminRole.goto('/login');

    await expect(userWithAdminRole).toHaveURL('/');
  });
});
