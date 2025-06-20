
'use client';

import type { PortfolioHolding, NewPortfolioHolding } from '@/types/portfolio';
import { v4 as uuidv4 } from 'uuid';

const PORTFOLIO_STORAGE_KEY = 'tradewise_portfolio';

function getPortfolioHoldings(): PortfolioHolding[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const storedPortfolio = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
  if (storedPortfolio) {
    try {
      return JSON.parse(storedPortfolio) as PortfolioHolding[];
    } catch (error) {
      console.error("Error parsing portfolio from localStorage:", error);
      return [];
    }
  }
  return [];
}

function savePortfolioHoldings(holdings: PortfolioHolding[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(holdings));
}

function addPortfolioHolding(newHoldingData: Omit<NewPortfolioHolding, 'coinGeckoId' | 'symbol' | 'name'> & { coin: { id: string; symbol: string; name: string } }): PortfolioHolding[] {
  const holdings = getPortfolioHoldings();
  const newHolding: PortfolioHolding = {
    id: uuidv4(),
    coinGeckoId: newHoldingData.coin.id,
    symbol: newHoldingData.coin.symbol.toUpperCase(),
    name: newHoldingData.coin.name,
    quantity: newHoldingData.quantity,
    purchasePrice: newHoldingData.purchasePrice,
  };
  
  // Check if a holding for the same coin already exists. If so, update it.
  // For simplicity, this example adds it as a new lot. 
  // A more advanced version might average out the purchase price or keep lots separate.
  const updatedHoldings = [...holdings, newHolding];
  savePortfolioHoldings(updatedHoldings);
  return updatedHoldings;
}

function removePortfolioHolding(holdingId: string): PortfolioHolding[] {
  let holdings = getPortfolioHoldings();
  holdings = holdings.filter(h => h.id !== holdingId);
  savePortfolioHoldings(holdings);
  return holdings;
}

function updatePortfolioHolding(holdingId: string, updates: Partial<PortfolioHolding>): PortfolioHolding[] {
  let holdings = getPortfolioHoldings();
  const holdingIndex = holdings.findIndex(h => h.id === holdingId);
  if (holdingIndex > -1) {
    holdings[holdingIndex] = { ...holdings[holdingIndex], ...updates };
    savePortfolioHoldings(holdings);
  }
  return holdings;
}


export { 
  getPortfolioHoldings, 
  addPortfolioHolding, 
  removePortfolioHolding,
  updatePortfolioHolding
};
