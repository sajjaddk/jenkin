const login = require('../support/pages/LoginPage');

describe('Login', () => {
  beforeEach(() => {
    login.visit();
  });

  it('logs in with valid credentials', () => {
    login.login('standard_user', 'secret_sauce');
    cy.url().should('include', '/inventory.html');
    cy.get('[data-test="title"]').should('have.text', 'Products');
  });

  it('shows an error for a wrong password', () => {
    login.login('standard_user', 'wrong');
    login.error().should('contain', 'Username and password do not match');
    cy.url().should('not.include', '/inventory');
  });

  it('shows an error for a locked-out user', () => {
    login.login('locked_out_user', 'secret_sauce');
    login.error().should('contain', 'locked out');
  });

  it('requires a username', () => {
    login.login('', 'secret_sauce');
    login.error().should('contain', 'Username is required');
  });

  it('requires a password', () => {
    login.login('standard_user', '');
    login.error().should('contain', 'Password is required');
  });

  it('cannot open the inventory without logging in', () => {
    cy.visit('/inventory.html', { failOnStatusCode: false });
    cy.url().should('not.include', '/inventory.html');
    login.error().should('contain', "You can only access '/inventory.html' when you are logged in");
  });

  it('logs out', () => {
    const inventory = require('../support/pages/InventoryPage');
    login.login('standard_user', 'secret_sauce');
    inventory.logout();
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
  });
});
