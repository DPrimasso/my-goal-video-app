import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_LINEUP_IMAGE_URL: 'https://e2e.invalid/lineup',
      VITE_GOAL_IMAGE_URL: 'https://e2e.invalid/goal',
      VITE_FINAL_RESULT_IMAGE_URL: 'https://e2e.invalid/final-result',
    },
  },
  projects: [
    { name: 'mobile-390x844', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'desktop-1440x900', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
  ],
});
