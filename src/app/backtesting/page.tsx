
"use client";

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BacktestConfigurationForm, { type BacktestConfigFormData } from '@/components/backtesting/BacktestConfigurationForm';
import BacktestResultsDisplay from '@/components/backtesting/BacktestResultsDisplay';
import type { CoinListItem, HistoricalPricePoint } from '@/services/crypto-data-service';
import { fetchCoinList, fetchHistoricalCoinData } from '@/services/crypto-data-service';
import { runMACrossoverBacktest } from '@/services/backtesting-service';
import type { BacktestResult, BacktestConfiguration } from '@/types/backtesting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BacktestingPage() {
  const [coinList, setCoinList] = useState<CoinListItem[]>([]);
  const [isCoinListLoading, setIsCoinListLoading] = useState(true);
  const [isBacktestRunning, setIsBacktestRunning] = useState(false);
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Store submitted config to re-populate form or re-run easily
  const [lastConfig, setLastConfig] = useState<BacktestConfigFormData | undefined>(undefined);


  useEffect(() => {
    async function loadCoinList() {
      setIsCoinListLoading(true);
      try {
        const list = await fetchCoinList();
        setCoinList(list);
      } catch (err) {
        console.error("Error fetching coin list for backtesting:", err);
        toast({
          title: "Error Fetching Coins",
          description: err instanceof Error ? err.message : "Could not load coin list. Please try refreshing.",
          variant: "destructive",
        });
        setBacktestError("Could not load coin list. Backtesting is unavailable.");
      } finally {
        setIsCoinListLoading(false);
      }
    }
    if (coinList.length === 0) {
        loadCoinList();
    } else {
        setIsCoinListLoading(false);
    }
  }, [toast, coinList.length]);

  const handleRunBacktest = useCallback(async (config: BacktestConfiguration) => {
    setIsBacktestRunning(true);
    setBacktestError(null);
    setBacktestResults(null);
    setLastConfig(config); // Save the config

    const selectedCoin = coinList.find(c => c.id === config.coinGeckoId);
    if (!selectedCoin) {
      setBacktestError("Selected coin details not found.");
      setIsBacktestRunning(false);
      return;
    }

    try {
      toast({ title: "Fetching Historical Data...", description: `For ${selectedCoin.name}, this may take a moment.`});
      const historicalData: HistoricalPricePoint[] = await fetchHistoricalCoinData(
        config.coinGeckoId,
        config.startDate,
        config.endDate
      );

      if (historicalData.length === 0) {
        throw new Error("No historical data found for the selected coin and date range.");
      }
      
      toast({ title: "Running Backtest...", description: `Simulating MA Crossover strategy for ${selectedCoin.name}.`});
      const results = runMACrossoverBacktest(config, historicalData);
      setBacktestResults(results);
      toast({ title: "Backtest Complete!", description: `Results for ${selectedCoin.name} are now displayed.`});

    } catch (err) {
      console.error("Error during backtest:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during the backtest.";
      setBacktestError(errorMessage);
      toast({
        title: "Backtest Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsBacktestRunning(false);
    }
  }, [coinList, toast]);


  return (
    <div className="flex flex-col min-h-[calc(100vh_-_var(--header-height)_-_var(--footer-height))]">
      <main className="flex-grow container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Crypto Backtesting</h1>
          <p className="text-muted-foreground">
            Test your trading strategies against historical market data. Currently supports MA Crossover.
          </p>
        </div>

        {isCoinListLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Loading coin data for configuration...</p>
          </div>
        )}

        {!isCoinListLoading && coinList.length > 0 && (
          <BacktestConfigurationForm
            coinList={coinList}
            onSubmit={handleRunBacktest}
            isLoading={isBacktestRunning}
            defaultValues={lastConfig} 
          />
        )}
        
        {!isCoinListLoading && coinList.length === 0 && !backtestError && (
             <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Coin List Unavailable</AlertTitle>
                <AlertDescription>
                    Could not load the list of cryptocurrencies. Please ensure you have an internet connection and try refreshing the page.
                </AlertDescription>
            </Alert>
        )}


        {isBacktestRunning && !backtestResults && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Backtest in Progress...</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Fetching data and simulating strategy. Please wait.</p>
            </CardContent>
          </Card>
        )}

        {backtestError && !isBacktestRunning && (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Backtest Error</AlertTitle>
            <AlertDescription>{backtestError}</AlertDescription>
          </Alert>
        )}

        {backtestResults && !isBacktestRunning && (
          <BacktestResultsDisplay 
            results={backtestResults} 
            coinSymbol={coinList.find(c => c.id === backtestResults.config.coinGeckoId)?.symbol || 'N/A'}
          />
        )}
         {!isCoinListLoading && !isBacktestRunning && !backtestResults && !backtestError && coinList.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-center">Configure Your Backtest</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              <p>Select a coin, date range, initial capital, and strategy parameters above to run a new backtest.</p>
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="py-3 mt-auto text-center text-xs sm:text-sm text-muted-foreground border-t border-border/50">
        Backtesting results are for informational purposes only and do not guarantee future performance.
      </footer>
    </div>
  );
}
