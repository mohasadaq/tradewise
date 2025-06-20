
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import BacktestConfigurationForm, { type BacktestConfigFormData } from './BacktestConfigurationForm';
import BacktestResultsDisplay from './BacktestResultsDisplay';
import type { BacktestResult, BacktestConfiguration } from '@/types/backtesting';
import type { CoinListItem } from '@/services/crypto-data-service';
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { TimeFrame } from '../FilterSortControls';


interface BacktestingModalProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  coin: { id: string; name: string; symbol: string; analysisTimeFrame?: TimeFrame }; // Added analysisTimeFrame
  coinList: CoinListItem[]; 
  onRunBacktest: (config: BacktestConfiguration) => Promise<void>;
  results: BacktestResult | null;
  isLoading: boolean; 
  error: string | null;
}

export default function BacktestingModal({
  isOpen,
  setIsOpen,
  coin,
  coinList,
  onRunBacktest,
  results,
  isLoading,
  error,
}: BacktestingModalProps) {

  const handleConfigSubmit = (data: BacktestConfigFormData) => {
    const config: BacktestConfiguration = {
        ...data,
        coinGeckoId: coin.id, 
    };
    onRunBacktest(config);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Backtest Strategy: {coin.name} ({coin.symbol})</DialogTitle>
          <DialogDescription>
            Configure and run a Moving Average Crossover backtest for {coin.name}. Results are informational.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto py-4 pr-2 space-y-6">
          {!results && !isLoading && ( 
            <BacktestConfigurationForm
                coinList={coinList}
                onSubmit={handleConfigSubmit}
                isLoading={isLoading}
                initialCoin={coin} // Pass the whole coin object including analysisTimeFrame
            />
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Running backtest for {coin.name}...</p>
              <p className="text-xs text-muted-foreground">Fetching data and simulating strategy. Please wait.</p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <DialogTitle>Backtest Error</DialogTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && !isLoading && !error && (
            <BacktestResultsDisplay results={results} coinSymbol={coin.symbol} />
          )}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
            {results && ( 
                 <Button variant="outline" onClick={() => { 
                    // To re-run, we effectively need to clear results and show form again.
                    // The parent component will clear currentBacktestResults when the modal is closed and re-opened.
                    // For now, a simple "Close" will allow re-opening with a fresh form.
                 }} disabled>
                    Re-configure (Close & Re-open)
                 </Button>
            )}
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
