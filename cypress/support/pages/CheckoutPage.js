class CheckoutPage {
  start() {
    cy.get('[data-test="checkout"]').click();
    return this;
  }

  fillInfo({ firstName, lastName, postalCode }) {
    if (firstName) cy.get('[data-test="firstName"]').type(firstName);
    if (lastName) cy.get('[data-test="lastName"]').type(lastName);
    if (postalCode) cy.get('[data-test="postalCode"]').type(postalCode);
    cy.get('[data-test="continue"]').click();
    return this;
  }

  finish() {
    cy.get('[data-test="finish"]').click();
    return this;
  }

  error() {
    return cy.get('[data-test="error"]');
  }

  confirmation() {
    return cy.get('[data-test="complete-header"]');
  }
}

module.exports = new CheckoutPage();
