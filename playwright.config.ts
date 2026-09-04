import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:11010',
    trace: 'on-first-retry',
  },
  projects: [
    // Gera storageState de user/admin (1 login por usuário por execução)
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    // Suíte E2E principal — roda depois do setup
    {
      name: 'e2e',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:11010',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});