
'use server';
/**
 * @fileOverview Service for fetching cryptocurrency market data from CoinGecko.
 */

import { z } from 'zod';

const CoinGeckoMarketDataSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string().optional(),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  market_cap_rank: z.number().nullable(),
  fully_diluted_valuation: z.number().nullable().optional(),
  total_volume: z.number().nullable(),
  high_24h: z.number().nullable(),
  low_24h: z.number().nullable(),
  price_change_24h: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  market_cap_change_24h: z.number().nullable(),
  market_cap_change_percentage_24h: z.number().nullable(),
  circulating_supply: z.number().nullable(),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable().optional(),
  ath: z.number().nullable(),
  ath_change_percentage: z.number().nullable(),
  ath_date: z.string().nullable(),
  atl: z.number().nullable(),
  atl_change_percentage: z.number().nullable(),
  atl_date: z.string().nullable(),
  roi: z.object({
    times: z.number(),
    currency: z.string(),
    percentage: z.number(),
  }).nullable().optional(),
  last_updated: z.string().nullable(),
});

export type CoinMarketData = z.infer<typeof CoinGeckoMarketDataSchema>;

// This schema is used internally for validation.
const CoinMarketDataServiceValidationSchema = z.array(CoinGeckoMarketDataSchema);


/**
 * Fetches market data for a list of coins from CoinGecko.
 * @param coinIds - A comma-separated string of coin IDs (e.g., "bitcoin,ethereum").
 * @returns A promise that resolves to an array of coin market data.
 */
export async function fetchCoinData(coinIds: string): Promise<CoinMarketData[]> {
  if (!coinIds || coinIds.trim() === "") {
    return [];
  }
  const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/markets';
  const vsCurrency = 'usd';
  const url = `${COINGECKO_API_URL}?vs_currency=${vsCurrency}&ids=${coinIds.trim()}&order=market_cap_desc&per_page=250&page=1&sparkline=false`;

  try {
    const response = await fetch(url, { cache: 'no-store' }); 
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`, errorBody);
      if (response.status === 429) {
        throw new Error(`CoinGecko API rate limit exceeded. Please wait and try again. (Status: 429)`);
      }
      throw new Error(`Failed to fetch data from CoinGecko: ${response.statusText} (Status: ${response.status})`);
    }
    const data = await response.json();
    
    const validationResult = CoinMarketDataServiceValidationSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("CoinGecko API response validation error:", validationResult.error.issues);
      throw new Error("Invalid data format received from CoinGecko API.");
    }
    return validationResult.data;
  } catch (error) {
    console.error('Error fetching coin data from CoinGecko:', error);
    throw error; 
  }
}

