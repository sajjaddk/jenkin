class CartPage {
  constructor(page) {
    this.page = page;
    this.items = page.getByTestId('inventory-item');
    this.names = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShopping = page.getByTestId('continue-shopping');
  }

  remove(slug) {
    return this.page.getByTestId(`remove-${slug}`).click();
  }
}

class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.finishButton = page.getByTestId('finish');
    this.error = page.getByTestId('error');
    this.subtotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.confirmation = page.getByTestId('complete-header');
  }

  async fillInfo({ firstName, lastName, postalCode } = {}) {
    if (firstName) await this.firstName.fill(firstName);
    if (lastName) await this.lastName.fill(lastName);
    if (postalCode) await this.postalCode.fill(postalCode);
    await this.continueButton.click();
  }

  /** Reads a "Label: $12.34" text and returns 12.34 */
  static amount(text) {
    return Number(text.replace(/[^0-9.]/g, ''));
  }
}

module.exports = { CartPage, CheckoutPage };
