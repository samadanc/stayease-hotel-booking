import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for StayEase E2E tests. The webServer block boots the app
 * before tests run so the suite is self-contained. The same browser automation
 * is available interactively through the Playwright MCP server configured in
 * ~/.kiro/settings/mcp.json (see docs/MCP.md).
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'PORT=3100 npm run serve',
    url: 'http://localhost:3100/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
