describe("testing the products page", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/products?limit=*").as("products");
    cy.visit("/products");
    cy.dismissLandingModal();
    cy.ensureNoModal();
    cy.wait("@products").its("response.statusCode").should("eq", 200);
  });

  // Lee una “firma” del card: id de /product/:id o, si no hay, un título
  const readTopKeys = (take = 10) =>
    cy.get('[data-test="product-card"]', { timeout: 8000 }).then(($cards) => {
      expect($cards.length, "should render product cards").to.be.greaterThan(0);

      const arr = Cypress._.take($cards.toArray(), take).map((el) => {
        const $c = Cypress.$(el);

        // 1) intenta extraer el id del href /product/:id
        const href =
          $c.find('a[href^="/product/"]').attr("href") ||
          $c.find('a[href*="/product/"]').attr("href") ||
          "";
        const m = href.match(/\/product\/(\d+)/);
        if (m) return `id:${m[1]}`;

        // 2) fallback a un posible título
        const title =
          $c.find('[data-test="product-title"]').first().text().trim() ||
          $c.find("h3, h2, .product-title, .font-lato").first().text().trim() ||
          ($c.text() || "").split("\n").map((t) => t.trim()).find(Boolean) ||
          "";
        return `t:${title}`;
      });

      return arr;
    });

  it("products are sorted", () => {
    let before: string[] = [];

    // snapshot inicial
    readTopKeys(10).then((arr) => {
      before = arr;
    });

    // cambia a la 2ª opción del select de orden (sin depender del texto)
    cy.get("select").first().find("option").then(($opts) => {
      expect($opts.length, "sort options count").to.be.greaterThan(1);
      const secondVal = ($opts.eq(1).val() as string) ?? "";
      cy.get("select").first().select(secondVal);
    });

    // pequeño margen para el re-render si el sort es en cliente
    cy.wait(150);

    // snapshot tras ordenar y comparación
    readTopKeys(10).then((after) => {
      expect(after, "order after sorting should differ").to.not.deep.equal(before);
    });
  });
});
