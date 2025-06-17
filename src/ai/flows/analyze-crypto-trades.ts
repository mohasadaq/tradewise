'use server';

/**
 * @fileOverview Analyzes crypto coins using technical analysis and order book data to recommend coins for trading, including entry and exit prices.
 *
 * - analyzeCryptoTrades - A function that analyzes crypto coins and provides trading recommendations.
 * - AnalyzeCryptoTradesInput - The input type for the analyzeCryptoTrades function.
 * - AnalyzeCryptoTradesOutput - The return type for the analyzeCryptoTrades function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCryptoTradesInputSchema = z.object({
  coinList: z
    .string()
    .describe(
      'A list of crypto coins to analyze, separated by commas (e.g., BTC,ETH,XRP).'
    ),
});
export type AnalyzeCryptoTradesInput = z.infer<typeof AnalyzeCryptoTradesInputSchema>;

const AnalyzeCryptoTradesOutputSchema = z.object({
  tradingRecommendations: z.array(
    z.object({
      coin: z.string().describe('The ticker symbol of the recommended coin.'),
      currentPrice: z.number().describe('The current market price of the coin.'),
      entryPrice: z.number().describe('The recommended entry price for the coin.'),
      exitPrice: z.number().describe('The recommended exit price for the coin.'),
      signal: z.string().describe('The trading signal (Buy, Sell, or Hold).'),
      confidenceLevel: z
        .string()
        .describe('The confidence level of the recommendation (High, Medium, Low).'),
      technicalIndicators: z
        .array(z.string())
        .describe('Key technical indicators supporting the recommendation.'),
      orderBookAnalysis: z.string().describe('Summary of order book analysis.'),
    })
  ).describe('A list of trading recommendations for the specified crypto coins.'),
});
export type AnalyzeCryptoTradesOutput = z.infer<typeof AnalyzeCryptoTradesOutputSchema>;

export async function analyzeCryptoTrades(input: AnalyzeCryptoTradesInput): Promise<AnalyzeCryptoTradesOutput> {
  return analyzeCryptoTradesFlow(input);
}

const analyzeCryptoTradesPrompt = ai.definePrompt({
  name: 'analyzeCryptoTradesPrompt',
  input: {schema: AnalyzeCryptoTradesInputSchema},
  output: {schema: AnalyzeCryptoTradesOutputSchema},
  prompt: `You are an AI-powered crypto trading analyst. Analyze the following crypto coins based on technical analysis and order book data to provide trading recommendations. For each coin, include its current price, recommended entry price, recommended exit price, a trading signal (Buy, Sell, or Hold), a confidence level (High, Medium, Low), a list of key technical indicators supporting the recommendation, and a summary of the order book analysis.\n\nCoins to analyze: {{{coinList}}}\n\nFormat your response as a JSON array of trading recommendations. Each object in the array should contain the coin ticker, current price, recommended entry price, recommended exit price, signal, confidence level, technical indicators, and order book analysis.`,
});

const analyzeCryptoTradesFlow = ai.defineFlow(
  {
    name: 'analyzeCryptoTradesFlow',
    inputSchema: AnalyzeCryptoTradesInputSchema,
    outputSchema: AnalyzeCryptoTradesOutputSchema,
  },
  async input => {
    const {output} = await analyzeCryptoTradesPrompt(input);
    return output!;
  }
);
