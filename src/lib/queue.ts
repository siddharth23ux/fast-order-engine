import { Queue } from 'bullmq';
import { redisConfig } from './redis';

export const ORDER_QUEUE_NAME = 'orders';
export const orderQueue = new Queue(ORDER_QUEUE_NAME, {
  connection: redisConfig
});
