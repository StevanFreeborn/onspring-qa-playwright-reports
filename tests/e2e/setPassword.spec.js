import { AxeBuilder } from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { saveAccessibilityResultsToReport } from './utils.js';

test.describe('Set Password', () => {
  test('it should display error when no token is provided', async ({
    page,
  }) => {
    await page.goto('/set-password');

    const heading = page.getByRole('heading', {
      name: 'Set Password',
    });
    const errors = page.locator('.error');

    await expect(heading).toBeVisible();
    await expect(errors).toBeVisible();
  });

  test('it should display error when token is invalid', async ({ page }) => {
    await page.goto('/set-password?token=invalid');

    const heading = page.getByRole('heading', {
      name: 'Set Password',
    });
    const errors = page.locator('.error');

    await expect(heading).toBeVisible();
    await expect(errors).toBeVisible();
  });

  test('it should pass all accessibility checks', async ({
    page,
  }, testInfo) => {
    await page.goto('/set-password?token=token');

    const accessibilityScanResults = await new AxeBuilder({
      page,
    })
      .exclude('.set-password-button')
      .exclude('.error')
      .analyze();

    await saveAccessibilityResultsToReport(testInfo, accessibilityScanResults);

    expect(accessibilityScanResults.violations.length).toBe(0);
  });

  test('it should display set password form', async ({ page }) => {
    await page.goto('/set-password?token=token');

    const emailField = page.getByLabel('Email');
    const passwordField = page.getByLabel('Password', { exact: true });
    const verifyPasswordField = page.getByLabel('Verify Password');
    const csrfTokenField = page.locator('input[name="_csrf"]');
    const setPasswordButton = page.getByRole('button', {
      name: 'Set Password',
    });

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(verifyPasswordField).toBeVisible();
    await expect(csrfTokenField).toBeHidden();
    await expect(setPasswordButton).toBeVisible();
  });

  test('it should make the email field readonly and required', async ({
    page,
  }) => {
    await page.goto('/set-password?token=token');

    const emailField = page.getByLabel('Email');

    await expect(emailField).toHaveAttribute('readonly');
    await expect(emailField).toHaveAttribute('required');
  });

  test('it should make the password and verify password fields required', async ({
    page,
  }) => {
    await page.goto('/set-password?token=token');

    const passwordField = page.getByLabel('Password', { exact: true });
    const verifyPasswordField = page.getByLabel('Verify Password');

    await expect(passwordField).toHaveAttribute('required');
    await expect(verifyPasswordField).toHaveAttribute('required');
  });
});
