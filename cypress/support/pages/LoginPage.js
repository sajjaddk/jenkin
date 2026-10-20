class LoginPage {
  visit() {
    cy.visit('/');
    return this;
  }

  login(username, password) {
    if (username) cy.get('[data-test="username"]').type(username);
    if (password) cy.get('[data-test="password"]').type(password, { log: false });
    cy.get('[data-test="login-button"]').click();
    return this;
  }

  error() {
    return cy.get('[data-test="error"]');
  }
}

module.exports = new LoginPage();
