const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://www.saucedemo.com',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: false,
    video: false,
    screenshotsFolder: 'reports/ui/screenshots',
    // Public sites can be slow or briefly flaky: allow a retry in CI only.
    retries: { runMode: 2, openMode: 0 },
    defaultCommandTimeout: 8000,
  },
  // JUnit XML so Jenkins can show per-test results and trends.
  reporter: 'mocha-junit-reporter',
  reporterOptions: {
    mochaFile: 'reports/ui/cypress-junit-[hash].xml',
    toConsole: true,
  },
});
