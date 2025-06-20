
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import BacktestConfigurationForm, { type BacktestConfigFormDataForAI } from './BacktestConfigurationForm'; // Updated import
import BacktestResultsDisplay from './BacktestResultsDisplay';
import type { BacktestResult, BacktestConfiguration } from '@/types/backtesting';
import type { TimeFrame } from '../FilterSortControls';
import type { TradingRecommendation } from '@/app/page'; // Assuming TradingRecommendation is exported or define a similar type here
import { Alert, AlertDescription } from "@/components/ui/alert";


interface BacktestingModalProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  coin: { 
    id: string; 
    name: string; 
    symbol: string; 
    analysisTimeFrame?: TimeFrame;
    aiSignal?: TradingRecommendation['signal'];
    aiEntryPrice?: TradingRecommendation['entryPrice'];
    aiExitPrice?: TradingRecommendation['exitPrice'];
  };
  onRunBacktest: (config: Omit<BacktestConfiguration, 'coinGeckoId' | 'aiSignal' | 'aiEntryPrice' | 'aiExitPrice'>) => Promise<void>;
  results: BacktestResult | null;
  isLoading: boolean; 
  error: string | null;
}

export default function BacktestingModal({
  isOpen,
  setIsOpen,
  coin,
  onRunBacktest,
  results,
  isLoading,
  error,
}: BacktestingModalProps) {

  const handleConfigSubmit = (data: BacktestConfigFormDataForAI) => { // Use new form data type
    // coinGeckoId, aiSignal, aiEntryPrice, aiExitPrice will be added by the parent (page.tsx)
    // before calling the actual backtesting service.
    // The form now only submits startDate, endDate, initialCapital.
    onRunBacktest(data);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Backtest AI Recommendation: {coin.name} ({coin.symbol})</DialogTitle>
          <DialogDescription>
            Configure date range and capital to backtest the AI's specific recommendation for {coin.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto py-4 pr-2 space-y-6">
          {!results && !isLoading && ( 
            <BacktestConfigurationForm
                onSubmit={handleConfigSubmit}
                isLoading={isLoading}
                initialCoin={coin} // Pass the coin with AI parameters
            />
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Running backtest for {coin.name}...</p>
              <p className="text-xs text-muted-foreground">Fetching data and simulating AI strategy. Please wait.</p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <DialogTitle>Backtest Error</DialogTitle> {/* Use DialogTitle from shadcn if appropriate */}
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && !isLoading && !error && (
            <BacktestResultsDisplay results={results} coinSymbol={coin.symbol} />
          )}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
            {/* 
              The "Re-configure" button logic might need adjustment. 
              If we want to truly re-configure (e.g. change dates for the *same* AI recommendation),
              we need a way to clear `results` and `error` without closing the modal.
              For now, closing and re-opening achieves this.
            */}
            {results && ( 
                 <Button variant="outline" onClick={() => {
                    // This would typically involve resetting `results` and `error` in the parent (page.tsx)
                    // to show the form again. For now, closing and re-opening works.
                    // To allow immediate re-run without closing, parent would need a reset function.
                    // Or, simply let user close and reopen.
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
