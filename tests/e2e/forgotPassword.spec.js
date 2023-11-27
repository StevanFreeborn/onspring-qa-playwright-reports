import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { saveAccessibilityResultsToReport } from './utils.js';

test.describe('Forgot Password', () => {
  test('it should pass all accessibility checks', async ({
    page,
  }, testInfo) => {
    await page.goto('/forgot-password');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('.send-button')
      .analyze();

    await saveAccessibilityResultsToReport(testInfo, accessibilityScanResults);

    expect(accessibilityScanResults.violations.length).toBe(0);
  });

  test('it should contain a heading that has expected text', async ({
    page,
  }) => {
    await page.goto('/forgot-password');

    const heading = page.getByText('Forgot Password');

    await expect(heading).toBeVisible();
  });

  test('it should contain forgot password form', async ({ page }) => {
    await page.goto('/forgot-password');

    const emailField = page.getByLabel('Email');
    const csrfField = page.locator('input[name="_csrf"]');
    const sendButton = page.getByText('Send Email');

    await expect(emailField).toBeVisible();
    await expect(csrfField).toBeHidden();
    await expect(sendButton).toBeVisible();
  });

  test('it should make email field required', async ({ page }) => {
    await page.goto('/forgot-password');

    const emailField = page.getByLabel('Email');

    await expect(emailField).toHaveAttribute('required');
  });

  test('it should redirect to forgot password page and display success message when non-existent email is entered', async ({
    page,
  }) => {
    await page.goto('/forgot-password');

    const emailField = page.getByLabel('Email');
    const sendButton = page.getByText('Send Email');
    const successMessage = page.locator('.success');

    await emailField.fill('fake.email@test.com');
    await sendButton.click();

    await page.waitForURL('/forgot-password?success=true');

    await expect(successMessage).toBeVisible();
  });
});
