import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.HOME4U_WEB_PORT ?? 5173);
const BASE_URL = `http://localhost:${PORT}`;

/**
 * 스모크 e2e 설정.
 * Vite dev 서버는 webServer 옵션으로 자동 기동.
 * 백엔드(Spring Boot, dev 프로파일)는 별도로 띄워야 한다 — `npm run` 으로는 다루기 까다로워서
 * 로컬은 `./gradlew bootRun` 을 수동, CI 는 워크플로우 step 에서 백그라운드 기동한다.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
