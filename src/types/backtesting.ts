
import type { HistoricalPricePoint } from '@/services/crypto-data-service';

export interface BacktestConfiguration {
  coinGeckoId: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  shortMAPeriod: number;
  longMAPeriod: number;
}

export interface TradeLogEntry {
  date: Date;
  type: 'Buy' | 'Sell';
  price: number;
  quantity: number;
  cashAfterTrade: number;
  coinsHeld: number;
  reason: string; // e.g., "Short MA crossed above Long MA"
}

export interface BacktestResult {
  config: BacktestConfiguration;
  finalPortfolioValue: number;
  totalProfitLoss: number;
  profitLossPercentage: number;
  totalTrades: number;
  tradeLog: TradeLogEntry[];
  historicalDataWithMAs?: (HistoricalPricePoint & { shortMA?: number; longMA?: number })[];
  buyAndHoldProfitLossPercentage?: number;
  statusMessage?: string; // New field for informational messages
}

export interface MAValues {
  shortMA?: number;
  longMA?: number;
}

