
'use server';

/**
 * @fileOverview Analyzes crypto coins using technical analysis and provided market data to recommend coins for trading, including entry and exit prices, a trading signal, a suggested trading strategy, and risk management advice.
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
        .describe('Key technical indicators supporting the recommendation (e.g., RSI, MACD crossover, Bollinger Bands). These should consider the selected_time_frame and clearly justify the entry/exit prices.'),
      orderBookAnalysis: z.string().describe('Summary of inferred order book analysis or market sentiment, which should also contribute to justifying the entry/exit points.'),
      tradingStrategy: z.string().optional().describe('The suggested trading strategy including its typical duration (e.g., "Day Trade (intra-day, up to 24h)", "Swing Trade (days to weeks)") appropriate for the selected_time_frame and analysis. This strategy should clearly align with the entry/exit prices and the technical conditions that validate them.'),
      riskManagementNotes: z.string().optional().describe('Key risk management considerations for the trade, such as suggested stop-loss principles, position sizing advice, or volatility warnings. Emphasize responsible trading practices.'),
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
You have been provided with real-time market data for several cryptocurrencies, including price change percentage for a specific time frame.
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

For each coin, provide a professional-level trading analysis:
1.  'coin': The ticker symbol (e.g., BTC, ETH). This MUST match the 'symbol' from the input for that coin.
2.  'coinName': The full name of the coin (e.g., Bitcoin, Ethereum). This MUST match the 'name' from the input for that coin.
3.  'currentPrice': The current market price provided in the input.
4.  'entryPrice': Your recommended entry price, suitable for the selected_time_frame and suggested tradingStrategy.
5.  'exitPrice': Your recommended exit price, suitable for the selected_time_frame and suggested tradingStrategy.
6.  'signal': A clear trading signal: "Buy", "Sell", or "Hold". Critically evaluate all three possibilities. Provide "Sell" signals with the same rigor and justification as "Buy" or "Hold" signals when indicators suggest a bearish outlook or profit-taking opportunity. Do not shy away from "Sell" signals if the analysis supports it.
7.  'confidenceLevel': Your confidence in this recommendation: "High", "Medium", or "Low".
8.  'technicalIndicators': A list of 3-5 key technical indicators or chart patterns. Crucially, explain how these specific indicators support your recommended 'entryPrice' and 'exitPrice', and the chosen 'signal'. For example, "RSI divergence suggests potential reversal, enter on break of [level]" or "Bearish MACD crossover and break of key support [level] indicates a 'Sell' signal."
9.  'orderBookAnalysis': A brief summary of inferred order book dynamics or market sentiment. Explain how this analysis, combined with technical indicators, justifies the proposed 'entryPrice', 'exitPrice', and the overall trading signal (Buy, Sell, or Hold). Describe the market conditions (e.g., "buy on confirmation of support at [level]", "sell if momentum fades below [level]", "consider selling if price fails to break resistance at [level] and shows signs of weakness") that would validate acting on your recommendations.
10. 'tradingStrategy': Based on the 'selected_time_frame' (e.g., '1h', '24h', '7d', '30d') and your overall analysis, suggest an appropriate trading strategy. This strategy description MUST include a typical holding period or duration relevant to the selected_time_frame. Examples: "Scalping (minutes to few hours)" for 1h; "Day Trade (intra-day, up to 24h)" for 24h; "Swing Trade (days to a few weeks)" for 7d; "Longer Swing Trade / Position Entry (weeks to months)" for 30d. The strategy, its duration, and the entry/exit prices must be coherently justified by your technical and market sentiment analysis.
11. 'riskManagementNotes': Provide concise and actionable risk management advice specific to this trade. This could include principles for setting a stop-loss (e.g., "Consider a stop-loss below key support level [X] or if price drops by Y% from entry"), general advice on position sizing (e.g., "Due to observed volatility, consider a smaller position size, e.g., 1-2% of trading capital"), and any specific risks (e.g., "High correlation with BTC movements, monitor BTC price action"). Emphasize responsible trading practices like not risking more than one can afford to lose.

Format your entire response as a single JSON object matching the output schema, containing a 'tradingRecommendations' array. Each object in the array must pertain to one of the analyzed coins.
Ensure all fields in the output schema are populated, including 'tradingStrategy' and 'riskManagementNotes'. If a value cannot be determined, use null where appropriate for number fields, or a descriptive string like "N/A" for string fields if absolutely necessary.
Double-check that the 'coin' symbol and 'coinName' in your output exactly match the 'symbol' and 'name' provided in the input for each respective coin.
Your overall goal is to provide clear, actionable, well-justified, and balanced trading advice, akin to what a professional trader would offer, considering all potential signals (Buy, Sell, Hold) and the specific time frame of the analysis, including robust risk management principles.
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
    // Ensure the output structure is as expected
    const validatedRecommendations = output.tradingRecommendations.map(rec => {
        const originalCoinData = input.coinsData.find(
          cd => cd.symbol.toLowerCase() === rec.coin.toLowerCase() || cd.name.toLowerCase() === rec.coinName.toLowerCase()
        );
        return {
            ...rec,
            currentPrice: originalCoinData?.current_price ?? rec.currentPrice ?? null,
            coinName: originalCoinData?.name ?? rec.coinName, // Prioritize input name
            tradingStrategy: rec.tradingStrategy || "N/A", // Ensure tradingStrategy has a fallback
            riskManagementNotes: rec.riskManagementNotes || "N/A", // Ensure riskManagementNotes has a fallback
        };
    });

    return { tradingRecommendations: validatedRecommendations };
  }
);

