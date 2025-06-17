
'use server';
/**
 * @fileOverview Service for fetching cryptocurrency market data from CoinGecko.
 */

import { z } from 'zod';

// Schema for individual coin data from CoinGecko's /coins/markets endpoint
const CoinGeckoMarketCoinSchema = z.object({
  id: z.string(), // e.g., "bitcoin"
  symbol: z.string(), // e.g., "btc"
  name: z.string(), // e.g., "Bitcoin"
  image: z.string().url().optional(),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  market_cap_rank: z.number().nullable(),
  fully_diluted_valuation: z.number().nullable(),
  total_volume: z.number().nullable(),
  high_24h: z.number().nullable(),
  low_24h: z.number().nullable(),
  price_change_24h: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  market_cap_change_24h: z.number().nullable(),
  market_cap_change_percentage_24h: z.number().nullable(),
  circulating_supply: z.number().nullable(),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  ath: z.number().nullable(),
  ath_change_percentage: z.number().nullable(),
  ath_date: z.string().datetime({ offset: true }).nullable(),
  atl: z.number().nullable(),
  atl_change_percentage: z.number().nullable(),
  atl_date: z.string().datetime({ offset: true }).nullable(),
  roi: z.object({
    times: z.number(),
    currency: z.string(),
    percentage: z.number(),
  }).nullable(),
  last_updated: z.string().datetime({ offset: true }).nullable(),
});

// This is the structure we'll return from our service function.
const ProcessedCoinDataSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  total_volume: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  last_updated: z.string().nullable(),
});
export type CryptoCoinData = z.infer<typeof ProcessedCoinDataSchema>;

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3/coins/markets';

/**
 * Fetches market data from CoinGecko.
 * If coinIds are provided, fetches data for those specific coins.
 * Otherwise, fetches a list of top coins by market cap.
 * @param count - The number of top coins to fetch if coinIds is not provided (default 5).
 * @param coinIds - Optional comma-separated string of CoinGecko coin IDs (e.g., "bitcoin,ethereum").
 * @returns A promise that resolves to an array of processed coin market data.
 */
export async function fetchCoinData(count: number = 5, coinIds?: string): Promise<CryptoCoinData[]> {
  const vs_currency = 'usd';
  const order = 'market_cap_desc'; // Used for top coins, less relevant for specific IDs but good default
  
  let url = `${COINGECKO_API_BASE_URL}?vs_currency=${vs_currency}&order=${order}&price_change_percentage=24h&sparkline=false`;

  if (coinIds && coinIds.trim() !== '') {
    url += `&ids=${coinIds.trim()}`;
    // per_page is not needed when specific ids are requested, but API handles it gracefully
    // We can also cap the number of IDs if needed, but CoinGecko handles many.
  } else {
    url += `&per_page=${count}&page=1`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`, errorBody);
      if (response.status === 429) {
        throw new Error(`CoinGecko API rate limit exceeded. Please wait and try again. (Status: 429)`);
      }
      if (response.status === 404 && coinIds) {
        throw new Error(`One or more coin IDs not found: ${coinIds}. Please check the CoinGecko IDs. (Status: 404)`);
      }
      throw new Error(`Failed to fetch data from CoinGecko: ${response.statusText} (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    // If data is an empty object (can happen with bad specific IDs not causing 404), treat as no data
    if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0) {
        return [];
    }

    const validationResult = z.array(CoinGeckoMarketCoinSchema).safeParse(data);

    if (!validationResult.success) {
      console.error("CoinGecko API response validation error:", validationResult.error.issues);
      throw new Error("Invalid data format received from CoinGecko API.");
    }

    const processedData: CryptoCoinData[] = validationResult.data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      total_volume: coin.total_volume,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      last_updated: coin.last_updated,
    }));

    return processedData;

  } catch (error) {
    console.error('Error fetching coin data from CoinGecko:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while fetching data from CoinGecko.");
  }
}
