describe("testing the home page", () => {
  type Product = { title: string };
  type ProductsResponse = {
    products: Product[];
    total?: number;
    skip?: number;
    limit?: number;
  };

  beforeEach(() => {
    cy.intercept("GET", "**/products?limit=*").as("products");
    cy.visit("/");
    cy.dismissLandingModal();
  });

  it("the hero section loads", () => {
    cy.get('[data-test="hero-btn"]').should("contain.text", "Shop Now");
  });

  it("the feature section loads", () => {
    cy.contains(/Contact us 24 hours a day/i).should("be.visible");
  });

  it("the products titles load", () => {
    cy.contains(/trending products/i).should("be.visible");
    cy.contains(/new arrivals/i).should("be.visible");
  });

  it("the banner section loads", () => {
    cy.get('[data-test="banner-btn"]').should("contain.text", "Shop Now");
  });

  it("products endpoint is working properly", () => {
    cy.request("GET", "https://dummyjson.com/products?limit=24&skip=24").should(
      (response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("skip", 24);
        expect(response.body.products).to.have.length(24);
      }
    );
  });

  it("products are fetched properly", () => {
    cy.wait("@products").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);

      const body = response?.body as ProductsResponse | undefined;
      const products = body?.products ?? [];
      expect(products.length).to.be.greaterThan(0);

      const escapeForRegex = (s: string) =>
        s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const titles: string[] = products
        .map((p: Product) => p.title)
        .filter(Boolean)
        .slice(0, 3);

      titles.forEach((t) => {
        cy.contains(new RegExp(escapeForRegex(t), "i")).should("be.visible");
      });

      cy.get('[data-test="product-card"]').should("have.length.greaterThan", 0);
    });
  });
});
