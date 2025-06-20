
import type { HistoricalPricePoint } from '@/services/crypto-data-service';

export interface BacktestConfiguration {
  coinGeckoId: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  // MA Crossover specific params - will be removed or made optional later if we keep both modes
  // shortMAPeriod: number;
  // longMAPeriod: number;

  // AI Recommendation specific params
  aiSignal?: 'Buy' | 'Sell' | 'Hold' | string; // string for flexibility if AI outputs other variations
  aiEntryPrice?: number | null;
  aiExitPrice?: number | null;
}

export interface TradeLogEntry {
  date: Date;
  type: 'Buy' | 'Sell';
  price: number;
  quantity: number;
  cashAfterTrade: number;
  coinsHeld: number;
  reason: string; 
}

export interface BacktestResult {
  config: BacktestConfiguration;
  finalPortfolioValue: number;
  totalProfitLoss: number;
  profitLossPercentage: number;
  totalTrades: number;
  tradeLog: TradeLogEntry[];
  historicalDataWithMAs?: (HistoricalPricePoint & { shortMA?: number; longMA?: number })[]; // Kept for potential future MA crossover display
  buyAndHoldProfitLossPercentage?: number;
  statusMessage?: string; 
}

// This type might be deprecated if MA Crossover is fully removed from this flow.
// For now, it's not directly used by the AI Recommendation backtest.
export interface MAValues {
  shortMA?: number;
  longMA?: number;
}
