class InventoryPage {
  items() {
    return cy.get('[data-test="inventory-item"]');
  }

  prices() {
    return cy.get('[data-test="inventory-item-price"]');
  }

  addToCart(slug) {
    cy.get(`[data-test="add-to-cart-${slug}"]`).click();
    return this;
  }

  removeFromCart(slug) {
    cy.get(`[data-test="remove-${slug}"]`).click();
    return this;
  }

  cartBadge() {
    return cy.get('[data-test="shopping-cart-badge"]');
  }

  sortBy(value) {
    cy.get('[data-test="product-sort-container"]').select(value);
    return this;
  }

  openCart() {
    cy.get('[data-test="shopping-cart-link"]').click();
    return this;
  }

  logout() {
    cy.get('#react-burger-menu-btn').click();
    cy.get('[data-test="logout-sidebar-link"]').click();
    return this;
  }
}

module.exports = new InventoryPage();
