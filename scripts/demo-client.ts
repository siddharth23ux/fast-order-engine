// scripts/demo-client.ts
import WebSocket from "ws";

async function runDemo() {
  const WS_URL = "ws://localhost:3000/api/orders/ws";
  const API_URL = "http://localhost:3000/api/orders/execute";
  const ws = new WebSocket(WS_URL);
  ws.on("open", () => console.log("WS connected"));
  ws.on("message", msg => console.log("WS >", msg.toString()));
  const orders = [
    { amount: 1, side: "BUY", slippage: 1 },
    { amount: 2, side: "SELL", slippage: 2 }
  ];
  for (const o of orders) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "MARKET",
        side: o.side,
        tokenIn: "SOL",
        tokenOut: "USDC",
        amount: o.amount,
        slippage: o.slippage
      })
    });
    const data = await res.json();
    console.log("Created order:", data);
    ws.send(
      JSON.stringify({
        action: "subscribe",
        orderId: data.orderId
      })
    );
  }
}

runDemo();