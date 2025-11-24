import fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { orderRoutes } from './modules/orders/order.routes';

export const buildApp = async () => {
  const app = fastify({ logger: false });

  await app.register(cors);
  await app.register(websocket);

  // Register routes
  await app.register(orderRoutes, { prefix: '/api/orders' });

  return app;
};
