
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

const NUMBER_OF_COINS_TO_FETCH = 5; // Fetch top 5 coins
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export default function TradeWisePage() {
  const [recommendations, setRecommendations] = useState<TradingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("confidenceLevel");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fetchRecommendations = useCallback(async (isManualRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch market data from CoinGecko (top N coins)
      const marketData: CryptoCoinData[] = await fetchCoinData(NUMBER_OF_COINS_TO_FETCH);

      if (!marketData || marketData.length === 0) {
        setRecommendations([]);
        setError("No market data found from CoinGecko. The API might be temporarily unavailable or returned no data for top coins.");
        toast({
          title: "Market Data Error",
          description: "Could not fetch market data from CoinGecko.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // 2. Prepare input for AI analysis
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
      
      // 3. Call AI for analysis
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
        if (isManualRefresh) {
          toast({
            title: "Analysis Complete",
            description: `Found ${updatedRecommendations.length} recommendations for top ${NUMBER_OF_COINS_TO_FETCH} coins.`,
          });
        }
      } else {
        setRecommendations([]);
        setError("No recommendations found or unexpected response from AI.");
        if (isManualRefresh) {
          toast({
            title: "Analysis Issue",
            description: "No recommendations found or unexpected AI response.",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to fetch recommendations: ${errorMessage}`);
      setRecommendations([]);
      toast({
        title: "Analysis Failed",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecommendations(); // Initial fetch
    const intervalId = setInterval(() => fetchRecommendations(), REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchRecommendations]);

  const handleAnalyzeCoins = () => {
    fetchRecommendations(true); // Pass true for manual refresh
  };
  
  const handleResetFilters = () => {
    setSearchQuery("");
    setConfidenceFilter("All");
    setSortKey("confidenceLevel");
    setSortDirection("desc");
    // No need to call fetchRecommendations(true) here if we want reset to only apply to filters
    // If we want reset to also re-fetch, then uncomment the line below
    // fetchRecommendations(true); 
  };

  const filteredAndSortedRecommendations = useMemo(() => {
    let filtered = [...recommendations];

    // Apply search query first
    if (searchQuery.trim() !== "") {
      const lowercasedQuery = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (rec) =>
          rec.coin.toLowerCase().includes(lowercasedQuery) ||
          rec.coinName.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Then apply confidence filter
    if (confidenceFilter !== "All") {
      filtered = filtered.filter(
        (rec) => rec.confidenceLevel.toLowerCase() === confidenceFilter.toLowerCase()
      );
    }

    // Then sort
    const confidenceOrder: { [key: string]: number } = { high: 0, medium: 1, low: 2 };
    const signalOrder: { [key: string]: number } = { buy: 0, hold: 1, sell: 2 };

    filtered.sort((a, b) => {
      let valA, valB;
      switch (sortKey) {
        case "coin":
          valA = a.coinName; // Sort by full name for better UX, but display symbol
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
  }, [recommendations, searchQuery, confidenceFilter, sortKey, sortDirection]);

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
        onRefresh={() => fetchRecommendations(true)}
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
