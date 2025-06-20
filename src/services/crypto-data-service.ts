
'use server';
/**
 * @fileOverview Service for fetching cryptocurrency market data from CoinGecko.
 */

import { z } from 'zod';

// Time frames we offer in the UI and pass to AI. These are the values used in FilterSortControls.
// This constant is now internal to this module. The AppTimeFrame type is exported.
const APP_SUPPORTED_TIME_FRAMES = ["15m", "30m", "1h", "4h", "12h", "24h", "7d", "30d"] as const;
export type AppTimeFrame = typeof APP_SUPPORTED_TIME_FRAMES[number];

// Helper function to map app's desired time frame to what CoinGecko's /coins/markets endpoint
// supports for its `price_change_percentage` parameter.
function mapAppTimeFrameToCoinGeckoParam(appTimeFrame: AppTimeFrame): string {
  switch (appTimeFrame) {
    case "15m":
    case "30m":
    case "1h":
      return "1h"; // For 15m, 30m, and 1h analysis, use CoinGecko's 1h price change data.
    case "4h":
    case "12h":
    case "24h":
      return "24h"; // For 4h, 12h, and 24h analysis, use CoinGecko's 24h price change data.
    case "7d":
      return "7d";
    case "30d":
      return "30d";
    default:
      // Fallback, though all AppTimeFrame values should be covered.
      console.warn(`Unknown AppTimeFrame: ${appTimeFrame}, defaulting to 24h for CoinGecko param.`);
      return "24h";
  }
}


// Schema for individual coin from CoinGecko's /coins/list endpoint
const CoinListItemSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
});
type CoinListItem = z.infer<typeof CoinListItemSchema>;

// Schema for individual coin data from CoinGecko's /coins/markets endpoint
const CoinGeckoMarketCoinSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string().url().optional(),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  market_cap_rank: z.number().nullable(),
  fully_diluted_valuation: z.number().nullable(),
  total_volume: z.number().nullable(),
  high_24h: z.number().nullable(),
  low_24h: z.number().nullable(),
  price_change_24h: z.number().nullable(),
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
}).catchall(z.any()); // Allows other properties like price_change_percentage_Xh_in_currency


const ProcessedCoinDataSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  total_volume: z.number().nullable(),
  price_change_percentage_selected_timeframe: z.number().nullable(),
  last_updated: z.string().nullable(),
});
export type CryptoCoinData = z.infer<typeof ProcessedCoinDataSchema>;

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';

async function fetchCoinList(): Promise<CoinListItem[]> {
  const url = `${COINGECKO_API_BASE_URL}/coins/list?include_platform=false`;
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 } 
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`CoinGecko API error (coins/list): ${response.status} ${response.statusText}`, { errorBody });
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

export async function fetchCoinData(
  count: number = 5,
  symbols?: string,
  // User's selected time frame for analysis (e.g., "15m", "1h", "4h", "24h", "7d")
  userSelectedTimeFrame: AppTimeFrame = "24h" 
): Promise<CryptoCoinData[]> {
  const vs_currency = 'usd';
  const order = 'market_cap_desc';
  let coinGeckoIdsToFetch: string | undefined = undefined;

  // Map the user's selected time frame to the actual parameter CoinGecko API supports
  // for `price_change_percentage`. This data point will be an approximation for some user selections.
  const coinGeckoTimeFrameParam = mapAppTimeFrameToCoinGeckoParam(userSelectedTimeFrame);

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
        return [];
    }
    coinGeckoIdsToFetch = ids.join(',');
  }

  let url = `${COINGECKO_API_BASE_URL}/coins/markets?vs_currency=${vs_currency}&order=${order}&price_change_percentage=${coinGeckoTimeFrameParam}&sparkline=false`;

  if (coinGeckoIdsToFetch) {
    url += `&ids=${coinGeckoIdsToFetch}`;
  } else {
    url += `&per_page=${count}&page=1`;
  }

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`CoinGecko API error (coins/markets): ${response.status} ${response.statusText}`, { errorBody, url });
      if (response.status === 429) {
        throw new Error(`CoinGecko API rate limit exceeded. Please wait and try again. (Status: 429)`);
      }
      if (response.status === 404 && coinGeckoIdsToFetch) {
        throw new Error(`One or more coins derived from symbols not found: ${coinGeckoIdsToFetch}. (Status: 404)`);
      }
      throw new Error(`Failed to fetch market data from CoinGecko: ${response.statusText} (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0 && coinGeckoIdsToFetch) {
        console.warn(`CoinGecko returned empty object for IDs: ${coinGeckoIdsToFetch}`);
        return [];
    }

    const validationResult = z.array(CoinGeckoMarketCoinSchema).safeParse(data);

    if (!validationResult.success) {
      console.error("CoinGecko API response validation error (coins/markets):", validationResult.error.issues, {dataReceived: data});
      throw new Error("Invalid data format received from CoinGecko API (coins/markets).");
    }

    // This key is used to extract the price change % from CoinGecko's response.
    // It corresponds to the `coinGeckoTimeFrameParam` we requested.
    const priceChangeKeyForExtraction = `price_change_percentage_${coinGeckoTimeFrameParam}_in_currency`;

    const processedData: CryptoCoinData[] = validationResult.data.map(coin => {
      const coinTyped = coin as any; 
      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        // This field now holds the price change from the `coinGeckoTimeFrameParam` (e.g., 1h or 24h).
        // The AI will be informed that this is the available metric, but the `selected_time_frame` (user's original choice)
        // should guide its analysis duration.
        price_change_percentage_selected_timeframe: coinTyped[priceChangeKeyForExtraction] ?? null,
        last_updated: coin.last_updated,
      };
    });

    return processedData;

  } catch (error) {
    console.error('Error fetching market data from CoinGecko:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while fetching market data from CoinGecko.");
  }
}
