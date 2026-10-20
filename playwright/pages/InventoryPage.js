class InventoryPage {
  constructor(page) {
    this.page = page;
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.names = page.getByTestId('inventory-item-name');
    this.prices = page.getByTestId('inventory-item-price');
    this.sort = page.getByTestId('product-sort-container');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.menuButton = page.locator('#react-burger-menu-btn');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  addToCart(slug) {
    return this.page.getByTestId(`add-to-cart-${slug}`).click();
  }

  removeFromCart(slug) {
    return this.page.getByTestId(`remove-${slug}`).click();
  }

  openProduct(name) {
    return this.names.filter({ hasText: name }).click();
  }

  openCart() {
    return this.cartLink.click();
  }

  async sortBy(value) {
    await this.sort.selectOption(value);
  }

  async nameList() {
    return this.names.allTextContents();
  }

  async priceList() {
    return (await this.prices.allTextContents()).map((p) => Number(p.replace('$', '')));
  }

  async logout() {
    await this.menuButton.click();
    await this.page.getByTestId('logout-sidebar-link').click();
  }

  async resetAppState() {
    await this.menuButton.click();
    await this.page.getByTestId('reset-sidebar-link').click();
  }
}

module.exports = { InventoryPage };
