const { test: setup, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

const authFile = 'playwright/.auth/standard-user.json';

// Log in once through the UI and save the session, so the UI tests start already logged in.
setup('log in as standard_user and save the session', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('standard_user', 'secret_sauce');
  await expect(page).toHaveURL(/inventory\.html/);
  await page.context().storageState({ path: authFile });
});
