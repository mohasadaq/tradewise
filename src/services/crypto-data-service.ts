
'use server';
/**
 * @fileOverview Service for fetching cryptocurrency market data from CoinGecko.
 */

import { z } from 'zod';

// Schema for individual coin from CoinGecko's /coins/list endpoint
const CoinListItemSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
});
type CoinListItem = z.infer<typeof CoinListItemSchema>;

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

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';

/**
 * Fetches a list of all coins from CoinGecko for symbol-to-ID mapping.
 * @returns A promise that resolves to an array of CoinListItems.
 */
async function fetchCoinList(): Promise<CoinListItem[]> {
  const url = `${COINGECKO_API_BASE_URL}/coins/list`;
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      cache: 'force-cache', // Cache this aggressively as it changes infrequently
      next: { revalidate: 3600 * 24 } // Revalidate once a day
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`CoinGecko API error (coins/list): ${response.status} ${response.statusText}`, errorBody);
      if (response.status === 429) {
        throw new Error(`CoinGecko API rate limit exceeded while fetching coin list. (Status: 429)`);
      }
      throw new Error(`Failed to fetch coin list from CoinGecko: ${response.statusText} (Status: ${response.status})`);
    }
    const data = await response.json();
    const validationResult = z.array(CoinListItemSchema).safeParse(data);
    if (!validationResult.success) {
      console.error("CoinGecko API response validation error (coins/list):", validationResult.error.issues);
      throw new Error("Invalid data format received from CoinGecko API (coins/list).");
    }
    return validationResult.data;
  } catch (error) {
    console.error('Error fetching coin list from CoinGecko:', error);
    if (error instanceof Error) throw error;
    throw new Error("An unknown error occurred while fetching coin list from CoinGecko.");
  }
}


/**
 * Fetches market data from CoinGecko.
 * If symbols are provided, fetches data for those specific coins by first converting symbols to IDs.
 * Otherwise, fetches a list of top coins by market cap.
 * @param count - The number of top coins to fetch if symbols is not provided.
 * @param symbols - Optional comma-separated string of coin symbols (e.g., "btc,eth").
 * @returns A promise that resolves to an array of processed coin market data.
 */
export async function fetchCoinData(count: number = 5, symbols?: string): Promise<CryptoCoinData[]> {
  const vs_currency = 'usd';
  const order = 'market_cap_desc';
  let coinGeckoIdsToFetch: string | undefined = undefined;

  if (symbols && symbols.trim() !== '') {
    const coinList = await fetchCoinList();
    const symbolArray = symbols.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
    const ids: string[] = [];
    for (const sym of symbolArray) {
      const foundCoin = coinList.find(coin => coin.symbol.toLowerCase() === sym);
      if (foundCoin) {
        ids.push(foundCoin.id);
      } else {
        console.warn(`Symbol '${sym}' not found in CoinGecko's list. Skipping.`);
      }
    }
    if (ids.length === 0) {
        console.warn(`No valid CoinGecko IDs found for symbols: ${symbols}`);
        return []; // Return empty if no valid IDs were found from symbols
    }
    coinGeckoIdsToFetch = ids.join(',');
  }

  let url = `${COINGECKO_API_BASE_URL}/coins/markets?vs_currency=${vs_currency}&order=${order}&price_change_percentage=24h&sparkline=false`;

  if (coinGeckoIdsToFetch) {
    url += `&ids=${coinGeckoIdsToFetch}`;
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
      console.error(`CoinGecko API error (coins/markets): ${response.status} ${response.statusText}`, errorBody);
      if (response.status === 429) {
        throw new Error(`CoinGecko API rate limit exceeded. Please wait and try again. (Status: 429)`);
      }
      if (response.status === 404 && coinGeckoIdsToFetch) {
        throw new Error(`One or more coin IDs derived from symbols not found: ${coinGeckoIdsToFetch}. (Status: 404)`);
      }
      throw new Error(`Failed to fetch market data from CoinGecko: ${response.statusText} (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0) {
        return [];
    }

    const validationResult = z.array(CoinGeckoMarketCoinSchema).safeParse(data);

    if (!validationResult.success) {
      console.error("CoinGecko API response validation error (coins/markets):", validationResult.error.issues);
      throw new Error("Invalid data format received from CoinGecko API (coins/markets).");
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
    console.error('Error fetching market data from CoinGecko:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while fetching market data from CoinGecko.");
  }
}
