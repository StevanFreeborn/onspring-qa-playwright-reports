import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

// TODO: I want to have global setups that login
// the following users and provide them as fixtures
// + admin user
// + user with user role
// + user with no roles

// TODO: I want to have global teardown that
// deletes all the persisted user login states

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'safari',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run test:server',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
});
