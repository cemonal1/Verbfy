import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3002',
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
});