describe("testing navbar functions", () => {
  const clickNoModal = (selector: string) => {
    cy.ensureNoModal();
    cy.get(selector).should("be.visible").click();
    cy.ensureNoModal();
  };

  beforeEach(() => {
    cy.intercept("GET", "**/products?limit=*").as("products");
    cy.visit("/");
    cy.dismissLandingModal();
    cy.ensureNoModal(); // inyecta el <style> al inicio
  });

  it("navigates to products from navbar", () => {
    clickNoModal('[data-test="main-products"]');
    cy.location("pathname").should("equal", "/products");
  });

  it("navigates home by clicking the logo", () => {
    cy.visit("/products");
    cy.dismissLandingModal();
    cy.ensureNoModal(); // reinyecta el <style> en esta page
    clickNoModal('[data-test="main-logo"]');
    cy.location("pathname").should("equal", "/");
  });

  it("opens a product details page from the grid", () => {
    clickNoModal('[data-test="main-products"]');
    cy.location("pathname").should("equal", "/products");
    cy.wait("@products");
    cy.get('[data-test="product-card"]').first().scrollIntoView();
    clickNoModal('[data-test="product-card"]:first');
    cy.location("pathname").should("match", /^\/product\/\d+$/);
  });

  it("login & logout works properly", () => {
    clickNoModal('[data-test="login-btn"]');
    cy.get('[data-test="login-container"]').should("be.visible");
    cy.get('[data-test="input-username"]').type("atuny0");
    cy.get('[data-test="input-password"]').type("9uQFF1Lh");
    cy.get('[data-test="input-submit"]').click();
    cy.get('[data-test="username-popup"]').should("be.visible").click();
    cy.get('[data-test="popup-content-list"]').should("be.visible");
    cy.get('[data-test="logout-btn"]').click();
    cy.get('[data-test="popup-content-list"]').should("not.exist");
    cy.get('[data-test="login-btn"]').should("be.visible");
  });
});
