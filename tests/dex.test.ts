// tests/dex.test.ts (new file)
import { MockDexRouter } from '../src/worker/dex.mock';
import { scoreForSide } from '../src/worker/processor';

describe('DEX Router', () => {
  const router = new MockDexRouter();
  it('generates varied quotes', async () => {
    const quotes = await router.getQuotes('SOL-USDC', 1);
    expect(quotes).toHaveLength(2);
    expect(quotes[0].liquidity).toBeGreaterThan(1e6);
    expect(quotes[0].price).toBeGreaterThan(0);
  });
  it('scores best quote for BUY (lowest effective price)', () => {
    const q1 = { venue: 'R1', price: 100, fee: 0.003, liquidity: 1e9 } as any;
    const q2 = { venue: 'M1', price: 102, fee: 0.002, liquidity: 1e9 } as any;
    expect(scoreForSide('BUY', q1)).toBeLessThan(scoreForSide('BUY', q2));  // q1 better
  });
  it('scores best for SELL (highest effective price)', () => {
    const q1 = { venue: 'R1', price: 100, fee: 0.003, liquidity: 1e9 } as any;
    const q2 = { venue: 'M1', price: 98, fee: 0.002, liquidity: 1e9 } as any;
    expect(scoreForSide('SELL', q2)).toBeGreaterThan(scoreForSide('SELL', q1));  // q2 better
  });
});