import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';
import path from 'path';

export const AUTH_STORAGE_PATH = path.join(
  process.cwd(),
  'tests',
  'e2e',
  '.auth'
);

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
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'setups/**/*.setup.js',
      teardown: 'teardown',
    },
    {
      name: 'teardown',
      testMatch: 'teardowns/**/*.teardown.js',
    },
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    {
      name: 'safari',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run test:server',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
});
