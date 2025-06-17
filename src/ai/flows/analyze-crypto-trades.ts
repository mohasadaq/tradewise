
'use server';

/**
 * @fileOverview Analyzes crypto coins using technical analysis and provided market data to recommend coins for trading, including entry and exit prices, and a trading signal.
 *
 * - analyzeCryptoTrades - A function that analyzes crypto coins and provides trading recommendations.
 * - AnalyzeCryptoTradesInput - The input type for the analyzeCryptoTrades function.
 * - AnalyzeCryptoTradesOutput - The return type for the analyzeCryptoTrades function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

// Schema for individual coin data input to the AI
// This schema remains largely the same, as page.tsx will map CoinMarketCap data to these fields.
const CoinDataInputSchema = z.object({
  id: z.string().describe("The unique identifier of the coin (e.g., bitcoin, ethereum). This is often the 'slug' from CoinMarketCap."),
  symbol: z.string().describe("The ticker symbol of the coin (e.g., BTC, ETH)."),
  name: z.string().describe("The name of the coin (e.g., Bitcoin, Ethereum)."),
  current_price: z.number().nullable().describe("The current market price of the coin in USD."),
  market_cap: z.number().nullable().describe("The market capitalization of the coin in USD."),
  total_volume: z.number().nullable().describe("The total trading volume in the last 24 hours in USD."),
  price_change_percentage_24h: z.number().nullable().describe("The price change percentage in the last 24 hours."),
});
export type CoinDataInput = z.infer<typeof CoinDataInputSchema>;


const AnalyzeCryptoTradesInputSchema = z.object({
  coinsData: z.array(CoinDataInputSchema).describe("An array of objects, each containing market data for a specific cryptocurrency fetched from an external API like CoinMarketCap."),
});
export type AnalyzeCryptoTradesInput = z.infer<typeof AnalyzeCryptoTradesInputSchema>;

const AnalyzeCryptoTradesOutputSchema = z.object({
  tradingRecommendations: z.array(
    z.object({
      coin: z.string().describe('The ticker symbol of the recommended coin (e.g., BTC, ETH). This should match the input symbol.'),
      currentPrice: z.number().nullable().describe('The current market price of the coin, taken from the input data.'),
      entryPrice: z.number().nullable().describe('The recommended entry price for the coin.'),
      exitPrice: z.number().nullable().describe('The recommended exit price for the coin.'),
      signal: z.string().describe('The trading signal (Buy, Sell, or Hold).'),
      confidenceLevel: z
        .string()
        .describe('The confidence level of the recommendation (High, Medium, Low).'),
      technicalIndicators: z
        .array(z.string())
        .describe('Key technical indicators supporting the recommendation (e.g., RSI, MACD crossover, Bollinger Bands).'),
      orderBookAnalysis: z.string().describe('Summary of inferred order book analysis or market sentiment.'),
    })
  ).describe('A list of trading recommendations for the specified crypto coins.'),
});
export type AnalyzeCryptoTradesOutput = z.infer<typeof AnalyzeCryptoTradesOutputSchema>;

export async function analyzeCryptoTrades(input: AnalyzeCryptoTradesInput): Promise<AnalyzeCryptoTradesOutput> {
  if (!input.coinsData || input.coinsData.length === 0) {
    return { tradingRecommendations: [] };
  }
  return analyzeCryptoTradesFlow(input);
}

const analyzeCryptoTradesPrompt = ai.definePrompt({
  name: 'analyzeCryptoTradesPrompt',
  input: {schema: AnalyzeCryptoTradesInputSchema},
  output: {schema: AnalyzeCryptoTradesOutputSchema},
  prompt: `You are an expert AI crypto trading analyst. You have been provided with real-time market data for several cryptocurrencies.
Your task is to analyze each coin based on this provided data and your knowledge of technical analysis (e.g., RSI, MACD, Bollinger Bands, support/resistance levels) and market sentiment.
Do not attempt to fetch external data; use only the data provided below for current prices and market stats.

Analyze the following coins:
{{#each coinsData}}
Coin Details:
- ID (Slug): {{{id}}}
- Symbol: {{{symbol}}}
- Name: {{{name}}}
- Current Price (USD): {{#if current_price}}{{current_price}}{{else}}N/A{{/if}}
- Market Cap (USD): {{#if market_cap}}{{market_cap}}{{else}}N/A{{/if}}
- 24h Volume (USD): {{#if total_volume}}{{total_volume}}{{else}}N/A{{/if}}
- 24h Price Change (%): {{#if price_change_percentage_24h}}{{price_change_percentage_24h}}%{{else}}N/A{{/if}}
---
{{/each}}

For each coin, provide:
1.  'coin': The ticker symbol (e.g., BTC, ETH). This MUST match the 'symbol' from the input for that coin.
2.  'currentPrice': The current market price provided in the input.
3.  'entryPrice': Your recommended entry price.
4.  'exitPrice': Your recommended exit price.
5.  'signal': A clear trading signal: "Buy", "Sell", or "Hold".
6.  'confidenceLevel': Your confidence in this recommendation: "High", "Medium", or "Low".
7.  'technicalIndicators': A list of 3-5 key technical indicators or chart patterns that support your recommendation.
8.  'orderBookAnalysis': A brief summary of inferred order book dynamics or market sentiment based on the provided data and general market knowledge (e.g., "Strong buying pressure indicated by volume spikes," or "Market appears cautious, awaiting catalyst").

Format your entire response as a single JSON object matching the output schema, containing a 'tradingRecommendations' array. Each object in the array must pertain to one of the analyzed coins.
Ensure all fields in the output schema are populated. If a value cannot be determined, use null where appropriate for number fields, or a descriptive string like "N/A" for string fields if absolutely necessary (though strive for concrete analysis).
Double-check that the 'coin' symbol in your output exactly matches the 'symbol' provided in the input for each respective coin.
`,
});

const analyzeCryptoTradesFlow = ai.defineFlow(
  {
    name: 'analyzeCryptoTradesFlow',
    inputSchema: AnalyzeCryptoTradesInputSchema,
    outputSchema: AnalyzeCryptoTradesOutputSchema,
  },
  async (input: AnalyzeCryptoTradesInput) => {
    if (!input.coinsData || input.coinsData.length === 0) {
      return { tradingRecommendations: [] };
    }
    const {output} = await analyzeCryptoTradesPrompt(input);
    if (!output) {
        console.error("AI analysis returned no output.");
        return { tradingRecommendations: [] };
    }
    // Ensure the output structure is as expected, especially currentPrice
    const validatedRecommendations = output.tradingRecommendations.map(rec => {
        const originalCoinData = input.coinsData.find(cd => cd.symbol.toLowerCase() === rec.coin.toLowerCase());
        return {
            ...rec,
            currentPrice: originalCoinData?.current_price ?? rec.currentPrice ?? null, // Prioritize input current_price
        };
    });

    return { tradingRecommendations: validatedRecommendations };
  }
);
