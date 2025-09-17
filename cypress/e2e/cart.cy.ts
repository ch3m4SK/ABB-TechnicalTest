describe('testing the cart functionalities', () => {
  const OVERLAY_SEL = [
    '[role="dialog"]',
    '.modal',
    '.ReactModal__Overlay',
    '.swal2-container',
    '.ant-modal-root',
    '.modal-backdrop, .MuiBackdrop-root, .ant-drawer-mask',
    'div[class*="fixed"][class*="inset-0"][class*="bg-opacity"]',
  ].join(',');

  beforeEach(() => {
    cy.visit('/');

    cy.ensureNoModal();
    cy.get('body', { timeout: 8000 }).should(($b) => {
      expect($b.find(OVERLAY_SEL).length, 'overlay count').to.eq(0);
    });

    cy.get('[data-test="login-btn"]', { timeout: 8000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('[data-test="login-container"]').should('be.visible');
    cy.get('[data-test="input-username"]').type('atuny0');
    cy.get('[data-test="input-password"]').type('9uQFF1Lh');
    cy.get('[data-test="input-submit"]').click();

    cy.get('[data-test="username-popup"]', { timeout: 8000 }).should('be.visible');
  });

  it('checkout and order confirm works', () => {
    cy.ensureNoModal();

    cy.get('[data-test="add-cart-btn"]').first().click();
    cy.get('[data-test="cart-btn"]').click();

    cy.get('[data-test="cart-increase-btn"]').click();
    cy.get('[data-test="cart-item-quantity"]').should('have.text', '2');

    cy.get('[data-test="cart-reduce-btn"]').click();
    cy.get('[data-test="cart-item-quantity"]').should('have.text', '1');

    cy.get('[data-test="checkout-btn"]').click();
    cy.contains(/Welcome to the checkout section\./i).should('be.visible');

    cy.get('[data-test="confirm-order-btn"]').click();
    cy.contains(/Welcome to the checkout section\./i).should('not.exist');
    cy.get('[data-test="cart-item-count"]').should('have.text', '0');
  });
});
