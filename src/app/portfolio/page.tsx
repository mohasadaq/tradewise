
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddHoldingDialog from '@/components/portfolio/AddHoldingDialog';
import PortfolioTable from '@/components/portfolio/PortfolioTable';
import PortfolioSummaryCard from '@/components/portfolio/PortfolioSummaryCard';
import type { PortfolioHolding, EnrichedPortfolioHolding } from '@/types/portfolio';
import type { CoinListItem, CryptoCoinData } from '@/services/crypto-data-service';
import { getPortfolioHoldings, removePortfolioHolding } from '@/services/portfolio-service';
import { fetchCoinList, fetchCoinData } from '@/services/crypto-data-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [enrichedHoldings, setEnrichedHoldings] = useState<EnrichedPortfolioHolding[]>([]);
  const [coinListForDialog, setCoinListForDialog] = useState<CoinListItem[]>([]);
  
  const [isMarketDataLoading, setIsMarketDataLoading] = useState(false);
  const [isDialogCoinListLoading, setIsDialogCoinListLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [marketDataError, setMarketDataError] = useState<string | null>(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadHoldingsFromStorage = useCallback(() => {
    const currentHoldings = getPortfolioHoldings();
    setHoldings(currentHoldings);
    setEnrichedHoldings(currentHoldings.map(h => ({ ...h })));
  }, []);

  const fetchMarketDataForHoldings = useCallback(async (currentHoldings: PortfolioHolding[]) => {
    if (currentHoldings.length === 0) {
      setEnrichedHoldings([]);
      setIsMarketDataLoading(false);
      return;
    }

    setIsMarketDataLoading(true);
    setMarketDataError(null);
    try {
      const coinGeckoIds = [...new Set(currentHoldings.map(h => h.coinGeckoId))].join(',');
      if (!coinGeckoIds) {
          setEnrichedHoldings(currentHoldings.map(h => ({...h}))); 
          setIsMarketDataLoading(false);
          return;
      }

      const marketDataArray: CryptoCoinData[] = await fetchCoinData(0, coinGeckoIds, "24h"); 
      const marketDataMap = new Map(marketDataArray.map(md => [md.id, md]));

      const newEnrichedHoldings = currentHoldings.map(holding => {
        const marketData = marketDataMap.get(holding.coinGeckoId);
        const currentPrice = marketData?.current_price;
        const totalCost = holding.quantity * holding.purchasePrice;
        let currentValue, profitLoss, profitLossPercentage;

        if (typeof currentPrice === 'number') {
          currentValue = holding.quantity * currentPrice;
          profitLoss = currentValue - totalCost;
          profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : (currentValue > 0 ? Infinity : 0) ;
        }
        return {
          ...holding,
          currentPrice,
          currentValue,
          totalCost,
          profitLoss,
          profitLossPercentage,
        };
      });
      setEnrichedHoldings(newEnrichedHoldings);
    } catch (err) {
      console.error("Error fetching market data for portfolio:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error fetching market data.";
      setMarketDataError(`Failed to load market prices: ${errorMessage}. Prices might be outdated or unavailable.`);
      setEnrichedHoldings(currentHoldings.map(h => ({ ...h, currentPrice: undefined, currentValue: undefined, profitLoss: undefined, profitLossPercentage: undefined })));
    } finally {
      setIsMarketDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHoldingsFromStorage();
  }, [loadHoldingsFromStorage]);

  useEffect(() => {
    if (coinListForDialog.length === 0 && !isDialogCoinListLoading) {
      setIsDialogCoinListLoading(true);
      fetchCoinList()
        .then(list => setCoinListForDialog(list))
        .catch(err => {
          console.error("Error fetching coin list for dialog:", err);
          setPageError("Could not load coin list. Adding new holdings via the generic dialog might be affected.");
          toast({ title: "Error", description: "Could not load coin list for adding new holdings.", variant: "destructive" });
        })
        .finally(() => setIsDialogCoinListLoading(false));
    }
  }, [coinListForDialog.length, toast, isDialogCoinListLoading]);

  useEffect(() => {
    if (holdings.length > 0) {
      fetchMarketDataForHoldings(holdings);
    } else {
      setEnrichedHoldings([]); 
      setMarketDataError(null); 
    }
  }, [holdings, fetchMarketDataForHoldings]);


  const handleHoldingAdded = () => {
    loadHoldingsFromStorage(); 
    setIsAddDialogOpen(false);
  };

  const handleRemoveHolding = (holdingId: string) => {
    removePortfolioHolding(holdingId);
    loadHoldingsFromStorage(); 
    toast({ title: "Holding Removed", description: "The holding has been removed from your portfolio.", variant: "default" });
  };
  
  const totalPortfolioValue = useMemo(() => 
    enrichedHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0), 
    [enrichedHoldings]
  );

  const totalPortfolioCost = useMemo(() =>
    enrichedHoldings.reduce((sum, h) => sum + (h.totalCost || 0), 0),
    [enrichedHoldings]
  );

  const totalProfitLoss = useMemo(() =>
    totalPortfolioValue - totalPortfolioCost,
    [totalPortfolioValue, totalPortfolioCost]
  );
  
  const totalProfitLossPercentage = useMemo(() => {
    if (totalPortfolioCost === 0) {
        return totalPortfolioValue > 0 ? Infinity : 0;
    }
    return (totalProfitLoss / totalPortfolioCost) * 100;
  }, [totalProfitLoss, totalPortfolioCost, totalPortfolioValue]);

  const isPageStructureLoading = holdings.length === 0 && enrichedHoldings.length === 0 && isMarketDataLoading;


  if (isPageStructureLoading && !pageError) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh_-_var(--header-height)_-_var(--footer-height))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh_-_var(--header-height)_-_var(--footer-height))]">
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Portfolio</h1>
          {/* AddHoldingDialog is now triggered by individual coin actions from dashboard, or contextually if needed elsewhere. 
              This button is removed as per user request to avoid confusion with the per-coin add buttons. 
              If a general "Add Holding" button is needed on this page later, it can be re-added here.
          <AddHoldingDialog
            isOpen={isAddDialogOpen}
            setIsOpen={setIsAddDialogOpen}
            onHoldingAdded={handleHoldingAdded}
            coinList={coinListForDialog} 
          /> 
          */}
        </div>

        {pageError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Page Error</AlertTitle>
            <AlertDescription>{pageError}</AlertDescription>
          </Alert>
        )}
        
        {marketDataError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Market Data Error</AlertTitle>
            <AlertDescription>{marketDataError}</AlertDescription>
          </Alert>
        )}
        
        {(holdings.length > 0 || isMarketDataLoading) && (
          <PortfolioSummaryCard 
            totalValue={totalPortfolioValue}
            totalCost={totalPortfolioCost}
            totalProfitLoss={totalProfitLoss}
            totalProfitLossPercentage={totalProfitLossPercentage}
            isLoading={isMarketDataLoading && holdings.length > 0} 
          />
        )}

        <PortfolioTable
          holdings={enrichedHoldings} 
          onRemoveHolding={handleRemoveHolding}
          isLoadingMarketData={isMarketDataLoading && holdings.length > 0} 
          onRefresh={() => holdings.length > 0 ? fetchMarketDataForHoldings(holdings) : {}}
        />

        {holdings.length === 0 && !isMarketDataLoading && !isDialogCoinListLoading && (
           <Card className="mt-6">
              <CardHeader>
                  <CardTitle className="text-center">Your Portfolio is Empty</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                  <p>Add holdings from the Dashboard page by clicking the '+' icon next to an analyzed coin.</p>
              </CardContent>
          </Card>
        )}
      </main>
      <footer className="py-3 mt-auto text-center text-xs sm:text-sm text-muted-foreground border-t border-border/50">
        Portfolio data is stored locally in your browser.
      </footer>
    </div>
  );
}
