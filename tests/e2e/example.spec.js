// @ts-check
import { expect, test } from '@playwright/test';

test('should redirect to login page', async ({ page }) => {
  await page.goto('/');

  expect(page.url()).toContain('/login');
});
