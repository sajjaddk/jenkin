const { defineConfig } = require('cypress');
const { allureCypress } = require('allure-cypress/reporter');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://www.saucedemo.com',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshotsFolder: 'reports/ui/screenshots',
    // Public sites can be slow or briefly flaky: allow a retry in CI only.
    retries: { runMode: 2, openMode: 0 },
    defaultCommandTimeout: 8000,
    setupNodeEvents(on, config) {
      // Allure results for the UI tests (same folder as the API results).
      allureCypress(on, config, { resultsDir: 'reports/allure-results' });
      return config;
    },
  },
  // JUnit XML so Jenkins can also show per-test results and trends.
  reporter: 'mocha-junit-reporter',
  reporterOptions: {
    mochaFile: 'reports/ui/cypress-junit-[hash].xml',
    toConsole: true,
  },
});
