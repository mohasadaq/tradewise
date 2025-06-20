
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [pageError, setPageError] = useState<string | null>(null); // For critical page errors
  const [marketDataError, setMarketDataError] = useState<string | null>(null); // For non-critical market data fetch errors
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadHoldingsFromStorage = useCallback(() => {
    const currentHoldings = getPortfolioHoldings();
    setHoldings(currentHoldings);
    // Initialize enrichedHoldings with basic data, prices will be fetched
    setEnrichedHoldings(currentHoldings.map(h => ({ ...h })));
  }, []);

  const fetchMarketDataForHoldings = useCallback(async (currentHoldings: PortfolioHolding[]) => {
    if (currentHoldings.length === 0) {
      setEnrichedHoldings([]); // Ensure enrichedHoldings is empty if holdings are empty
      setIsMarketDataLoading(false);
      return;
    }

    setIsMarketDataLoading(true);
    setMarketDataError(null);
    try {
      const coinGeckoIds = [...new Set(currentHoldings.map(h => h.coinGeckoId))].join(',');
      if (!coinGeckoIds) {
          // This case should ideally not happen if currentHoldings.length > 0
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
          profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
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
      setMarketDataError(`Failed to load market prices: ${errorMessage}`);
      // Do not toast here as it might be too frequent, rely on UI error display
      // Keep existing holding data but prices might be stale or missing
      setEnrichedHoldings(currentHoldings.map(h => ({ ...h, currentPrice: undefined, currentValue: undefined, profitLoss: undefined, profitLossPercentage: undefined })));
    } finally {
      setIsMarketDataLoading(false);
    }
  }, []);

  // Load holdings from localStorage on mount
  useEffect(() => {
    loadHoldingsFromStorage();
  }, [loadHoldingsFromStorage]);

  // Fetch coin list for the dialog on mount
  useEffect(() => {
    setIsDialogCoinListLoading(true);
    fetchCoinList()
      .then(list => setCoinListForDialog(list))
      .catch(err => {
        console.error("Error fetching coin list for dialog:", err);
        setPageError("Could not load coin list. Adding new holdings might be affected.");
        toast({ title: "Error", description: "Could not load coin list for adding new holdings.", variant: "destructive" });
      })
      .finally(() => setIsDialogCoinListLoading(false));
  }, [toast]);

  // Fetch market data when holdings change
  useEffect(() => {
    if (holdings.length > 0) {
      fetchMarketDataForHoldings(holdings);
    } else {
      setEnrichedHoldings([]); // Clear enriched if no holdings
      setMarketDataError(null); // Clear market data error if no holdings
    }
  }, [holdings, fetchMarketDataForHoldings]);


  const handleHoldingAdded = () => {
    loadHoldingsFromStorage(); // Reloads holdings which triggers market data fetch
    setIsAddDialogOpen(false);
    toast({ title: "Success", description: "New holding added to your portfolio." });
  };

  const handleRemoveHolding = (holdingId: string) => {
    removePortfolioHolding(holdingId);
    loadHoldingsFromStorage(); 
    toast({ title: "Holding Removed", description: "The holding has been removed from your portfolio." });
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
    if (totalPortfolioCost === 0 && totalPortfolioValue === 0) return 0; // No holdings or all free
    if (totalPortfolioCost === 0 && totalPortfolioValue !== 0) return Infinity; // Gained from free assets
    return (totalProfitLoss / totalPortfolioCost) * 100;
  }, [totalProfitLoss, totalPortfolioCost, totalPortfolioValue]);

  // Overall loading state for the entire page structure (not data within table)
  // This is true if we don't even have basic holdings from storage yet.
  const isPageStructureLoading = holdings.length === 0 && enrichedHoldings.length === 0 && isMarketDataLoading;


  if (isPageStructureLoading && !pageError) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-8 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-foreground">My Portfolio</h1>
        <AddHoldingDialog
          isOpen={isAddDialogOpen}
          setIsOpen={setIsAddDialogOpen}
          onHoldingAdded={handleHoldingAdded}
          coinList={coinListForDialog}
          triggerButton={
            <Button disabled={isDialogCoinListLoading}>
              {isDialogCoinListLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} 
              Add Holding
            </Button>
          }
        />
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
          <AlertDescription>{marketDataError} Prices might be outdated or unavailable.</AlertDescription>
        </Alert>
      )}
      
      {(holdings.length > 0 || isMarketDataLoading) && ( // Show summary if there are holdings or if we are loading market data for them
        <PortfolioSummaryCard 
          totalValue={totalPortfolioValue}
          totalCost={totalPortfolioCost}
          totalProfitLoss={totalProfitLoss}
          totalProfitLossPercentage={totalProfitLossPercentage}
          isLoading={isMarketDataLoading && holdings.length > 0} // Only show skeleton in summary if there are holdings to load prices for
        />
      )}

      <PortfolioTable
        holdings={enrichedHoldings} // Pass enriched (or basic if prices not yet loaded)
        onRemoveHolding={handleRemoveHolding}
        isLoadingMarketData={isMarketDataLoading && holdings.length > 0} // Skeleton for price cells if loading for existing holdings
        onRefresh={() => holdings.length > 0 ? fetchMarketDataForHoldings(holdings) : {}}
      />

      {holdings.length === 0 && !isMarketDataLoading && !isDialogCoinListLoading && ( // Show if no holdings and not in any loading state
         <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-center">Your Portfolio is Empty</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
                <p>Click "Add Holding" to start building your portfolio.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
