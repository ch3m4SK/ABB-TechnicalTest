describe("testing the single product page", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/products/47").as("product");
    cy.intercept("GET", "**/products/category/**").as("related");

    cy.visit("/product/47");
    cy.dismissLandingModal();
    cy.ensureNoModal();

    cy.wait("@product").its("response.statusCode").should("eq", 200);
  });

  it("add to wishlist works perfectly", () => {
    // Login
    cy.get('[data-test="login-btn"]').click();
    cy.get('[data-test="input-username"]').type("atuny0");
    cy.get('[data-test="input-password"]').type("9uQFF1Lh");
    cy.get('[data-test="input-submit"]').click();

    cy.wait("@related");

    // Localizador robusto del botón de wishlist (por data-test / aria-label / title)
    const getWishlistBtn = () =>
      cy.get("body").then(($body) => {
        let $btn = $body.find('[data-test="wishlist-btn"], [data-test="add-wishlist-btn"]');
        if ($btn.length) return cy.wrap($btn.first());

        $btn = $body
          .find('button,[role="button"]')
          .filter((_, el) => {
            const attrs = [
              el.getAttribute("data-test") || "",
              el.getAttribute("aria-label") || "",
              el.getAttribute("title") || "",
            ].join(" ");
            return /wish/i.test(attrs);
          });

        expect($btn.length, "wishlist button should exist").to.be.greaterThan(0);
        return cy.wrap($btn.first());
      });

    // Click y validación mediante toast
    getWishlistBtn().should("be.visible").click({ force: true });

    // El UI muestra un toast “item added to your wishlist”
    cy.contains(/item added to your wishlist/i, { timeout: 4000 }).should("be.visible");

    // (opcional) el toast debería desaparecer solo; comprobamos que se oculta
    cy.contains(/item added to your wishlist/i).should("not.exist");
  });
});
