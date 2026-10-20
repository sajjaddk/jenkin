const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');

// These tests need a logged-out browser, so they ignore the saved session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  let login;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.goto();
  });

  test('logs in with valid credentials', async ({ page }) => {
    await login.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(new InventoryPage(page).title).toHaveText('Products');
  });

  const failures = [
    ['wrong password', 'standard_user', 'wrong', 'Username and password do not match'],
    ['unknown user', 'nobody', 'secret_sauce', 'Username and password do not match'],
    ['locked-out user', 'locked_out_user', 'secret_sauce', 'this user has been locked out'],
    ['missing username', '', 'secret_sauce', 'Username is required'],
    ['missing password', 'standard_user', '', 'Password is required'],
  ];
  for (const [name, user, pass, message] of failures) {
    test(`shows an error for ${name}`, async ({ page }) => {
      await login.login(user, pass);
      await expect(login.error).toContainText(message);
      await expect(page).not.toHaveURL(/inventory/);
    });
  }

  test('the error can be dismissed', async () => {
    await login.login('standard_user', 'wrong');
    await expect(login.error).toBeVisible();
    await login.page.getByTestId('error-button').click();
    await expect(login.error).toBeHidden();
  });

  test('the inventory page is protected when logged out', async ({ page }) => {
    await page.goto('/inventory.html');
    await expect(page).not.toHaveURL(/inventory\.html/);
    await expect(login.error).toContainText('You can only access');
  });

  test('logging out returns to the login page and ends the session', async ({ page }) => {
    await login.login('standard_user', 'secret_sauce');
    const inventory = new InventoryPage(page);
    await inventory.logout();
    await expect(login.loginButton).toBeVisible();
    await page.goto('/inventory.html');
    await expect(page).not.toHaveURL(/inventory\.html/);
  });
});
