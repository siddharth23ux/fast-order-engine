import { buildApp } from "../src/app";

describe("App bootstrap", () => {
  it("should build the Fastify app", async () => {
    const app = await buildApp();
    expect(app).toBeDefined();
  });

  it("should register order routes", async () => {
  const app = await buildApp();
  const routes = app.printRoutes();

  expect(routes).toContain("api/orders/");
  expect(routes).toMatch(/execute\s*\(POST\)/);
});
});
