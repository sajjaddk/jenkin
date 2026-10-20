const { defineConfig, devices } = require('@playwright/test');

const CI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './playwright',
  outputDir: 'reports/playwright/artifacts',
  forbidOnly: CI,
  // Public sites can be slow or briefly flaky: retry in CI only.
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [
    ['list'],
    ['junit', { outputFile: 'reports/playwright/junit.xml' }],
    ['html', { outputFolder: 'reports/playwright/html', open: 'never' }],
    ['allure-playwright', { resultsDir: 'reports/allure-results', suiteTitle: false }],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    testIdAttribute: 'data-test', // SauceDemo marks elements with data-test
  },
  projects: [
    // API tests: no browser, only HTTP requests.
    {
      name: 'api',
      testDir: './playwright/api',
      use: { baseURL: 'https://restful-booker.herokuapp.com', extraHTTPHeaders: { Accept: 'application/json' } },
    },
    // Logs in once and saves the session for the UI tests.
    {
      name: 'setup',
      testDir: './playwright/setup',
      testMatch: /auth\.setup\.js/,
      use: { ...devices['Desktop Chrome'], baseURL: 'https://www.saucedemo.com' },
    },
    // UI end-to-end tests (Chromium). Add Firefox/WebKit projects here for cross-browser runs.
    {
      name: 'e2e',
      testDir: './playwright/e2e',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        storageState: 'playwright/.auth/standard-user.json',
      },
    },
  ],
});
