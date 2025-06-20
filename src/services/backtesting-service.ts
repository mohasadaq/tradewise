
'use client'; // This service can be client-side for now

import type { HistoricalPricePoint } from '@/services/crypto-data-service';
import type { BacktestConfiguration, BacktestResult, TradeLogEntry, MAValues } from '@/types/backtesting';

function calculateSMA(data: number[], period: number): (number | undefined)[] {
  if (period <= 0 || data.length < period) {
    return new Array(data.length).fill(undefined);
  }
  const sma: (number | undefined)[] = new Array(data.length).fill(undefined);
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
    sma[i] = sum / period;
  }
  return sma;
}

function calculateBuyAndHoldProfitLossPercentage(initialCapital: number, historicalData: HistoricalPricePoint[]): number | undefined {
  if (historicalData.length > 0 && initialCapital > 0) {
    const initialPrice = historicalData[0].price;
    const finalPrice = historicalData[historicalData.length - 1].price;
    if (initialPrice === 0) return undefined; // Avoid division by zero

    const coinsBoughtForBuyAndHold = initialCapital / initialPrice;
    const buyAndHoldFinalValue = coinsBoughtForBuyAndHold * finalPrice;
    const buyAndHoldProfitLoss = buyAndHoldFinalValue - initialCapital;
    return (buyAndHoldProfitLoss / initialCapital) * 100;
  }
  return undefined;
}

export function runMACrossoverBacktest(
  config: BacktestConfiguration,
  historicalData: HistoricalPricePoint[]
): BacktestResult {
  const { initialCapital, shortMAPeriod, longMAPeriod } = config;

  // Note: Caller (page.tsx) already checks if historicalData is empty.
  // This function will be called with non-empty historicalData.

  const buyAndHoldPercentage = calculateBuyAndHoldProfitLossPercentage(initialCapital, historicalData);

  if (historicalData.length < longMAPeriod) {
    return {
      config,
      finalPortfolioValue: initialCapital,
      totalProfitLoss: 0,
      profitLossPercentage: 0,
      totalTrades: 0,
      tradeLog: [],
      historicalDataWithMAs: historicalData.map(p => ({ ...p })), // No MAs calculated
      buyAndHoldProfitLossPercentage: buyAndHoldPercentage,
      statusMessage: `Not enough historical data (${historicalData.length} points) for the selected Long MA period (${longMAPeriod}). Try using a wider date range or a shorter MA period.`,
    };
  }

  const prices = historicalData.map(p => p.price);
  const shortMAs = calculateSMA(prices, shortMAPeriod);
  const longMAs = calculateSMA(prices, longMAPeriod);

  const historicalDataWithMAs = historicalData.map((point, index) => ({
    ...point,
    shortMA: shortMAs[index],
    longMA: longMAs[index],
  }));

  let cash = initialCapital;
  let coinsHeld = 0;
  const tradeLog: TradeLogEntry[] = [];
  let positionOpen = false;

  for (let i = 1; i < historicalData.length; i++) {
    const currentPrice = historicalData[i].price;
    const currentDate = historicalData[i].date;
    const prevShortMA = shortMAs[i-1];
    const prevLongMA = longMAs[i-1];
    const currentShortMA = shortMAs[i];
    const currentLongMA = longMAs[i];

    if (prevShortMA === undefined || prevLongMA === undefined || currentShortMA === undefined || currentLongMA === undefined) {
      continue; 
    }

    if (prevShortMA <= prevLongMA && currentShortMA > currentLongMA && !positionOpen) {
      const quantityToBuy = cash / currentPrice;
      coinsHeld = quantityToBuy;
      cash = 0;
      positionOpen = true;
      tradeLog.push({
        date: currentDate,
        type: 'Buy',
        price: currentPrice,
        quantity: quantityToBuy,
        cashAfterTrade: cash,
        coinsHeld: coinsHeld,
        reason: `Short MA (${currentShortMA.toFixed(2)}) crossed above Long MA (${currentLongMA.toFixed(2)})`
      });
    }
    else if (prevShortMA >= prevLongMA && currentShortMA < currentLongMA && positionOpen) {
      cash = coinsHeld * currentPrice;
      const quantitySold = coinsHeld;
      coinsHeld = 0;
      positionOpen = false;
      tradeLog.push({
        date: currentDate,
        type: 'Sell',
        price: currentPrice,
        quantity: quantitySold,
        cashAfterTrade: cash,
        coinsHeld: coinsHeld,
        reason: `Short MA (${currentShortMA.toFixed(2)}) crossed below Long MA (${currentLongMA.toFixed(2)})`
      });
    }
  }

  if (positionOpen && historicalData.length > 0) {
    const lastPrice = historicalData[historicalData.length - 1].price;
    const lastDate = historicalData[historicalData.length - 1].date;
    cash += coinsHeld * lastPrice;
    const quantitySold = coinsHeld;
    coinsHeld = 0;
    tradeLog.push({
      date: lastDate,
      type: 'Sell',
      price: lastPrice,
      quantity: quantitySold,
      cashAfterTrade: cash,
      coinsHeld: coinsHeld,
      reason: 'Closed position at end of backtest period'
    });
  }

  const finalPortfolioValue = cash;
  const totalProfitLoss = finalPortfolioValue - initialCapital;
  const profitLossPercentage = initialCapital > 0 ? (totalProfitLoss / initialCapital) * 100 : 0;

  return {
    config,
    finalPortfolioValue,
    totalProfitLoss,
    profitLossPercentage,
    totalTrades: tradeLog.length,
    tradeLog,
    historicalDataWithMAs,
    buyAndHoldProfitLossPercentage: buyAndHoldPercentage,
    statusMessage: tradeLog.length === 0 && historicalData.length >= longMAPeriod ? "No trades were executed with the given parameters and data." : undefined,
  };
}

