const { test, expect } = require('@playwright/test');
const { InventoryPage } = require('../pages/InventoryPage');

const BACKPACK = 'sauce-labs-backpack';
const BIKE_LIGHT = 'sauce-labs-bike-light';

test.describe('Inventory', () => {
  let inventory;

  test.beforeEach(async ({ page }) => {
    inventory = new InventoryPage(page);
    await inventory.goto();
    await inventory.resetAppState(); // start every test from an empty cart
    await page.goto('/inventory.html');
  });

  test('is already logged in thanks to the saved session', async ({ page }) => {
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventory.title).toHaveText('Products');
  });

  test('shows six products, each with name, price and button', async () => {
    await expect(inventory.items).toHaveCount(6);
    for (const item of await inventory.items.all()) {
      await expect(item.getByTestId('inventory-item-name')).not.toBeEmpty();
      await expect(item.getByTestId('inventory-item-price')).toContainText('$');
      await expect(item.getByRole('button', { name: /Add to cart|Remove/ })).toBeVisible();
    }
  });

  test('sorts by name A to Z and Z to A', async () => {
    await inventory.sortBy('az');
    const asc = await inventory.nameList();
    expect(asc).toEqual([...asc].sort());
    await inventory.sortBy('za');
    const desc = await inventory.nameList();
    expect(desc).toEqual([...asc].reverse());
  });

  test('sorts by price low to high and high to low', async () => {
    await inventory.sortBy('lohi');
    const low = await inventory.priceList();
    expect(low).toEqual([...low].sort((a, b) => a - b));
    await inventory.sortBy('hilo');
    const high = await inventory.priceList();
    expect(high).toEqual([...low].reverse());
  });

  test('cart badge follows adding and removing items', async () => {
    await expect(inventory.cartBadge).toBeHidden();
    await inventory.addToCart(BACKPACK);
    await expect(inventory.cartBadge).toHaveText('1');
    await inventory.addToCart(BIKE_LIGHT);
    await expect(inventory.cartBadge).toHaveText('2');
    await inventory.removeFromCart(BACKPACK);
    await expect(inventory.cartBadge).toHaveText('1');
    await inventory.removeFromCart(BIKE_LIGHT);
    await expect(inventory.cartBadge).toBeHidden();
  });

  test('the button changes between Add and Remove', async ({ page }) => {
    await inventory.addToCart(BACKPACK);
    await expect(page.getByTestId(`remove-${BACKPACK}`)).toHaveText('Remove');
    await expect(page.getByTestId(`add-to-cart-${BACKPACK}`)).toHaveCount(0);
  });

  test('opens a product page with its details and goes back', async ({ page }) => {
    await inventory.openProduct('Sauce Labs Backpack');
    await expect(page).toHaveURL(/inventory-item\.html\?id=4/);
    await expect(page.getByTestId('inventory-item-name')).toHaveText('Sauce Labs Backpack');
    await expect(page.getByTestId('inventory-item-price')).toHaveText('$29.99');
    await page.getByTestId('back-to-products').click();
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('the cart survives a page reload', async ({ page }) => {
    await inventory.addToCart(BACKPACK);
    await page.reload();
    await expect(inventory.cartBadge).toHaveText('1');
  });

  test('Reset App State empties the cart', async ({ page }) => {
    await inventory.addToCart(BACKPACK);
    await expect(inventory.cartBadge).toHaveText('1');
    await inventory.resetAppState();
    await page.reload();
    await expect(inventory.cartBadge).toBeHidden();
  });
});
