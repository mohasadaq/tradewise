
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { analyzeCryptoTrades, type AnalyzeCryptoTradesOutput, type AICoinAnalysisInputData } from "@/ai/flows/analyze-crypto-trades";
import { fetchCoinData, type CryptoCoinData, type AppTimeFrame } from "@/services/crypto-data-service"; // Import AppTimeFrame
import TradewiseHeader from "@/components/TradewiseHeader";
import CryptoDataTable from "@/components/CryptoDataTable";
import FilterSortControls, {
  type ConfidenceFilter,
  type SortKey,
  type SortDirection,
  type TimeFrame, // This will now be AppTimeFrame via FilterSortControls
} from "@/components/FilterSortControls";
import SkeletonTable from "@/components/SkeletonTable";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type TradingRecommendation = AnalyzeCryptoTradesOutput["tradingRecommendations"][0] & { 
  coinName: string; 
  tradingStrategy?: string; 
  riskManagementNotes?: string;
  timeFrameAnalysisContext?: string; 
};

const NUMBER_OF_COINS_TO_FETCH_DEFAULT = 5;
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const DEFAULT_TIME_FRAME: AppTimeFrame = "24h";

const STABLECOIN_SYMBOLS: string[] = [
  'usdt', 'usdc', 'busd', 'dai', 'tusd', 'usdp', 'gusd', 'fdusd', 'usdd', 'frax', 'lusd', 'pax', 'eurc', 'usde'
];

function isStablecoin(symbol: string): boolean {
  return STABLECOIN_SYMBOLS.includes(symbol.toLowerCase());
}

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
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(DEFAULT_TIME_FRAME);

  const performAnalysis = useCallback(async (symbolsToFetch?: string, timeFrameToUse?: TimeFrame, isAutoRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    const currentSymbols = symbolsToFetch?.trim() || "";
    const currentTimeFrame = timeFrameToUse || selectedTimeFrame;

    const isSearchingSpecificSymbols = currentSymbols !== "";
    const analysisTargetDescription = isSearchingSpecificSymbols ? `symbols: ${currentSymbols}` : `top ${NUMBER_OF_COINS_TO_FETCH_DEFAULT} coins`;
    const timeFrameDescription = `(${currentTimeFrame} view)`;

    // Non-error toasts removed as per guidelines. Loading is indicated by button state and skeleton.
    // if (!isAutoRefresh) {
    //    toast({ title: "Fetching Market Data...", description: `Analyzing ${analysisTargetDescription} ${timeFrameDescription}.`});
    // }

    try {
      const marketData: CryptoCoinData[] = await fetchCoinData(
        NUMBER_OF_COINS_TO_FETCH_DEFAULT,
        currentSymbols,
        currentTimeFrame 
      );

      if (!marketData || marketData.length === 0) {
        setRecommendations([]);
        const message = isSearchingSpecificSymbols ? `No market data found for symbols: ${currentSymbols} (${currentTimeFrame} view). Please check symbols/timeframe.` : `No market data found for top coins (${currentTimeFrame} view).`;
        setError(message);
        const errorTitle = isAutoRefresh ? "Auto-Refresh: Market Data Error" : "Market Data Error";
        toast({ title: errorTitle, description: message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const nonStableMarketData = marketData.filter(coin => !isStablecoin(coin.symbol.toLowerCase()));

      if (nonStableMarketData.length === 0) {
        setRecommendations([]);
        const message = isSearchingSpecificSymbols ? `No non-stablecoin market data found for symbols: ${currentSymbols} (${currentTimeFrame} view).` : `No non-stablecoins found for analysis among top coins (${currentTimeFrame} view).`;
        setError(message);
        const errorTitle = isAutoRefresh ? "Auto-Refresh: No Coins for Analysis" : "No Coins for Analysis";
        toast({ title: errorTitle, description: message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Non-error toast removed.
      // toast({ title: "Market Data Fetched", description: `Found ${nonStableMarketData.length} non-stablecoin(s). Starting AI analysis ${timeFrameDescription}...`});
      
      const aiInputData: AICoinAnalysisInputData[] = nonStableMarketData.map(md => ({
        id: md.id,
        symbol: md.symbol,
        name: md.name,
        current_price: md.current_price,
        market_cap: md.market_cap,
        total_volume: md.total_volume,
        price_change_percentage_in_selected_timeframe: md.price_change_percentage_selected_timeframe,
        selected_time_frame: currentTimeFrame,
      }));

      const input = { coinsData: aiInputData };

      const result = await analyzeCryptoTrades(input);

      if (result && result.tradingRecommendations) {
        const updatedRecommendations: TradingRecommendation[] = result.tradingRecommendations.map(rec => {
          const matchedMarketData = nonStableMarketData.find(
             md => md.symbol.toLowerCase() === rec.coin.toLowerCase() || md.name.toLowerCase() === rec.coinName.toLowerCase()
          );
          return {
            ...rec,
            currentPrice: matchedMarketData?.current_price ?? rec.currentPrice,
            coinName: matchedMarketData?.name ?? rec.coinName,
            tradingStrategy: rec.tradingStrategy || "N/A",
            riskManagementNotes: rec.riskManagementNotes || "N/A",
            timeFrameAnalysisContext: rec.timeFrameAnalysisContext || "N/A",
          };
        });
        setRecommendations(updatedRecommendations);
        setLastUpdated(new Date());
        // Non-error toast removed. Success is indicated by data display.
        // const successMessage = `Found ${updatedRecommendations.length} recommendations for ${nonStableMarketData.length} non-stablecoin(s) from ${analysisTargetDescription} ${timeFrameDescription}.`;
        // if (!isAutoRefresh) { 
        //     toast({ title: "Analysis Complete", description: successMessage });
        // }
      } else {
        setRecommendations([]);
        const message = `No recommendations found or unexpected response from AI for ${analysisTargetDescription} ${timeFrameDescription}.`;
        setError(message);
        const errorTitle = isAutoRefresh ? "Auto-Refresh: Analysis Issue" : "Analysis Issue";
        toast({ title: errorTitle, description: message, variant: "destructive" });
      }
    } catch (err) {
      console.error("Error performing analysis:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      const fullErrorMessage = `Analysis failed for ${analysisTargetDescription} ${timeFrameDescription}: ${errorMessage}`;
      setError(fullErrorMessage);
      setRecommendations([]);
      const errorTitle = isAutoRefresh ? "Auto-Refresh: Analysis Failed" : "Analysis Failed";
      const toastErrorMessage = isAutoRefresh ? `Auto-refresh: ${errorMessage}`: `Error: ${errorMessage}`;
      toast({ title: errorTitle, description: toastErrorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedTimeFrame]);

  useEffect(() => {
    performAnalysis(undefined, DEFAULT_TIME_FRAME, false); // Initial load is not an auto-refresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  useEffect(() => {
    const intervalId = setInterval(() => performAnalysis(searchQuery.trim() || undefined, selectedTimeFrame, true), REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [performAnalysis, searchQuery, selectedTimeFrame]);

  const handleAnalyzeCoins = () => {
    performAnalysis(searchQuery.trim() || undefined, selectedTimeFrame);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setConfidenceFilter("All");
    setSortKey("confidenceLevel");
    setSortDirection("desc");
    setSelectedTimeFrame(DEFAULT_TIME_FRAME);
    performAnalysis(undefined, DEFAULT_TIME_FRAME);
  };

  const filteredAndSortedRecommendations = useMemo(() => {
    let filtered = [...recommendations];

    if (searchQuery.trim()) {
        const lowerCaseQuerySymbols = searchQuery.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
        if (lowerCaseQuerySymbols.length > 0) {
            filtered = filtered.filter(rec =>
                lowerCaseQuerySymbols.some(querySymbol =>
                    rec.coin.toLowerCase().includes(querySymbol) ||
                    rec.coinName.toLowerCase().includes(querySymbol)
                )
            );
        }
    }

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
          valA = a.coinName;
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
        onRefresh={() => performAnalysis(searchQuery.trim() || undefined, selectedTimeFrame)}
        isRefreshing={isLoading}
      />
      <main className="flex-grow container mx-auto px-2 sm:px-4 md:px-8 py-4 sm:py-8">
        <FilterSortControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          confidenceFilter={confidenceFilter}
          setConfidenceFilter={setConfidenceFilter}
          sortKey={sortKey}
          setSortKey={setSortKey}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          selectedTimeFrame={selectedTimeFrame}
          setSelectedTimeFrame={setSelectedTimeFrame}
          onAnalyze={handleAnalyzeCoins}
          isLoading={isLoading}
          onResetFilters={handleResetFilters}
        />

        {error && !isLoading && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
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
      <footer className="py-4 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/50">
        TradeWise &copy; {new Date().getFullYear()}. Crypto data analysis for informational purposes only. Stablecoins are excluded. Data from <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">CoinGecko</a>.
      </footer>
    </div>
  );
}

