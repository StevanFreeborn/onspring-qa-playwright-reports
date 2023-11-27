import { AxeBuilder } from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { saveAccessibilityResultsToReport } from './utils.js';

test.describe('Register', () => {
  test('it should display forbidden view if user has no role', async ({
    userWithNoRole,
  }) => {
    await userWithNoRole.goto('/register');

    const heading = userWithNoRole.getByText('Forbidden');

    await expect(heading).toBeVisible();
  });

  test('it should display forbidden view if user has only user role', async ({
    userWithUserRole,
  }) => {
    await userWithUserRole.goto('/register');

    const heading = userWithUserRole.getByText('Forbidden');

    await expect(heading).toBeVisible();
  });

  test('it should display register view if user has admin role', async ({
    userWithAdminRole,
  }) => {
    await userWithAdminRole.goto('/register');

    const heading = userWithAdminRole.getByText('Register User');

    await expect(heading).toBeVisible();
  });

  test('it should pass all accessibility checks', async ({
    userWithAdminRole,
  }, testInfo) => {
    await userWithAdminRole.goto('/register');

    const accessibilityScanResults = await new AxeBuilder({
      page: userWithAdminRole,
    })
      .exclude('.logout-button')
      .exclude('.register-button')
      .analyze();

    await saveAccessibilityResultsToReport(testInfo, accessibilityScanResults);

    expect(accessibilityScanResults.violations.length).toBe(0);
  });

  test('it should contain register form', async ({ userWithAdminRole }) => {
    await userWithAdminRole.goto('/register');

    const emailField = userWithAdminRole.getByLabel('Email');
    const csrfTokenField = userWithAdminRole.locator('input[name="_csrf"]');
    const registerButton = userWithAdminRole.getByRole('button', {
      name: 'Register',
    });

    await expect(emailField).toBeVisible();
    await expect(csrfTokenField).toBeHidden();
    await expect(registerButton).toBeVisible();
  });

  test('it should make the email field required', async ({
    userWithAdminRole,
  }) => {
    await userWithAdminRole.goto('/register');

    const emailField = userWithAdminRole.getByLabel('Email');

    await expect(emailField).toHaveAttribute('required');
  });

  test('it should display error if user already exists with given email', async ({
    userWithAdminRole,
    testUser,
  }) => {
    await userWithAdminRole.goto('/register');

    const emailField = userWithAdminRole.getByLabel('Email');
    const registerButton = userWithAdminRole.getByRole('button', {
      name: 'Register',
    });

    await emailField.fill(testUser.withAdminRole.email);
    await registerButton.click();

    const errors = userWithAdminRole.locator('.error');

    await expect(errors).toBeVisible();
  });
});
