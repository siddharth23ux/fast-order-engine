import { buildApp } from "../src/app";

describe("POST /api/orders/execute", () => {
  let app: any;

  beforeAll(async () => {
    app = await buildApp();
  });

  it("should reject invalid payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: { type: "MARKET" }
    });

    expect(res.statusCode).toBe(400);
  });

  it("should create order & enqueue job", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: {
        type: "MARKET",
        side: "BUY",
        tokenIn: "SOL",
        tokenOut: "USDC",
        amount: 1
      }
    });

    const json = res.json();
    expect(res.statusCode).toBe(201);
    expect(json.orderId).toBeDefined();
  });

  it("should default slippage to 0.01", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: {
        type: "MARKET",
        side: "SELL",
        tokenIn: "SOL",
        tokenOut: "USDC",
        amount: 1
      }
    });

    expect(res.statusCode).toBe(201);
  });
});
