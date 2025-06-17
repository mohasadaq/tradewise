
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { analyzeCryptoTrades, type AnalyzeCryptoTradesOutput, type AICoinAnalysisInputData } from "@/ai/flows/analyze-crypto-trades";
import { fetchCoinData, type CryptoCoinData } from "@/services/crypto-data-service";
import TradewiseHeader from "@/components/TradewiseHeader";
import CryptoDataTable from "@/components/CryptoDataTable";
import FilterSortControls, {
  type ConfidenceFilter,
  type SortKey,
  type SortDirection,
} from "@/components/FilterSortControls";
import SkeletonTable from "@/components/SkeletonTable";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type TradingRecommendation = AnalyzeCryptoTradesOutput["tradingRecommendations"][0] & { coinName: string };

const NUMBER_OF_COINS_TO_FETCH_DEFAULT = 5; 
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export default function TradeWisePage() {
  const [recommendations, setRecommendations] = useState<TradingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState(""); // Will hold comma-separated coin symbols
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("confidenceLevel");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const performAnalysis = useCallback(async (coinSymbolsToFetch?: string, isAutoRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    let fetchToastId: string | null = null;
    if (!isAutoRefresh && !coinSymbolsToFetch) {
       fetchToastId = toast({ title: "Fetching Market Data...", description: `Analyzing top ${NUMBER_OF_COINS_TO_FETCH_DEFAULT} coins.`}).id;
    } else if (!isAutoRefresh && coinSymbolsToFetch) {
        fetchToastId = toast({ title: "Fetching Market Data...", description: `Analyzing symbols: ${coinSymbolsToFetch}`}).id;
    }

    try {
      const marketData: CryptoCoinData[] = await fetchCoinData(
        NUMBER_OF_COINS_TO_FETCH_DEFAULT,
        coinSymbolsToFetch 
      );

      if (!marketData || marketData.length === 0) {
        setRecommendations([]);
        const message = coinSymbolsToFetch ? `No market data found for the specified symbols: ${coinSymbolsToFetch}. Please check the symbols.` : "No market data found from CoinGecko for top coins.";
        setError(message);
        if (fetchToastId) {
            toast({id: fetchToastId, title: "Market Data Error", description: message, variant: "destructive" });
        } else if (!isAutoRefresh) {
            toast({ title: "Market Data Error", description: message, variant: "destructive" });
        }
        setIsLoading(false);
        return;
      }
      
      if (fetchToastId) {
        toast({id: fetchToastId, title: "Market Data Fetched", description: "Starting AI analysis..."});
      }

      const aiInputData: AICoinAnalysisInputData[] = marketData.map(md => ({
        id: md.id, 
        symbol: md.symbol,
        name: md.name,
        current_price: md.current_price,
        market_cap: md.market_cap,
        total_volume: md.total_volume,
        price_change_percentage_24h: md.price_change_percentage_24h,
      }));

      const input = { coinsData: aiInputData };
      
      const result = await analyzeCryptoTrades(input);

      if (result && result.tradingRecommendations) {
        const updatedRecommendations: TradingRecommendation[] = result.tradingRecommendations.map(rec => {
          const matchedMarketData = marketData.find(
             md => md.symbol.toLowerCase() === rec.coin.toLowerCase() || md.name.toLowerCase() === rec.coinName.toLowerCase()
          );
          return {
            ...rec,
            currentPrice: matchedMarketData?.current_price ?? rec.currentPrice,
            coinName: matchedMarketData?.name ?? rec.coinName, // Ensure coinName is populated
          };
        });
        setRecommendations(updatedRecommendations);
        setLastUpdated(new Date());
        const successMessage = `Found ${updatedRecommendations.length} recommendations for ${coinSymbolsToFetch ? `symbols: ${coinSymbolsToFetch}` : `top ${marketData.length} coins`}.`;
        if (fetchToastId) {
            toast({id: fetchToastId, title: "Analysis Complete", description: successMessage });
        } else if (!isAutoRefresh) {
            toast({ title: "Analysis Complete", description: successMessage });
        }
      } else {
        setRecommendations([]);
        setError("No recommendations found or unexpected response from AI.");
        const issueMessage = "No recommendations found or unexpected AI response.";
        if (fetchToastId) {
            toast({id: fetchToastId, title: "Analysis Issue", description: issueMessage, variant: "destructive" });
        } else if (!isAutoRefresh) {
            toast({ title: "Analysis Issue", description: issueMessage, variant: "destructive" });
        }
      }
    } catch (err) {
      console.error("Error performing analysis:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Analysis failed: ${errorMessage}`);
      setRecommendations([]);
       if (fetchToastId) {
            toast({id: fetchToastId, title: "Analysis Failed", description: `Error: ${errorMessage}`, variant: "destructive" });
        } else if (!isAutoRefresh) {
            toast({ title: "Analysis Failed", description: `Error: ${errorMessage}`, variant: "destructive" });
        }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    performAnalysis(undefined, true); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const intervalId = setInterval(() => performAnalysis(undefined, true), REFRESH_INTERVAL); 
    return () => clearInterval(intervalId);
  }, [performAnalysis]);

  const handleAnalyzeCoins = () => {
    performAnalysis(searchQuery.trim() || undefined); 
  };
  
  const handleResetFilters = () => {
    setSearchQuery("");
    setConfidenceFilter("All");
    setSortKey("confidenceLevel");
    setSortDirection("desc");
    performAnalysis(undefined); 
  };

  const filteredAndSortedRecommendations = useMemo(() => {
    let filtered = [...recommendations];
    
    // Confidence filter is still client-side after data is fetched by API based on search query or top N
    if (confidenceFilter !== "All") {
      filtered = filtered.filter(
        (rec) => rec.confidenceLevel.toLowerCase() === confidenceFilter.toLowerCase()
      );
    }

    const confidenceOrder: { [key: string]: number } = { high: 0, medium: 1, low: 2 };
    const signalOrder: { [key: string]: number } = { buy: 0, hold: 1, sell: 2 };

    filtered.sort((a, b) => {
      let valA, valB;
      switch (sortKey) {
        case "coin":
          valA = a.coinName; // Sorting by coinName for user readability
          valB = b.coinName;
          break;
        case "currentPrice":
          valA = a.currentPrice ?? -Infinity;
          valB = b.currentPrice ?? -Infinity;
          break;
        case "entryPrice":
          valA = a.entryPrice ?? -Infinity;
          valB = b.entryPrice ?? -Infinity;
          break;
        case "exitPrice":
          valA = a.exitPrice ?? -Infinity;
          valB = b.exitPrice ?? -Infinity;
          break;
        case "signal":
          valA = signalOrder[a.signal?.toLowerCase()] ?? 3;
          valB = signalOrder[b.signal?.toLowerCase()] ?? 3;
          break;
        case "confidenceLevel":
          valA = confidenceOrder[a.confidenceLevel.toLowerCase()] ?? 3;
          valB = confidenceOrder[b.confidenceLevel.toLowerCase()] ?? 3;
          break;
        default:
          return 0;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });

    return filtered;
  }, [recommendations, confidenceFilter, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc"); 
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TradewiseHeader
        lastUpdated={lastUpdated}
        onRefresh={() => performAnalysis(searchQuery.trim() || undefined)} 
        isRefreshing={isLoading}
      />
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
        <FilterSortControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          confidenceFilter={confidenceFilter}
          setConfidenceFilter={setConfidenceFilter}
          sortKey={sortKey}
          setSortKey={setSortKey}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          onAnalyze={handleAnalyzeCoins}
          isLoading={isLoading}
          onResetFilters={handleResetFilters}
        />

        {error && !isLoading && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && recommendations.length === 0 ? (
          <SkeletonTable />
        ) : (
          <CryptoDataTable
            recommendations={filteredAndSortedRecommendations}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/50">
        TradeWise &copy; {new Date().getFullYear()}. Crypto data analysis for informational purposes only. Data from <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">CoinGecko</a>.
      </footer>
    </div>
  );
}
