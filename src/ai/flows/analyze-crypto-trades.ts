
'use server';

/**
 * @fileOverview Analyzes crypto coins using technical analysis and provided market data to recommend coins for trading, including entry and exit prices, a trading signal, a suggested trading strategy, and risk management advice.
 * Considers a specific time frame for price change analysis.
 * Identifies demand/supply zones and bases exit prices on resistance levels.
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
      entryPrice: z.number().nullable().describe('The recommended entry price for the coin, potentially near a demand zone.'),
      exitPrice: z.number().nullable().describe('The recommended exit price for the coin, ideally based on identified resistance levels and supply zones.'),
      signal: z.string().describe('The trading signal (Buy, Sell, or Hold).'),
      confidenceLevel: z
        .string()
        .describe('The confidence level of the recommendation (High, Medium, Low).'),
      technicalIndicators: z
        .array(z.string())
        .describe('Key technical indicators (e.g., RSI, MACD, Bollinger Bands, Fibonacci levels) supporting the recommendation. Explain how these align with demand/supply zones, resistance levels, and justify entry/exit prices.'),
      orderBookAnalysis: z.string().describe('Summary of inferred order book analysis, including the inferred impact of pending orders (e.g., buy/sell walls), market sentiment, and how these justify entry/exit points. Note: Actual order book data is not provided; this should be an inference based on general market principles and provided stats.'),
      tradingStrategy: z.string().optional().describe('The suggested trading strategy including its typical duration (e.g., "Scalping (minutes to few hours) for 15m/30m/1h", "Day Trade (intra-day, up to 24h) for 4h/12h/24h", "Swing Trade (days to weeks) for 7d/30d") appropriate for the selected_time_frame and analysis. This strategy should clearly align with the entry/exit prices and the technical conditions that validate them.'),
      riskManagementNotes: z.string().optional().describe('Key risk management considerations for the trade, such as suggested stop-loss principles, position sizing advice, or volatility warnings. Emphasize responsible trading practices.'),
      timeFrameAnalysisContext: z.string().optional().describe("A brief explanation of what the 'selected_time_frame' (e.g., 15m, 4h, 7d) typically indicates for traders and how it influenced this specific analysis."),
      demandZone: z.string().optional().describe('The identified demand zone (price range) where buying pressure is expected to be strong, potentially supported by technical indicators.'),
      supplyZone: z.string().optional().describe('The identified supply zone (price range) where selling pressure is expected to be strong, often a resistance area, potentially supported by technical indicators.'),
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
  prompt: `You are an expert AI crypto trading analyst, acting with the insight and conciseness of a seasoned professional trader. Your analysis must be insightful, actionable, and clearly justified.
You have been provided with market data for several cryptocurrencies. The 'selected_time_frame' field in the input indicates the user's desired analysis perspective (e.g., '15m', '1h', '4h', '24h', '7d'). The 'price_change_percentage_in_selected_timeframe' field provides a price change metric, which may correspond to a standard interval (like 1h or 24h) that is the closest available to the user's selected_time_frame if the user chose a more granular view (e.g., '15m' analysis might use 1h price change data).

Your primary task is to perform the analysis based on the user's 'selected_time_frame'. Your strategies, entry/exit points, demand/supply zones, and overall reasoning must be appropriate for this user-selected duration.
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
- User's Selected Analysis Time Frame: {{{selected_time_frame}}} (This is the key timeframe for your analysis focus)
---
{{/each}}

For each coin, provide a professional-level trading analysis:
1.  'coin': The ticker symbol (e.g., BTC, ETH). This MUST match the 'symbol' from the input for that coin.
2.  'coinName': The full name of the coin (e.g., Bitcoin, Ethereum). This MUST match the 'name' from the input for that coin.
3.  'currentPrice': The current market price provided in the input.
4.  'entryPrice': Your recommended entry price, suitable for the user's 'selected_time_frame' and suggested tradingStrategy. Consider if this aligns with an identified demand zone.
5.  'exitPrice': Your recommended exit price. This price MUST be primarily determined by identifying key resistance levels or strong supply zones, appropriate for the 'selected_time_frame' and suggested tradingStrategy.
6.  'signal': A clear trading signal: "Buy", "Sell", or "Hold". Critically evaluate all three possibilities. Provide "Sell" signals with the same rigor and justification as "Buy" or "Hold" signals when indicators suggest a bearish outlook or profit-taking opportunity. Do not shy away from "Sell" signals if the analysis supports it.
7.  'confidenceLevel': Your confidence in this recommendation: "High", "Medium", or "Low".
8.  'technicalIndicators': A list of 3-5 key technical indicators or chart patterns (e.g., RSI, MACD, Bollinger Bands, Fibonacci retracements/extensions, support/resistance lines). Crucially, explain how these specific indicators support your recommended 'entryPrice', 'exitPrice' (especially how they confirm resistance for exit), the identified 'demandZone' and 'supplyZone', and the chosen 'signal', all within the context of the user's 'selected_time_frame'.
9.  'orderBookAnalysis': A brief summary of INFERRED order book dynamics or market sentiment. Explain the potential impact of INFERRED pending orders (e.g., buy/sell walls at certain psychological price levels or prior support/resistance) and how this analysis, combined with technical indicators, justifies the proposed 'entryPrice', 'exitPrice', and the overall trading signal, considering the user's 'selected_time_frame'.
10. 'tradingStrategy': Based on the user's 'selected_time_frame' and your overall analysis, suggest an appropriate trading strategy. This strategy description MUST include a typical holding period or duration relevant to the 'selected_time_frame'. Examples: "Scalping (minutes up to an hour)" for 15m/30m; "Short-term Intraday (few hours)" for 1h; "Intraday / Short Swing (several hours to a day)" for 4h/12h; "Day Trade / Swing Entry (1-3 days)" for 24h; "Swing Trade (days to a few weeks)" for 7d; "Longer Swing / Position Entry (weeks to months)" for 30d. The strategy, its duration, and the entry/exit prices must be coherently justified.
11. 'riskManagementNotes': Provide concise and actionable risk management advice specific to this trade and the 'selected_time_frame'.
12. 'timeFrameAnalysisContext': Briefly explain what the user's 'selected_time_frame' typically indicates for traders (e.g., "A 15-minute time frame is often used for scalping..."). Then, state how this specific 'selected_time_frame' has influenced your analysis for this coin, particularly regarding the choice of indicators, strategy, and price targets.
13. 'demandZone': (Optional) Identify and describe a key demand zone as a price range (e.g., "$40,000 - $40,500") where buying interest is likely to be strong, potentially halting a downtrend or initiating an uptrend. Explain what suggests this zone (e.g., previous support, Fibonacci level, high volume cluster).
14. 'supplyZone': (Optional) Identify and describe a key supply zone as a price range (e.g., "$48,000 - $48,500") where selling interest is likely to be strong, acting as resistance. This zone is critical for determining potential exit points. Explain what suggests this zone (e.g., previous resistance, Fibonacci level, high volume cluster).

Format your entire response as a single JSON object matching the output schema, containing a 'tradingRecommendations' array.
Ensure all fields are populated as required by the schema; optional fields can be omitted if not applicable but provide them if relevant.
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

