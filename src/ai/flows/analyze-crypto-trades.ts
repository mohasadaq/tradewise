
'use server';

/**
 * @fileOverview Analyzes crypto coins using technical analysis and provided market data to recommend coins for trading, including entry and exit prices, a trading signal, and a suggested trading strategy.
 * Considers a specific time frame for price change analysis.
 *
 * - analyzeCryptoTrades - A function that analyzes crypto coins and provides trading recommendations.
 * - AnalyzeCryptoTradesInput - The input type for the analyzeCryptoTrades function.
 * - AnalyzeCryptoTradesOutput - The return type for the analyzeCryptoTrades function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

// Schema for individual coin data input to the AI
const AICoinAnalysisInputDataSchema = z.object({
  id: z.string().describe("The unique identifier of the coin (e.g., bitcoin, ethereum). This is often the 'id' from CoinGecko."),
  symbol: z.string().describe("The ticker symbol of the coin (e.g., BTC, ETH)."),
  name: z.string().describe("The name of the coin (e.g., Bitcoin, Ethereum)."),
  current_price: z.number().nullable().describe("The current market price of the coin in USD."),
  market_cap: z.number().nullable().describe("The market capitalization of the coin in USD."),
  total_volume: z.number().nullable().describe("The total trading volume in the last 24 hours in USD."),
  price_change_percentage_in_selected_timeframe: z.number().nullable().describe("The price change percentage for the selected time frame (e.g., if '7d' was selected, this is the 7-day price change percentage)."),
  selected_time_frame: z.string().describe("The time frame for which the 'price_change_percentage_in_selected_timeframe' is reported (e.g., '1h', '24h', '7d', '30d')."),
});
export type AICoinAnalysisInputData = z.infer<typeof AICoinAnalysisInputDataSchema>;


const AnalyzeCryptoTradesInputSchema = z.object({
  coinsData: z.array(AICoinAnalysisInputDataSchema).describe("An array of objects, each containing market data for a specific cryptocurrency fetched from an external API like CoinGecko, tailored to a selected time frame."),
});
export type AnalyzeCryptoTradesInput = z.infer<typeof AnalyzeCryptoTradesInputSchema>;

const AnalyzeCryptoTradesOutputSchema = z.object({
  tradingRecommendations: z.array(
    z.object({
      coin: z.string().describe('The ticker symbol of the recommended coin (e.g., BTC, ETH). This should match the input symbol.'),
      coinName: z.string().describe('The full name of the coin (e.g., Bitcoin, Ethereum). This should match the input name.'),
      currentPrice: z.number().nullable().describe('The current market price of the coin, taken from the input data.'),
      entryPrice: z.number().nullable().describe('The recommended entry price for the coin.'),
      exitPrice: z.number().nullable().describe('The recommended exit price for the coin.'),
      signal: z.string().describe('The trading signal (Buy, Sell, or Hold).'),
      confidenceLevel: z
        .string()
        .describe('The confidence level of the recommendation (High, Medium, Low).'),
      technicalIndicators: z
        .array(z.string())
        .describe('Key technical indicators supporting the recommendation (e.g., RSI, MACD crossover, Bollinger Bands). These should consider the selected_time_frame.'),
      orderBookAnalysis: z.string().describe('Summary of inferred order book analysis or market sentiment.'),
      tradingStrategy: z.string().optional().describe('The suggested trading strategy (e.g., Day Trade, Swing Trade, Scalping, Position Trade) appropriate for the selected_time_frame and analysis.'),
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
  prompt: `You are an expert AI crypto trading analyst. You have been provided with real-time market data for several cryptocurrencies, including price change percentage for a specific time frame.
Your task is to analyze each coin based on this provided data and your knowledge of technical analysis (e.g., RSI, MACD, Bollinger Bands, support/resistance levels) and market sentiment, paying close attention to the 'selected_time_frame' for the price change data.
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
- Price Change ({{selected_time_frame}}) (%): {{#if price_change_percentage_in_selected_timeframe}}{{price_change_percentage_in_selected_timeframe}}%{{else}}N/A{{/if}}
- Analysis Time Frame: {{{selected_time_frame}}}
---
{{/each}}

For each coin, provide:
1.  'coin': The ticker symbol (e.g., BTC, ETH). This MUST match the 'symbol' from the input for that coin.
2.  'coinName': The full name of the coin (e.g., Bitcoin, Ethereum). This MUST match the 'name' from the input for that coin.
3.  'currentPrice': The current market price provided in the input.
4.  'entryPrice': Your recommended entry price, suitable for the selected_time_frame and suggested tradingStrategy.
5.  'exitPrice': Your recommended exit price, suitable for the selected_time_frame and suggested tradingStrategy.
6.  'signal': A clear trading signal: "Buy", "Sell", or "Hold".
7.  'confidenceLevel': Your confidence in this recommendation: "High", "Medium", or "Low".
8.  'technicalIndicators': A list of 3-5 key technical indicators or chart patterns that support your recommendation. Ensure these indicators are relevant to the 'selected_time_frame' context and the suggested tradingStrategy.
9.  'orderBookAnalysis': A brief summary of inferred order book dynamics or market sentiment based on the provided data and general market knowledge.
10. 'tradingStrategy': Based on the 'selected_time_frame' (e.g., '1h', '24h', '7d', '30d') and your overall analysis, suggest an appropriate trading strategy. Examples: "Scalping" or "Short-term Day Trade" for 1h; "Day Trade" or "Short Swing" for 24h; "Swing Trade" for 7d; "Longer Swing Trade" or "Position Entry" for 30d. The strategy should align with the entry/exit prices and technical indicators.

Format your entire response as a single JSON object matching the output schema, containing a 'tradingRecommendations' array. Each object in the array must pertain to one of the analyzed coins.
Ensure all fields in the output schema are populated, including 'tradingStrategy'. If a value cannot be determined, use null where appropriate for number fields, or a descriptive string like "N/A" for string fields if absolutely necessary.
Double-check that the 'coin' symbol and 'coinName' in your output exactly match the 'symbol' and 'name' provided in the input for each respective coin.
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
    // Ensure the output structure is as expected, especially currentPrice and coinName
    const validatedRecommendations = output.tradingRecommendations.map(rec => {
        const originalCoinData = input.coinsData.find(
          cd => cd.symbol.toLowerCase() === rec.coin.toLowerCase() || cd.name.toLowerCase() === rec.coinName.toLowerCase()
        );
        return {
            ...rec,
            currentPrice: originalCoinData?.current_price ?? rec.currentPrice ?? null,
            coinName: originalCoinData?.name ?? rec.coinName, // Prioritize input name
            tradingStrategy: rec.tradingStrategy || "N/A", // Ensure tradingStrategy has a fallback
        };
    });

    return { tradingRecommendations: validatedRecommendations };
  }
);

