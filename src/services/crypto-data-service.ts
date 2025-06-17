
'use server';
/**
 * @fileOverview Service for fetching cryptocurrency market data from CoinMarketCap.
 */

import { z } from 'zod';

// Schema for individual coin data from CoinMarketCap API (relevant parts)
const CoinMarketCapQuoteSchema = z.object({
  price: z.number().nullable(),
  volume_24h: z.number().nullable(),
  percent_change_24h: z.number().nullable(),
  market_cap: z.number().nullable(),
  last_updated: z.string().nullable(),
});

const CoinMarketCapCoinDataSchema = z.object({
  id: z.number(), // CoinMarketCap's internal ID
  name: z.string(),
  symbol: z.string(),
  slug: z.string(), // This is often a good human-readable identifier
  quote: z.record(z.string(), CoinMarketCapQuoteSchema), // e.g., "USD": { ... }
});

// Schema for the overall API response from /v1/cryptocurrency/quotes/latest
const CoinMarketCapApiResponseSchema = z.object({
  status: z.object({
    timestamp: z.string(),
    error_code: z.number(),
    error_message: z.string().nullable(),
    elapsed: z.number(),
    credit_count: z.number(),
    notice: z.string().nullable(),
  }),
  data: z.record(z.string(), CoinMarketCapCoinDataSchema), // Data is keyed by symbol, e.g., "BTC": { ... }
});

// The structure we'll return from our service function - This schema is internal
const ProcessedCoinMarketDataSchema = z.object({
  id: z.string(), // Using slug as a consistent string ID for our app
  symbol: z.string(),
  name: z.string(),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  total_volume: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  last_updated: z.string().nullable(),
});
export type CoinMarketData = z.infer<typeof ProcessedCoinMarketDataSchema>;


/**
 * Fetches market data for a list of coins from CoinMarketCap.
 * @param coinSymbols - A comma-separated string of coin symbols (e.g., "BTC,ETH,SOL").
 * @returns A promise that resolves to an array of processed coin market data.
 */
export async function fetchCoinData(coinSymbols: string): Promise<CoinMarketData[]> {
  if (!coinSymbols || coinSymbols.trim() === "") {
    return [];
  }
  if (!process.env.COINMARKETCAP_API_KEY || process.env.COINMARKETCAP_API_KEY === 'YOUR_COINMARKETCAP_API_KEY') {
    console.error("CoinMarketCap API key is missing or not configured in .env file.");
    throw new Error("CoinMarketCap API key is not configured. Please add it to your .env file.");
  }

  const COINMARKETCAP_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
  const convertCurrency = 'USD'; // Or any other currency you prefer
  // Note: CoinMarketCap uses 'symbol' parameter for multiple symbols
  const url = `${COINMARKETCAP_API_URL}?symbol=${coinSymbols.trim().toUpperCase()}&convert=${convertCurrency}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const responseData = await response.json();

    if (!response.ok || responseData.status.error_code !== 0) {
      const errorMsg = responseData.status.error_message || `API request failed with status ${response.status}`;
      console.error(`CoinMarketCap API error: ${responseData.status.error_code} - ${errorMsg}`);
      if (responseData.status.error_code === 1001 || response.status === 401) { // 1001 is 'API key invalid'
         throw new Error(`CoinMarketCap API Key is invalid or missing. (Status: ${responseData.status.error_code || response.status})`);
      }
      if (response.status === 429 || responseData.status.error_code === 1008) { // 1008 is 'Rate limit exceeded'
        throw new Error(`CoinMarketCap API rate limit exceeded. Please wait and try again. (Status: ${responseData.status.error_code || response.status})`);
      }
      throw new Error(`Failed to fetch data from CoinMarketCap: ${errorMsg} (Status: ${responseData.status.error_code || response.status})`);
    }
    
    const validationResult = CoinMarketCapApiResponseSchema.safeParse(responseData);
    if (!validationResult.success) {
      console.error("CoinMarketCap API response validation error:", validationResult.error.issues);
      throw new Error("Invalid data format received from CoinMarketCap API.");
    }

    // Process the data into the format our app expects
    const processedData: CoinMarketData[] = Object.values(validationResult.data.data).map(coin => {
      const quote = coin.quote[convertCurrency];
      return {
        id: coin.slug, // Using slug as a consistent string ID
        symbol: coin.symbol,
        name: coin.name,
        current_price: quote?.price ?? null,
        market_cap: quote?.market_cap ?? null,
        total_volume: quote?.volume_24h ?? null,
        price_change_percentage_24h: quote?.percent_change_24h ?? null,
        last_updated: quote?.last_updated ?? null,
      };
    });

    return processedData;

  } catch (error) {
    console.error('Error fetching coin data from CoinMarketCap:', error);
    // Re-throw the error so it can be caught by the calling function in page.tsx
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while fetching data from CoinMarketCap.");
  }
}

