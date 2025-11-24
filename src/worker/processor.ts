// src/worker/processor.ts
import { Job } from "bullmq";
import prisma from "../lib/prisma";
import { redisPub } from "../lib/redis";
import { ORDER_QUEUE_NAME } from "../lib/queue";
import { MockDexRouter, Quote } from "./dex.mock";  // Import updated Quote
import { Worker, QueueEvents } from "bullmq";
import { log } from "../lib/logger";  // For routing logs

export type DexQuote = Quote;  // Alias for clarity

export function scoreForSide(side: "BUY" | "SELL", quote: DexQuote) {
  // Composite score: price (inverted for BUY), adjusted for fee & liquidity
  // BUY: lower effective price / higher liq better → negative score
  // SELL: higher effective price * liq better → positive score
  const effectivePrice = quote.price * (1 + (side === 'BUY' ? quote.fee : -quote.fee));
  const liquidityFactor = quote.liquidity / 1e9;  // Normalize to 0-2 range
  return side === "BUY" 
    ? - (effectivePrice / liquidityFactor)  // Lower = better (more negative)
    : effectivePrice * liquidityFactor;    // Higher = better
}

// Dependency-injected processor factory
export function createProcessor(router: any) {
  return async function processOrder(job: Job) {
    const orderId = job.data.orderId;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    // 1. pending
    await publishStatus(orderId, "pending");
    // 2. routing
    await publishStatus(orderId, "routing");
    const symbol = `${order.tokenIn}-${order.tokenOut}`;
    const quotes = await router.getQuotes(symbol, order.amount);
    // Log routing decisions
    log('DEX Quotes for', symbol, ':', quotes);
    const best = quotes.reduce((a: DexQuote, b: DexQuote) =>
      scoreForSide(order.side as "BUY" | "SELL", a) > scoreForSide(order.side as "BUY" | "SELL", b) ? a : b
    );
    log('Routed to', best.venue, 'at price', best.price, 'with liquidity', best.liquidity.toLocaleString());
    // 3. building
    await publishStatus(orderId, "building");
    // Fixed: Positional args for executeSwap
    const exec = await router.executeSwap(best.venue, order.amount, best.price);
    // Slippage check: Now slippage is % (e.g., 1.0 = 1%), so frac = slippage / 100
    const slippageFrac = order.slippage / 100;
    const maxPrice = best.price * (1 + slippageFrac);
    const minPrice = best.price * (1 - slippageFrac);
    if (exec.executedPrice < minPrice || exec.executedPrice > maxPrice) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "failed", failReason: "Slippage exceeded", attempts: { increment: 1 } }
      });
      await publishStatus(orderId, "failed", { error: "Slippage exceeded" });
      throw new Error("Slippage exceeded");
    }
    // 4. submitted
    await publishStatus(orderId, "submitted", { txHash: exec.txHash });
    // Simulate confirm
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "confirmed",
        txHash: exec.txHash,
        venue: best.venue,
        executedPrice: exec.executedPrice,
        attempts: { increment: 1 }
      }
    });
    // 5. confirmed
    await publishStatus(orderId, "confirmed", {
      txHash: exec.txHash,
      executedPrice: exec.executedPrice
    });
    return true;
  };
}

// Production router
const prodRouter = new MockDexRouter();
export const processOrder = createProcessor(prodRouter);

// Worker wiring
export const worker = new Worker(
  ORDER_QUEUE_NAME,
  async job => processOrder(job),
  { concurrency: 10 }
);
export const events = new QueueEvents(ORDER_QUEUE_NAME);

/**
 * Publish status to the Redis channel for this specific order
 */
async function publishStatus(orderId: string, stage: string, extra: any = {}) {
  // 🔥 Updated: publish to per-order channel
  await redisPub.publish(
    `order:${orderId}`, // per-order channel
    JSON.stringify({ orderId, stage, ...extra })
  );
}