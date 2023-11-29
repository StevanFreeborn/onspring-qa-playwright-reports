import { AxeBuilder } from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { saveAccessibilityResultsToReport } from './utils.js';

test.describe('Index', () => {
  test('it should redirect to login page when user is not logged in', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('it should display forbidden page when user is logged in but does not have the role', async ({
    userWithNoRole,
  }) => {
    await userWithNoRole.goto('/');

    const heading = userWithNoRole.getByText('Forbidden');

    await expect(heading).toBeVisible();
  });

  test('it should pass all accessibility checks', async ({
    userWithUserRole,
  }, testInfo) => {
    await userWithUserRole.goto('/');

    const accessibilityScanResults = await new AxeBuilder({
      page: userWithUserRole,
    })
      .exclude('.label')
      .exclude('.logout-button')
      .exclude('#clearFiltersButton')
      .analyze();

    await saveAccessibilityResultsToReport(testInfo, accessibilityScanResults);

    expect(accessibilityScanResults.violations.length).toBe(0);
  });

  test('it should have nav brand link that links to index page', async ({
    userWithNoRole,
  }) => {
    await userWithNoRole.goto('/');

    const navBrandLink = userWithNoRole.getByRole('link', {
      name: 'Onspring QA Reports',
      exact: true,
    });

    await expect(navBrandLink).toHaveAttribute('href', '/');

    await navBrandLink.click();

    await expect(userWithNoRole).toHaveURL('/');
  });

  test('it should display the playwright reports', async ({
    userWithUserRole,
  }) => {
    await userWithUserRole.goto('/');

    const heading = userWithUserRole.getByText(/Playwright Reports/);

    await expect(heading).toBeVisible();
  });

  test('it should display a logout button', async ({ userWithNoRole }) => {
    await userWithNoRole.goto('/');

    const logoutButton = userWithNoRole.getByRole('button', {
      name: 'Logout',
      exact: true,
    });

    await expect(logoutButton).toBeVisible();
  });

  test('it should have a logout button that logs the user out', async ({
    page,
    testUser,
  }) => {
    await page.goto('/login');

    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    const loginButton = page.getByText('Login');

    await emailInput.fill(testUser.withNoRole.email);
    await passwordInput.fill(testUser.withNoRole.password);
    await loginButton.click();

    await page.waitForURL('/');

    const logoutButton = page.getByRole('button', {
      name: 'Logout',
    });

    await logoutButton.click();

    await expect(page).toHaveURL('/login');
  });

  test('it should not display a link to reports page if user has no role', async ({
    userWithNoRole,
  }) => {
    await userWithNoRole.goto('/');

    const reportsLink = userWithNoRole.getByRole('link', {
      name: 'Reports',
      exact: true,
    });

    await expect(reportsLink).toBeHidden();
  });

  test('it should display a link to reports page', async ({
    userWithUserRole,
  }) => {
    await userWithUserRole.goto('/');

    const reportsLink = userWithUserRole.getByRole('link', {
      name: 'Reports',
      exact: true,
    });

    await expect(reportsLink).toBeVisible();
  });

  test('it should have a reports link that links to reports page', async ({
    userWithUserRole,
  }) => {
    await userWithUserRole.goto('/');

    const reportsLink = userWithUserRole.getByRole('link', {
      name: 'Reports',
      exact: true,
    });

    await expect(reportsLink).toHaveAttribute('href', '/reports');

    await reportsLink.click();

    await expect(userWithUserRole).toHaveURL('/reports');
  });

  test('it should not display an add user link when not in admin role', async ({
    userWithUserRole,
  }) => {
    await userWithUserRole.goto('/');

    const addUserLink = userWithUserRole.getByRole('link', {
      name: 'Add User',
      exact: true,
    });

    await expect(addUserLink).toBeHidden();
  });

  test('it should display an add user link when in admin role', async ({
    userWithAdminRole,
  }) => {
    await userWithAdminRole.goto('/');

    const addUserLink = userWithAdminRole.getByRole('link', {
      name: 'Add User',
      exact: true,
    });

    await expect(addUserLink).toBeVisible();
  });

  test('it should have an add user link in admin role that links to register page', async ({
    userWithAdminRole,
  }) => {
    await userWithAdminRole.goto('/');

    const addUserLink = userWithAdminRole.getByRole('link', {
      name: 'Add User',
      exact: true,
    });

    await expect(addUserLink).toHaveAttribute('href', '/register');

    await addUserLink.click();

    await expect(userWithAdminRole).toHaveURL('/register');
  });
});
