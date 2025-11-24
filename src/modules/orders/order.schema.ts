import { z } from 'zod';

export const CreateOrderSchema = z.object({
  type: z.enum(['MARKET', 'LIMIT', 'SNIPER']).default('MARKET'),
  side: z.enum(['BUY', 'SELL']),
  tokenIn: z.string(),
  tokenOut: z.string(),
  amount: z.number().positive(),
  // slippage: % tolerance (e.g., 1.0 for 1%)
  slippage: z.number().min(0).max(50).optional()
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;