const { test, expect } = require('@playwright/test');
const { InventoryPage } = require('../pages/InventoryPage');
const { CartPage, CheckoutPage } = require('../pages/CartAndCheckoutPages');

const BACKPACK = 'sauce-labs-backpack';
const BIKE_LIGHT = 'sauce-labs-bike-light';
const CUSTOMER = { firstName: 'Sajjad', lastName: 'Tester', postalCode: '2630' };

test.describe('Cart and checkout', () => {
  let inventory;
  let cart;
  let checkout;

  test.beforeEach(async ({ page }) => {
    inventory = new InventoryPage(page);
    cart = new CartPage(page);
    checkout = new CheckoutPage(page);
    await inventory.goto();
    await inventory.resetAppState();
    await page.goto('/inventory.html');
  });

  test('the cart lists the chosen items', async ({ page }) => {
    await inventory.addToCart(BACKPACK);
    await inventory.addToCart(BIKE_LIGHT);
    await inventory.openCart();
    await expect(page).toHaveURL(/cart\.html/);
    await expect(cart.items).toHaveCount(2);
    await expect(cart.names).toHaveText(['Sauce Labs Backpack', 'Sauce Labs Bike Light']);
  });

  test('an item can be removed in the cart', async () => {
    await inventory.addToCart(BACKPACK);
    await inventory.addToCart(BIKE_LIGHT);
    await inventory.openCart();
    await cart.remove(BACKPACK);
    await expect(cart.items).toHaveCount(1);
    await expect(cart.names).toHaveText('Sauce Labs Bike Light');
  });

  test('Continue Shopping returns to the products and keeps the cart', async ({ page }) => {
    await inventory.addToCart(BACKPACK);
    await inventory.openCart();
    await cart.continueShopping.click();
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventory.cartBadge).toHaveText('1');
  });

  test('checkout requires first name, last name and postal code', async () => {
    await inventory.addToCart(BACKPACK);
    await inventory.openCart();
    await cart.checkoutButton.click();

    await checkout.fillInfo({});
    await expect(checkout.error).toContainText('First Name is required');
    await checkout.fillInfo({ firstName: CUSTOMER.firstName });
    await expect(checkout.error).toContainText('Last Name is required');
    await checkout.fillInfo({ lastName: CUSTOMER.lastName });
    await expect(checkout.error).toContainText('Postal Code is required');
  });

  test('cancelling checkout goes back to the cart', async ({ page }) => {
    await inventory.addToCart(BACKPACK);
    await inventory.openCart();
    await cart.checkoutButton.click();
    await checkout.cancelButton.click();
    await expect(page).toHaveURL(/cart\.html/);
    await expect(cart.items).toHaveCount(1);
  });

  test('the order overview shows the right totals (item total + tax = total)', async () => {
    await inventory.addToCart(BACKPACK); // $29.99
    await inventory.addToCart(BIKE_LIGHT); // $9.99
    await inventory.openCart();
    await cart.checkoutButton.click();
    await checkout.fillInfo(CUSTOMER);

    const subtotal = CheckoutPage.amount(await checkout.subtotal.innerText());
    const tax = CheckoutPage.amount(await checkout.tax.innerText());
    const total = CheckoutPage.amount(await checkout.total.innerText());

    expect(subtotal).toBeCloseTo(39.98, 2);
    expect(tax).toBeCloseTo(Math.round(subtotal * 0.08 * 100) / 100, 2); // 8% tax
    expect(total).toBeCloseTo(subtotal + tax, 2);
  });

  test('completes a purchase end to end and empties the cart', async ({ page }) => {
    await inventory.addToCart(BACKPACK);
    await inventory.openCart();
    await cart.checkoutButton.click();
    await checkout.fillInfo(CUSTOMER);
    await expect(page).toHaveURL(/checkout-step-two/);
    await expect(cart.names).toHaveText('Sauce Labs Backpack');

    await checkout.finishButton.click();
    await expect(page).toHaveURL(/checkout-complete/);
    await expect(checkout.confirmation).toHaveText('Thank you for your order!');

    await page.getByTestId('back-to-products').click();
    await expect(inventory.cartBadge).toBeHidden();
  });

  test('checkout with an empty cart still opens (known behaviour of this demo site)', async ({ page }) => {
    await inventory.openCart();
    await expect(cart.items).toHaveCount(0);
    await cart.checkoutButton.click();
    await expect(page).toHaveURL(/checkout-step-one/);
  });
});
