import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../lib/prisma';
import { orderQueue } from '../../lib/queue';
import { CreateOrderSchema, CreateOrderInput } from './order.schema';
import { v4 as uuidv4 } from 'uuid';

export const createOrder = async (
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) => {
  // validate request body
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'invalid_payload', details: parsed.error.format() });
  }
  const input: CreateOrderInput = parsed.data;
  // create DB order
  const order = await prisma.order.create({
    data: {
      id: uuidv4(),
      type: input.type,
      side: input.side,
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      amount: input.amount,
      slippage: input.slippage ?? 1.0,  // Default 1% tolerance
      status: 'pending'
    }
  });
  // add to queue with retry/backoff
  await orderQueue.add('execute-order', {
    orderId: order.id,
    type: order.type,
    side: order.side,
    tokenIn: order.tokenIn,
    tokenOut: order.tokenOut,
    amount: order.amount,
    slippage: order.slippage  // Now matches DB
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false
  });
  // Respond with orderId; client should then upgrade to WS (same TCP if possible)
  return reply.code(201).send({
    orderId: order.id,
    status: 'pending',
    message: 'Order queued for execution'
  });
};