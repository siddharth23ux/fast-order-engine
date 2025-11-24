import { orderQueue, ORDER_QUEUE_NAME } from "../src/lib/queue";

describe("Queue behaviour", () => {
  it("queue should exist", () => {
       expect(orderQueue.name).toBe(ORDER_QUEUE_NAME);
  });

  it("should enqueue new order job", async () => {
    const job = await orderQueue.add("execute-order", { orderId: "abc123" });
    expect(job.id).toBeDefined();
  });

  it("job options should include retries + backoff", async () => {
    const job = await orderQueue.add("execute-order", { orderId: "xyz" }, { 
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 } 
    });

    expect(job.opts.attempts).toBe(3);
    expect(job.opts.backoff).toBeDefined();
  });
});
