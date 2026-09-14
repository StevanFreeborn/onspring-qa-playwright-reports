import { test as teardown } from '@playwright/test';
import fs from 'fs';
import { AUTH_STORAGE_PATH } from '../../../playwright.config.js';

// eslint-disable-next-line playwright/expect-expect
teardown('remove saved auth states', async () => {
  fs.rmSync(AUTH_STORAGE_PATH, { recursive: true, force: true });
});
