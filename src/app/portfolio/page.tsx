
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
  const [coinList, setCoinList] = useState<CoinListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarketDataLoading, setIsMarketDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadHoldings = useCallback(() => {
    const currentHoldings = getPortfolioHoldings();
    setHoldings(currentHoldings);
  }, []);

  const fetchMarketDataForHoldings = useCallback(async (currentHoldings: PortfolioHolding[]) => {
    if (currentHoldings.length === 0) {
      setEnrichedHoldings([]);
      setIsMarketDataLoading(false);
      return;
    }

    setIsMarketDataLoading(true);
    setError(null);
    try {
      const coinGeckoIds = [...new Set(currentHoldings.map(h => h.coinGeckoId))].join(',');
      if (!coinGeckoIds) {
          setEnrichedHoldings(currentHoldings.map(h => ({...h}))); // No prices if no IDs
          setIsMarketDataLoading(false);
          return;
      }

      const marketDataArray: CryptoCoinData[] = await fetchCoinData(0, coinGeckoIds, "24h"); // Using 24h for general price
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
      setError(`Failed to load market prices: ${errorMessage}`);
      toast({ title: "Market Data Error", description: `Could not fetch prices for portfolio: ${errorMessage}`, variant: "destructive" });
      // Keep existing holding data but prices might be stale or missing
      setEnrichedHoldings(currentHoldings.map(h => ({ ...h, currentPrice: undefined, currentValue: undefined, profitLoss: undefined, profitLossPercentage: undefined })));
    } finally {
      setIsMarketDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadHoldings();
    setIsLoading(true); // For initial coinList fetch
    fetchCoinList()
      .then(list => setCoinList(list))
      .catch(err => {
        console.error("Error fetching coin list for dialog:", err);
        toast({ title: "Error", description: "Could not load coin list for adding new holdings.", variant: "destructive" });
      })
      .finally(() => setIsLoading(false)); // Combined loading for initial holdings and coin list
  }, [loadHoldings, toast]);

  useEffect(() => {
    if (holdings.length > 0) {
      fetchMarketDataForHoldings(holdings);
    } else {
      setEnrichedHoldings([]); // Clear enriched holdings if no base holdings
    }
  }, [holdings, fetchMarketDataForHoldings]);


  const handleHoldingAdded = () => {
    loadHoldings(); // Reloads holdings which triggers market data fetch
    setIsAddDialogOpen(false);
    toast({ title: "Success", description: "New holding added to your portfolio." });
  };

  const handleRemoveHolding = (holdingId: string) => {
    removePortfolioHolding(holdingId);
    loadHoldings(); // Reload and re-fetch market data
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
    if (totalPortfolioCost === 0) return 0;
    return (totalProfitLoss / totalPortfolioCost) * 100;
  }, [totalProfitLoss, totalPortfolioCost]);


  if (isLoading && holdings.length === 0) { // Initial page load, fetching coin list
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
          coinList={coinList}
        >
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Holding
          </Button>
        </AddHoldingDialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {enrichedHoldings.length > 0 && (
        <PortfolioSummaryCard 
          totalValue={totalPortfolioValue}
          totalCost={totalPortfolioCost}
          totalProfitLoss={totalProfitLoss}
          totalProfitLossPercentage={totalProfitLossPercentage}
          isLoading={isMarketDataLoading}
        />
      )}

      <PortfolioTable
        holdings={enrichedHoldings}
        onRemoveHolding={handleRemoveHolding}
        isLoading={isMarketDataLoading && holdings.length > 0}
        onRefresh={() => fetchMarketDataForHoldings(holdings)}
      />

      {holdings.length === 0 && !isLoading && (
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
