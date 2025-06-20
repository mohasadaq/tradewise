
'use client'; 

import type { HistoricalPricePoint } from '@/services/crypto-data-service';
import type { BacktestConfiguration, BacktestResult, TradeLogEntry } from '@/types/backtesting';

// This function remains for potential future use or if MA Crossover is re-introduced elsewhere.
// For now, it's not directly called by the dashboard's backtest button.
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
    if (initialPrice === 0) return undefined; 

    const coinsBoughtForBuyAndHold = initialCapital / initialPrice;
    const buyAndHoldFinalValue = coinsBoughtForBuyAndHold * finalPrice;
    const buyAndHoldProfitLoss = buyAndHoldFinalValue - initialCapital;
    return (buyAndHoldProfitLoss / initialCapital) * 100;
  }
  return undefined;
}

export function runAIStrategyBacktest(
  config: BacktestConfiguration,
  historicalData: HistoricalPricePoint[]
): BacktestResult {
  const { 
    initialCapital, 
    aiSignal, 
    aiEntryPrice, 
    aiExitPrice 
  } = config;

  const buyAndHoldPercentage = calculateBuyAndHoldProfitLossPercentage(initialCapital, historicalData);

  if (historicalData.length === 0) {
     return {
      config,
      finalPortfolioValue: initialCapital,
      totalProfitLoss: 0,
      profitLossPercentage: 0,
      totalTrades: 0,
      tradeLog: [],
      buyAndHoldProfitLossPercentage: undefined, // No data, so B&H also N/A
      statusMessage: "Not enough historical data for the selected date range. Cannot run backtest.",
    };
  }

  let cash = initialCapital;
  let coinsHeld = 0;
  const tradeLog: TradeLogEntry[] = [];
  let positionOpen = false;
  let entryPriceForCurrentTrade: number | null = null;

  // Handle cases where AI signal is not 'Buy' or entry/exit prices are missing
  if (aiSignal?.toLowerCase() !== 'buy' || aiEntryPrice == null || aiExitPrice == null) {
    let statusMsg = "AI signal is not 'Buy', or entry/exit prices are missing. No trades simulated by AI strategy.";
    if (aiSignal?.toLowerCase() === 'sell') statusMsg = "AI signal is 'Sell'. This backtest simulates 'Buy' strategies. No trades executed.";
    if (aiSignal?.toLowerCase() === 'hold') statusMsg = "AI signal is 'Hold'. No trades executed by AI strategy.";
    
    return {
      config,
      finalPortfolioValue: initialCapital,
      totalProfitLoss: 0,
      profitLossPercentage: 0,
      totalTrades: 0,
      tradeLog: [],
      buyAndHoldProfitLossPercentage: buyAndHoldPercentage,
      statusMessage: statusMsg,
    };
  }

  for (let i = 0; i < historicalData.length; i++) {
    const currentPrice = historicalData[i].price;
    const currentDate = historicalData[i].date;

    if (currentPrice == null) continue; // Skip if price data is missing for this point

    // Try to Enter a Buy Position
    if (!positionOpen && currentPrice <= aiEntryPrice) {
      const quantityToBuy = cash / currentPrice;
      coinsHeld = quantityToBuy;
      cash = 0;
      positionOpen = true;
      entryPriceForCurrentTrade = currentPrice; // Log actual entry price which might be better than aiEntryPrice
      tradeLog.push({
        date: currentDate,
        type: 'Buy',
        price: currentPrice,
        quantity: quantityToBuy,
        cashAfterTrade: cash,
        coinsHeld: coinsHeld,
        reason: `Price (${currentPrice.toFixed(2)}) reached AI entry target (${aiEntryPrice.toFixed(2)})`
      });
    } 
    // Try to Exit a Buy Position
    else if (positionOpen && currentPrice >= aiExitPrice) {
      cash += coinsHeld * currentPrice;
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
        reason: `Price (${currentPrice.toFixed(2)}) reached AI exit target (${aiExitPrice.toFixed(2)}) after entry at ${formatPriceNullable(entryPriceForCurrentTrade)}`
      });
      entryPriceForCurrentTrade = null;
    }
  }

  // If position is still open at the end of the backtest period, close it at the last known price
  if (positionOpen && historicalData.length > 0) {
    const lastPrice = historicalData[historicalData.length - 1].price;
    const lastDate = historicalData[historicalData.length - 1].date;
    if (lastPrice != null) {
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
        reason: `Position closed at end of backtest period at price ${lastPrice.toFixed(2)} (Original entry at ${formatPriceNullable(entryPriceForCurrentTrade)})`
        });
    }
  }

  const finalPortfolioValue = cash;
  const totalProfitLoss = finalPortfolioValue - initialCapital;
  const profitLossPercentage = initialCapital > 0 ? (totalProfitLoss / initialCapital) * 100 : (finalPortfolioValue > 0 ? Infinity : 0);

  return {
    config,
    finalPortfolioValue,
    totalProfitLoss,
    profitLossPercentage,
    totalTrades: tradeLog.filter(t => t.type === 'Buy').length, // Count buy trades as one full trade cycle with its sell
    tradeLog,
    buyAndHoldProfitLossPercentage: buyAndHoldPercentage,
    statusMessage: tradeLog.length === 0 ? "No trades were executed by the AI strategy based on its entry/exit points within the historical data." : undefined,
  };
}

function formatPriceNullable(price: number | null | undefined): string {
    if (price === null || price === undefined) return 'N/A';
    return price.toFixed(2);
}

// The MA Crossover backtest function is kept here but is not currently
// wired up to the dashboard's "Backtest" button.
// It could be used for a different UI flow if MA Crossover backtesting is desired.
export function runMACrossoverBacktest(
  config: BacktestConfiguration & { shortMAPeriod: number; longMAPeriod: number }, // Ensure MA periods are present
  historicalData: HistoricalPricePoint[]
): BacktestResult {
  const { initialCapital, shortMAPeriod, longMAPeriod } = config;

  const buyAndHoldPercentage = calculateBuyAndHoldProfitLossPercentage(initialCapital, historicalData);

  if (historicalData.length < longMAPeriod) {
    return {
      config,
      finalPortfolioValue: initialCapital,
      totalProfitLoss: 0,
      profitLossPercentage: 0,
      totalTrades: 0,
      tradeLog: [],
      historicalDataWithMAs: historicalData.map(p => ({ ...p })), 
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
    statusMessage: tradeLog.length === 0 && historicalData.length >= longMAPeriod ? "No trades were executed with the MA Crossover parameters and data." : undefined,
  };
}
