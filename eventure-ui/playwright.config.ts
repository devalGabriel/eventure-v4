import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000/ro',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ro-RO'
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/ro',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NEXT_PUBLIC_AUTH_URL: 'http://localhost:3000/api/mock-auth',
      NEXT_PUBLIC_USERS_URL:'http://localhost:3000/api/mock-users',
      NEXT_PUBLIC_PROVIDER_URL:'http://localhost:3000/api/mock-provider',
      NEXT_PUBLIC_EVENTS_URL:'http://localhost:3000/api/mock-events',
      NEXT_PUBLIC_FILES_URL:'http://localhost:3000/api/mock-files',
      NEXT_PUBLIC_FLAG_UPLOAD_PRESIGNED:'0'
    }
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
