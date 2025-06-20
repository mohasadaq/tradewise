
'use server';

/**
 * @fileOverview Analyzes crypto coins using technical analysis and provided market data to recommend coins for trading, including entry and exit prices, a trading signal, a suggested trading strategy, and risk management advice.
 * Considers a specific time frame for price change analysis.
 * Identifies demand/supply zones and bases exit prices on resistance levels.
 * Focuses on maximizing potential profit for the given time frame.
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
  price_change_percentage_in_selected_timeframe: z.number().nullable().describe("The price change percentage for the selected time frame (e.g., if '1h' was used to fetch this data, this is the 1-hour price change percentage). This value might be for a standard interval (like 1h or 24h) if the user's 'selected_time_frame' is more granular (e.g., 15m, 4h)."),
  selected_time_frame: z.string().describe("The user's selected time frame for analysis (e.g., '15m', '30m', '1h', '4h', '12h', '24h', '7d', '30d'). This is the primary context for the analysis duration and strategy. The AI should explicitly state what this time frame implies for trading."),
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
      entryPrice: z.number().nullable().describe('The recommended entry price for the coin, ideally near a strong demand zone or support level, optimized for maximum potential profit for the selected time frame.'),
      exitPrice: z.number().nullable().describe('The recommended exit price for the coin, primarily based on identified strong resistance levels or supply zones, aiming to capture the majority of the anticipated profitable move.'),
      signal: z.string().describe('The trading signal (Buy, Sell, or Hold). A "Buy" signal should target a profitable entry. A "Sell" signal can indicate a bearish outlook OR an optimal point for profit-taking from a previous "Buy".'),
      confidenceLevel: z
        .string()
        .describe('The confidence level of the recommendation (High, Medium, Low), reflecting the perceived probability of achieving the profit target.'),
      technicalIndicators: z
        .array(z.string())
        .describe('Key technical indicators (e.g., RSI, MACD, Bollinger Bands, Fibonacci levels) supporting the recommendation. Explain how these specifically validate the entry point (e.g., confirming support/demand for a profitable entry) and exit point (e.g., confirming resistance/supply for profit-taking).'),
      orderBookAnalysis: z.string().describe('Summary of inferred order book analysis, including the inferred impact of pending orders (e.g., buy/sell walls), market sentiment, and how these support the potential for a profitable move between the identified entry and exit points.'),
      tradingStrategy: z.string().optional().describe('The suggested trading strategy including its typical duration (e.g., "Scalping (minutes to few hours) for 15m/30m/1h", "Day Trade (intra-day, up to 24h) for 4h/12h/24h", "Swing Trade (days to weeks) for 7d/30d") appropriate for the selected_time_frame and analysis. This strategy must clearly align with the profit-maximizing entry/exit prices and the technical conditions that validate them.'),
      riskManagementNotes: z.string().optional().describe('Key risk management considerations for the trade, such as suggested stop-loss principles, position sizing advice, or volatility warnings, while still prioritizing the profit maximization goal.'),
      timeFrameAnalysisContext: z.string().optional().describe("A brief explanation of what the 'selected_time_frame' (e.g., 15m, 4h, 7d) typically indicates for traders and how it influenced this specific profit-focused analysis."),
      demandZone: z.string().optional().describe('The identified demand zone (price range) where buying pressure is expected to be strong, representing a potentially optimal entry area.'),
      supplyZone: z.string().optional().describe('The identified supply zone (price range) where selling pressure is expected to be strong, often a resistance area, representing a potentially optimal exit/profit-taking area.'),
    })
  ).describe('A list of trading recommendations for the specified crypto coins, focused on maximizing profit potential.'),
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
  prompt: `You are an expert AI crypto trading analyst. Your PRIMARY GOAL is to identify trading opportunities that MAXIMIZE POTENTIAL PROFIT for the user within their 'selected_time_frame'.
You have been provided with market data for several cryptocurrencies. The 'selected_time_frame' field in the input indicates the user's desired analysis perspective (e.g., '15m', '1h', '4h', '24h', '7d'). The 'price_change_percentage_in_selected_timeframe' field provides a price change metric, which may correspond to a standard interval (like 1h or 24h) that is the closest available to the user's selected_time_frame if the user chose a more granular view (e.g., '15m' analysis might use 1h price change data).

Your primary task is to perform the analysis focused on maximizing profit, based on the user's 'selected_time_frame'. Your strategies, entry/exit points, demand/supply zones, and overall reasoning must be geared towards capturing the most significant profitable moves.
Do not attempt to fetch external data; use only the data provided below for current prices and market stats. You do not have access to live, granular order book data, so any order book analysis must be an inference based on general market principles and the provided statistics.

Analyze the following coins:
{{#each coinsData}}
Coin Details:
- ID (Slug): {{{id}}}
- Symbol: {{{symbol}}}
- Name: {{{name}}}
- Current Price (USD): {{#if current_price}}{{current_price}}{{else}}N/A{{/if}}
- Market Cap (USD): {{#if market_cap}}{{market_cap}}{{else}}N/A{{/if}}
- 24h Volume (USD): {{#if total_volume}}{{total_volume}}{{else}}N/A{{/if}}
- Price Change (for data point): {{#if price_change_percentage_in_selected_timeframe}}{{price_change_percentage_in_selected_timeframe}}%{{else}}N/A{{/if}} (Note: this % change might be for a broader interval like 1h or 24h if selected_time_frame is more granular)
- User's Selected Analysis Time Frame: {{{selected_time_frame}}} (This is the key timeframe for your profit-focused analysis)
---
{{/each}}

For each coin, provide a professional-level trading analysis with a STRONG EMPHASIS ON PROFIT MAXIMIZATION:
1.  'coin': The ticker symbol (e.g., BTC, ETH). This MUST match the 'symbol' from the input for that coin.
2.  'coinName': The full name of the coin (e.g., Bitcoin, Ethereum). This MUST match the 'name' from the input for that coin.
3.  'currentPrice': The current market price provided in the input.
4.  'entryPrice': Your recommended entry price. This price should be strategically chosen near significant support levels or identified 'demandZone' to offer the best possible entry for a substantial upward move. It should be a point where you anticipate strong buying interest that could initiate a profitable rally.
5.  'exitPrice': Your recommended exit price. This price MUST be primarily determined by identifying key resistance levels or strong 'supplyZone'. Aim to set this price to capture the majority of the anticipated price swing, maximizing profit before significant selling pressure emerges.
6.  'signal': A clear trading signal: "Buy", "Sell", or "Hold". A "Buy" signal should target a highly profitable entry. A "Sell" signal can indicate a bearish outlook OR an optimal point for profit-taking from a previous "Buy" position. Critically evaluate all three possibilities.
7.  'confidenceLevel': Your confidence ("High", "Medium", "Low") in this recommendation's ability to achieve the targeted profit.
8.  'technicalIndicators': A list of 3-5 key technical indicators or chart patterns. CRUCIALLY, explain how these specific indicators validate your recommended 'entryPrice' (e.g., confirming strong support/demand for a profitable entry opportunity) and 'exitPrice' (e.g., confirming strong resistance/supply for optimal profit-taking). The indicators should point towards a significant, profitable trade setup.
9.  'orderBookAnalysis': A brief summary of INFERRED order book dynamics or market sentiment. Explain how INFERRED pending orders (e.g., buy/sell walls at key psychological levels or prior support/resistance) support the potential for a profitable move between your chosen 'entryPrice' and 'exitPrice'.
10. 'tradingStrategy': Based on the user's 'selected_time_frame' and your profit-focused analysis, suggest an appropriate trading strategy. This strategy description MUST include a typical holding period relevant to the 'selected_time_frame' and clearly explain how it aims to achieve maximum profit using the identified entry/exit points. Examples: "Aggressive Scalping for Max Profit (minutes up to an hour)" for 15m/30m; "Targeted Intraday Profit Capture (few hours)" for 1h; etc.
11. 'riskManagementNotes': Provide concise risk management advice. While the goal is profit maximization, mention how traders might protect capital (e.g., stop-loss near entry invalidation points).
12. 'timeFrameAnalysisContext': Briefly explain what the user's 'selected_time_frame' typically implies for traders targeting maximum profit. Then, state how this specific 'selected_time_frame' has influenced your selection of aggressive entry/exit targets and strategy.
13. 'demandZone': (Optional) Identify and describe a key demand zone (price range) where buying interest is likely to be very strong, representing an optimal entry area for a significant rally.
14. 'supplyZone': (Optional) Identify and describe a key supply zone (price range) where selling interest is likely to be very strong, acting as significant resistance and representing an optimal exit/profit-taking area.

Format your entire response as a single JSON object matching the output schema, containing a 'tradingRecommendations' array.
Ensure all fields are populated as required by the schema; optional fields can be omitted if not applicable but provide them if relevant to profit maximization.
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
    const validatedRecommendations = output.tradingRecommendations.map(rec => {
        const originalCoinData = input.coinsData.find(
          cd => cd.symbol.toLowerCase() === rec.coin.toLowerCase() || cd.name.toLowerCase() === rec.coinName.toLowerCase()
        );
        return {
            ...rec,
            currentPrice: originalCoinData?.current_price ?? rec.currentPrice ?? null,
            coinName: originalCoinData?.name ?? rec.coinName,
            tradingStrategy: rec.tradingStrategy || "N/A",
            riskManagementNotes: rec.riskManagementNotes || "N/A",
            timeFrameAnalysisContext: rec.timeFrameAnalysisContext || `Analysis based on ${originalCoinData?.selected_time_frame || 'selected time frame'}.`,
            demandZone: rec.demandZone, // Pass through if provided
            supplyZone: rec.supplyZone, // Pass through if provided
        };
    });

    return { tradingRecommendations: validatedRecommendations };
  }
);

