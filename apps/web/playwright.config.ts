import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
import { localTestUrl } from './e2e/support/local-target';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  globalSetup: './e2e/support/preflight.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: './test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: localTestUrl(
      process.env.WEB_E2E_BASE_URL ?? 'http://localhost:3000',
    ),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    cwd: resolve(__dirname, '../..'),
    command: 'node apps/web/e2e/support/start-web.mjs',
    url: localTestUrl(process.env.WEB_E2E_BASE_URL ?? 'http://localhost:3000'),
    reuseExistingServer: process.env.WEB_E2E_REUSE_EXISTING_SERVER === '1',
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
