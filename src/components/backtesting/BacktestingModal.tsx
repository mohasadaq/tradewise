
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

interface BacktestingModalProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  coin: { id: string; name: string; symbol: string };
  coinList: CoinListItem[]; // For the form, though selection will be disabled
  onRunBacktest: (config: BacktestConfiguration) => Promise<void>;
  results: BacktestResult | null;
  isLoading: boolean; // Is the backtest currently running?
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
    // The coinGeckoId from form data should match coin.id
    const config: BacktestConfiguration = {
        ...data,
        coinGeckoId: coin.id, // Ensure the correct coin ID is used
    };
    onRunBacktest(config);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Parent component (TradeWisePage) will handle resetting results/errors when isOpen becomes false
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
          {!results && !isLoading && ( // Show form if no results and not loading new results
            <BacktestConfigurationForm
                coinList={coinList}
                onSubmit={handleConfigSubmit}
                isLoading={isLoading}
                initialCoin={coin}
                // defaultValues could be passed if we want to retain form state across modal closes for the same coin
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
              <DialogTitle>Backtest Error</DialogTitle> {/* Using DialogTitle for styling consistency inside modal */}
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && !isLoading && !error && (
            <BacktestResultsDisplay results={results} coinSymbol={coin.symbol} />
          )}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
            {results && ( // Show a "Run New" button if results are displayed
                 <Button variant="outline" onClick={() => { /* Logic to reset view to form */
                    // This will be handled by parent resetting results when modal closes and reopens, or specific state here
                    // For now, rely on parent re-render: parent should clear results when this modal re-opens for new config
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
