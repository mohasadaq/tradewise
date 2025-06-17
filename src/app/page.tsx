"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { analyzeCryptoTrades, type AnalyzeCryptoTradesInput, type AnalyzeCryptoTradesOutput } from "@/ai/flows/analyze-crypto-trades";
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

type TradingRecommendation = AnalyzeCryptoTradesOutput["tradingRecommendations"][0];

const DEFAULT_COIN_LIST = "BTC,ETH,SOL,DOGE,ADA,DOT,LINK,MATIC,XRP,LTC";
const REFRESH_INTERVAL = 60 * 1000; // 60 seconds

export default function TradeWisePage() {
  const [recommendations, setRecommendations] = useState<TradingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const [coinListInput, setCoinListInput] = useState(DEFAULT_COIN_LIST);
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("confidenceLevel");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fetchRecommendations = useCallback(async (coins: string, isManualRefresh: boolean = false) => {
    if (!coins.trim()) {
      setRecommendations([]);
      setError("Please enter a list of coins to analyze.");
      if (isManualRefresh) {
         toast({
          title: "Input Error",
          description: "Coin list cannot be empty.",
          variant: "destructive",
        });
      }
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const input: AnalyzeCryptoTradesInput = { coinList: coins };
      const result = await analyzeCryptoTrades(input);
      if (result && result.tradingRecommendations) {
        setRecommendations(result.tradingRecommendations);
        setLastUpdated(new Date());
        if (isManualRefresh) {
          toast({
            title: "Analysis Complete",
            description: `Found ${result.tradingRecommendations.length} recommendations.`,
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
    fetchRecommendations(coinListInput); // Initial fetch
    const intervalId = setInterval(() => fetchRecommendations(coinListInput), REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [coinListInput, fetchRecommendations]);

  const handleAnalyzeCoins = () => {
    fetchRecommendations(coinListInput, true);
  };
  
  const handleResetFilters = () => {
    setConfidenceFilter("All");
    setSortKey("confidenceLevel");
    setSortDirection("desc");
    setCoinListInput(DEFAULT_COIN_LIST);
    fetchRecommendations(DEFAULT_COIN_LIST, true); 
  };


  const filteredAndSortedRecommendations = useMemo(() => {
    let filtered = [...recommendations];

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
          valA = a.coin;
          valB = b.coin;
          break;
        case "currentPrice":
          valA = a.currentPrice;
          valB = b.currentPrice;
          break;
        case "entryPrice":
          valA = a.entryPrice;
          valB = b.entryPrice;
          break;
        case "exitPrice":
          valA = a.exitPrice;
          valB = b.exitPrice;
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
        onRefresh={() => fetchRecommendations(coinListInput, true)}
        isRefreshing={isLoading}
      />
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
        <FilterSortControls
          coinList={coinListInput}
          setCoinList={setCoinListInput}
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
        TradeWise &copy; {new Date().getFullYear()}. Crypto data analysis for informational purposes only.
      </footer>
    </div>
  );
}
