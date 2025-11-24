export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Quote {
  venue: 'Raydium' | 'Meteora';
  price: number;
  fee: number;
  liquidity: number;  // Added for spec compliance
}

export class MockDexRouter {
  private basePrices: Record<string, number> = {
    'SOL-USDC': 145.5,
    'BTC-USDC': 62000.0,
    'USDC-SOL': 0.0068,
  };

  async getQuotes(pair: string, amount: number): Promise<Quote[]> {
    await sleep(200 + Math.random() * 200);
    const base = this.basePrices[pair] || 100;
    const raydiumPrice = base * (0.98 + Math.random() * 0.04);
    const meteoraPrice = base * (0.97 + Math.random() * 0.05);
    return [
      { 
        venue: 'Raydium', 
        price: parseFloat(raydiumPrice.toFixed(6)), 
        fee: 0.003,
        liquidity: 1e6 + Math.random() * 1e9  // Random liquidity 1M-1B
      },
      { 
        venue: 'Meteora', 
        price: parseFloat(meteoraPrice.toFixed(6)), 
        fee: 0.002,
        liquidity: 1e6 + Math.random() * 1e9
      },
    ];
  }

  /**
   * Execute swap on the chosen venue.
   * We accept `quotedPrice` and simulate slight execution slippage around it.
   */
  async executeSwap(venue: string, amount: number, quotedPrice?: number) {
    await sleep(2000 + Math.random() * 1000);
    // Simulate execution price deviating slightly from quotedPrice
    const base = quotedPrice ?? (this.basePrices['SOL-USDC'] || 100);
    const executedPrice = parseFloat((base * (1 + (Math.random() - 0.5) * 0.01)).toFixed(6)); // ±0.5%
    // small chance to fail to test retry logic (simulate severe slippage)
    if (Math.random() < 0.03) throw new Error('Slippage tolerance exceeded');
    const txHash = this.generateMockTxHash();
    return { txHash, executedPrice };
  }

  private generateMockTxHash() {
    const chars = '0123456789abcdef';
    let out = '';
    for (let i = 0; i < 64; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return `0x${out}`;
  }
}