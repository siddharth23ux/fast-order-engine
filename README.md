# Fast Order Engine (Assignment Deliverable)

## Short explanation of choices

- **Order type:** Market order (chosen because the assignment focuses on routing and immediate execution; supporting limit/sniper can be added by adding a watcher/trigger system that enqueues when price conditions are met).
- **DEX implementation:** Mock DEX (Raydium/Meteora) for stable, reproducible testing and to avoid devnet flakiness. The code is structured so real SDKs can be swapped in.

## HTTP → WebSocket pattern

The app uses a POST `/api/orders/execute` endpoint that returns an `orderId` and enqueues the job. The client then opens a WebSocket to `/api/orders/ws` and sends `{"action":"subscribe","orderId":"<id>"}` to receive updates.  
**Reason:** Browsers and many HTTP clients can’t perform a POST and then programmatically upgrade the *same TCP* connection to WebSocket in a portable way. The POST + subscribe pattern matches industry practice and the assignment's spirit. If you require the same-connection upgrade (raw socket), a different client (non-browser) and server code path is needed — I can provide that separately.

## How to run

1. `docker-compose up -d` (starts Postgres + Redis)
2. `npm install`
3. `npx prisma migrate dev --name init`
4. `npm run dev` (server)
5. `npm run worker` (in separate terminal)

## Endpoints

- `POST /api/orders/execute` — payload: `{ type, side, tokenIn, tokenOut, amount, slippage? }`
- `GET  /api/orders/ws` — after connecting send `{"action":"subscribe","orderId":"..."}`

## Notes

- Worker publishes statuses to Redis channel `order:<orderId>`; the WS subscribes and forwards to the client.
