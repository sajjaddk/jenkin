const allure = require('allure-cypress');
const login = require('../support/pages/LoginPage');
const inventory = require('../support/pages/InventoryPage');
const checkout = require('../support/pages/CheckoutPage');

const BACKPACK = 'sauce-labs-backpack';
const BIKE_LIGHT = 'sauce-labs-bike-light';

describe('Shopping', () => {
  beforeEach(() => {
    allure.epic('SauceDemo UI');
    allure.feature('Shopping');
    login.visit().login('standard_user', 'secret_sauce');
  });

  it('shows six products', () => {
    inventory.items().should('have.length', 6);
  });

  it('updates the cart badge when adding and removing items', () => {
    inventory.addToCart(BACKPACK);
    inventory.cartBadge().should('have.text', '1');
    inventory.addToCart(BIKE_LIGHT);
    inventory.cartBadge().should('have.text', '2');
    inventory.removeFromCart(BACKPACK);
    inventory.cartBadge().should('have.text', '1');
    inventory.removeFromCart(BIKE_LIGHT);
    inventory.cartBadge().should('not.exist');
  });

  it('sorts products by price, low to high', () => {
    inventory.sortBy('lohi');
    inventory.prices().then(($els) => {
      const prices = [...$els].map((el) => Number(el.textContent.replace('$', '')));
      expect(prices).to.deep.equal([...prices].sort((a, b) => a - b));
    });
  });

  it('sorts products by name, Z to A', () => {
    inventory.sortBy('za');
    cy.get('[data-test="inventory-item-name"]').then(($els) => {
      const names = [...$els].map((el) => el.textContent);
      expect(names).to.deep.equal([...names].sort().reverse());
    });
  });

  it('keeps the chosen item in the cart', () => {
    inventory.addToCart(BACKPACK).openCart();
    cy.get('[data-test="inventory-item-name"]').should('have.text', 'Sauce Labs Backpack');
  });

  it('completes a purchase end to end', () => {
    allure.severity('blocker');
    allure.step('Add the backpack to the cart', () => {
      inventory.addToCart(BACKPACK).openCart();
    });
    allure.step('Enter checkout information', () => {
      checkout.start().fillInfo({ firstName: 'Sajjad', lastName: 'Tester', postalCode: '2630' });
      cy.get('[data-test="inventory-item-name"]').should('have.text', 'Sauce Labs Backpack');
    });
    allure.step('Finish the order and check the confirmation', () => {
      checkout.finish();
      checkout.confirmation().should('have.text', 'Thank you for your order!');
    });
  });

  it('requires checkout information', () => {
    inventory.addToCart(BACKPACK).openCart();
    checkout.start().fillInfo({});
    checkout.error().should('contain', 'First Name is required');
    checkout.fillInfo({ firstName: 'Sajjad' });
    checkout.error().should('contain', 'Last Name is required');
  });
});
