
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

export function runMACrossoverBacktest(
  config: BacktestConfiguration,
  historicalData: HistoricalPricePoint[]
): BacktestResult {
  const { initialCapital, shortMAPeriod, longMAPeriod } = config;

  if (historicalData.length < longMAPeriod) {
    throw new Error("Not enough historical data for the selected Long MA period. Try using a wider date range or a shorter MA period.");
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

  for (let i = 1; i < historicalData.length; i++) { // Start from 1 to check previous day's MAs
    const currentPrice = historicalData[i].price;
    const currentDate = historicalData[i].date;
    const prevShortMA = shortMAs[i-1];
    const prevLongMA = longMAs[i-1];
    const currentShortMA = shortMAs[i];
    const currentLongMA = longMAs[i];

    if (prevShortMA === undefined || prevLongMA === undefined || currentShortMA === undefined || currentLongMA === undefined) {
      continue; // Not enough data for MAs yet
    }

    // Buy signal: Short MA crosses above Long MA
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
    // Sell signal: Short MA crosses below Long MA
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

  // If position is still open at the end, close it at the last price
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

  const finalPortfolioValue = cash; // Since all coins are sold
  const totalProfitLoss = finalPortfolioValue - initialCapital;
  const profitLossPercentage = initialCapital > 0 ? (totalProfitLoss / initialCapital) * 100 : 0;

  // Calculate Buy and Hold for comparison
  let buyAndHoldFinalValue = initialCapital;
  let buyAndHoldProfitLossPercentage: number | undefined = undefined;
  if (historicalData.length > 0 && initialCapital > 0) {
    const initialPrice = historicalData[0].price;
    const finalPrice = historicalData[historicalData.length - 1].price;
    const coinsBoughtForBuyAndHold = initialCapital / initialPrice;
    buyAndHoldFinalValue = coinsBoughtForBuyAndHold * finalPrice;
    const buyAndHoldProfitLoss = buyAndHoldFinalValue - initialCapital;
    buyAndHoldProfitLossPercentage = (buyAndHoldProfitLoss / initialCapital) * 100;
  }


  return {
    config,
    finalPortfolioValue,
    totalProfitLoss,
    profitLossPercentage,
    totalTrades: tradeLog.length,
    tradeLog,
    historicalDataWithMAs,
    buyAndHoldProfitLossPercentage,
  };
}
