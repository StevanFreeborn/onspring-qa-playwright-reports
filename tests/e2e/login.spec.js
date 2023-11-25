import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { saveAccessibilityResultsToReport } from './utils.js';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('it should pass all accessibility checks', async ({
    page,
  }, testInfo) => {
    const excludedSelectors = ['.login-button'];

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude(excludedSelectors)
      .analyze();

    await saveAccessibilityResultsToReport(testInfo, accessibilityScanResults);

    expect(accessibilityScanResults.violations.length).toBe(0);
  });

  test('it should contain a heading that has expected text', async ({
    page,
  }) => {
    const heading = await page.innerText('h1');

    expect(heading).toBe('Onspring QA Reports');
  });

  test('it should contain login form', async ({ page }) => {
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
    const emailField = page.getByLabel('Email');
    const passwordField = page.getByLabel('Password');

    await expect(emailField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });

  test('it should have a link to the forgot password page', async ({
    page,
  }) => {
    const forgotPasswordLink = page.getByText('Forgot password?');

    await expect(forgotPasswordLink).toHaveAttribute(
      'href',
      '/forgot-password'
    );
  });

  test('it should display an error message when login fails', async ({
    page,
  }) => {
    const emailField = page.getByLabel('Email');
    const passwordField = page.getByLabel('Password');
    const loginButton = page.getByText('Login');

    await emailField.fill('fake.user@test.com');
    await passwordField.fill('password');
    await loginButton.click();

    const errors = page.locator('.error');

    await expect(errors).toBeVisible();
  });
});
