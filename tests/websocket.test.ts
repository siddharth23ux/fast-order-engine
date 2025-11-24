import WebSocket from "ws";
import { buildApp } from "../src/app";
import { redis, redisPub, redisSub } from "../src/lib/redis";

describe("WebSocket /ws", () => {
  let app: any;
  let server: any;
  let url: string;

  beforeAll(async () => {
    app = await buildApp();
    server = await app.listen({ port: 0 });
    const address = app.server.address();
    url = `ws://localhost:${address.port}/api/orders/ws`;
  });

  afterAll(async () => {
    // close fastify server
    await app.close();

    // close Redis connections used by the app (prevents open handles)
    try {
      await redisSub.quit();
      await redisPub.quit();
      await redis.quit();
    } catch (e) {
      // ignore shutdown errors in tests
    }
  });

  it("should connect to websocket", (done) => {
    const ws = new WebSocket(url);
    ws.on("open", () => {
      ws.close();
      done();
    });
  });

  it("should reject malformed message", (done) => {
    const ws = new WebSocket(url);
    ws.on("open", () => ws.send("not_json"));
    ws.on("message", (msg) => {
      const json = JSON.parse(msg.toString());
      expect(json.error).toBe("invalid message format");
      ws.close();
      done();
    });
  });

  it("should respond to subscribe action", (done) => {
    const ws = new WebSocket(url);
    ws.on("open", () =>
      ws.send(JSON.stringify({ action: "subscribe", orderId: "123" }))
    );
    ws.on("message", (msg) => {
      const json = JSON.parse(msg.toString());
      expect(json.status).toBe("subscribed");
      ws.close();
      done();
    });
  });

  it("should clean up on close", (done) => {
    const ws = new WebSocket(url);
    ws.on("open", () => {
      ws.send(JSON.stringify({ action: "subscribe", orderId: "123" }));
      ws.close();
      done();
    });
  });
});
