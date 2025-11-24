import { FastifyInstance } from 'fastify';
import { createOrder } from './order.controller';
import orderWsHandler from './order.ws';

export async function orderRoutes(app: FastifyInstance) {
  // POST /api/orders/execute
  app.post('/execute', createOrder);

  // WebSocket /api/orders/ws
  app.get('/ws', { websocket: true }, (connection, req) => {
    orderWsHandler(connection, req);
  });
}
