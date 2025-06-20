
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { analyzeCryptoTrades, type AnalyzeCryptoTradesOutput, type AICoinAnalysisInputData } from "@/ai/flows/analyze-crypto-trades";
import { fetchCoinData, type CryptoCoinData, type AppTimeFrame, fetchCoinList, type CoinListItem, fetchHistoricalCoinData, type HistoricalPricePoint } from "@/services/crypto-data-service";
import CryptoDataTable from "@/components/CryptoDataTable";
import FilterSortControls, {
  type ConfidenceFilter,
  type SortKey,
  type SortDirection,
  type TimeFrame,
} from "@/components/FilterSortControls";
import SkeletonTable from "@/components/SkeletonTable";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import AddHoldingDialog from "@/components/portfolio/AddHoldingDialog";
import type { InitialPortfolioHoldingData } from "@/types/portfolio";
import DashboardControls from "@/components/DashboardControls";
import BacktestingModal from "@/components/backtesting/BacktestingModal";
import type { BacktestConfiguration, BacktestResult } from "@/types/backtesting";
import { runMACrossoverBacktest } from "@/services/backtesting-service";

type TradingRecommendation = AnalyzeCryptoTradesOutput["tradingRecommendations"][0] & { 
  coinName: string; 
  tradingStrategy?: string; 
  riskManagementNotes?: string;
  timeFrameAnalysisContext?: string; 
  id?: string; 
  symbol?: string; 
  demandZone?: string;
  supplyZone?: string;
};

type CoinForBacktest = {
  id: string;
  name: string;
  symbol: string;
};

const NUMBER_OF_COINS_TO_FETCH_DEFAULT = 5;
const REFRESH_INTERVAL = 30 * 60 * 1000; 
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

  const [isAddHoldingDialogOpen, setIsAddHoldingDialogOpen] = useState(false);
  const [selectedCoinForPortfolio, setSelectedCoinForPortfolio] = useState<InitialPortfolioHoldingData | null>(null);
  
  const [coinList, setCoinList] = useState<CoinListItem[]>([]);
  const [isCoinListLoading, setIsCoinListLoading] = useState(false);

  // Backtesting State
  const [isBacktestingModalOpen, setIsBacktestingModalOpen] = useState(false);
  const [selectedCoinForBacktest, setSelectedCoinForBacktest] = useState<CoinForBacktest | null>(null);
  const [currentBacktestResults, setCurrentBacktestResults] = useState<BacktestResult | null>(null);
  const [isBacktestRunInProgress, setIsBacktestRunInProgress] = useState(false);
  const [backtestRunError, setBacktestRunError] = useState<string | null>(null);


  useEffect(() => {
    if (coinList.length === 0 && !isCoinListLoading) {
      setIsCoinListLoading(true);
      fetchCoinList()
        .then(setCoinList)
        .catch(err => {
          console.error("Error fetching coin list:", err);
          toast({ title: "Coin List Error", description: "Could not load coin list. Some features might be affected.", variant: "destructive" });
        })
        .finally(() => setIsCoinListLoading(false));
    }
  }, [coinList.length, toast, isCoinListLoading]);


  const performAnalysis = useCallback(async (symbolsToFetch?: string, timeFrameToUse?: TimeFrame, isAutoRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    const currentSymbols = symbolsToFetch?.trim() || "";
    const currentTimeFrame = timeFrameToUse || selectedTimeFrame;

    const isSearchingSpecificSymbols = currentSymbols !== "";
    const analysisTargetDescription = isSearchingSpecificSymbols ? `symbols: ${currentSymbols}` : `top ${NUMBER_OF_COINS_TO_FETCH_DEFAULT} coins`;
    const timeFrameDescription = `(${currentTimeFrame} view)`;

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
        if (!isAutoRefresh) {
            toast({ title: "Market Data Error", description: message, variant: "destructive" });
        }
        setIsLoading(false);
        return;
      }

      const nonStableMarketData = marketData.filter(coin => !isStablecoin(coin.symbol.toLowerCase()));

      if (nonStableMarketData.length === 0) {
        setRecommendations([]);
        const message = isSearchingSpecificSymbols ? `No non-stablecoin market data found for symbols: ${currentSymbols} (${currentTimeFrame} view).` : `No non-stablecoins found for analysis among top coins (${currentTimeFrame} view).`;
        setError(message);
        if (!isAutoRefresh) {
            toast({ title: "No Coins for Analysis", description: message, variant: "destructive" });
        }
        setIsLoading(false);
        return;
      }
      
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
            id: matchedMarketData?.id,
            symbol: matchedMarketData?.symbol,
            currentPrice: matchedMarketData?.current_price ?? rec.currentPrice,
            coinName: matchedMarketData?.name ?? rec.coinName,
            tradingStrategy: rec.tradingStrategy || "N/A",
            riskManagementNotes: rec.riskManagementNotes || "N/A",
            timeFrameAnalysisContext: rec.timeFrameAnalysisContext || "N/A",
            demandZone: rec.demandZone,
            supplyZone: rec.supplyZone,
          };
        });
        setRecommendations(updatedRecommendations);
        setLastUpdated(new Date());
      } else {
        setRecommendations([]);
        const message = `No recommendations found or unexpected response from AI for ${analysisTargetDescription} ${timeFrameDescription}.`;
        setError(message);
        if (!isAutoRefresh) {
            toast({ title: "Analysis Issue", description: message, variant: "destructive" });
        }
      }
    } catch (err) {
      console.error("Error performing analysis:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      const fullErrorMessage = `Analysis failed for ${analysisTargetDescription} ${timeFrameDescription}: ${errorMessage}`;
      setError(fullErrorMessage);
      setRecommendations([]);
      if (!isAutoRefresh) {
          const toastErrorMessage = `Error: ${errorMessage}`;
          toast({ title: "Analysis Failed", description: toastErrorMessage, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedTimeFrame]);

  useEffect(() => {
    performAnalysis(undefined, DEFAULT_TIME_FRAME, false); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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

  const handleOpenAddHoldingDialog = (coin: TradingRecommendation) => {
    if (!coin.id || !coin.symbol || !coin.coinName) {
        toast({title: "Error", description: "Cannot add coin to portfolio, essential data missing.", variant: "destructive"});
        return;
    }
    setSelectedCoinForPortfolio({
      coinGeckoId: coin.id, 
      name: coin.coinName,
      symbol: coin.symbol,
      currentPrice: coin.currentPrice,
    });
    setIsAddHoldingDialogOpen(true);
  };

  const handleHoldingAdded = () => {
    setIsAddHoldingDialogOpen(false);
    setSelectedCoinForPortfolio(null);
  };

  // Backtesting Modal Handlers
  const handleInitiateBacktest = (coin: TradingRecommendation) => {
    if (!coin.id || !coin.symbol || !coin.coinName) {
        toast({title: "Error", description: "Cannot initiate backtest, essential coin data missing.", variant: "destructive"});
        return;
    }
    setSelectedCoinForBacktest({
        id: coin.id,
        name: coin.coinName,
        symbol: coin.symbol.toUpperCase() // Ensure symbol is uppercase for display consistency
    });
    setCurrentBacktestResults(null); // Reset previous results
    setBacktestRunError(null); // Reset previous errors
    setIsBacktestingModalOpen(true);
  };

  const handleRunBacktestInModal = useCallback(async (config: BacktestConfiguration) => {
    if (!selectedCoinForBacktest) return;

    setIsBacktestRunInProgress(true);
    setBacktestRunError(null);
    setCurrentBacktestResults(null);

    try {
      toast({ title: "Fetching Historical Data...", description: `For ${selectedCoinForBacktest.name}, this may take a moment.`});
      const historicalData: HistoricalPricePoint[] = await fetchHistoricalCoinData(
        config.coinGeckoId, // This comes from the form, should match selectedCoinForBacktest.id
        config.startDate,
        config.endDate
      );

      if (historicalData.length === 0) {
        throw new Error("No historical data found for the selected coin and date range.");
      }
      
      toast({ title: "Running Backtest...", description: `Simulating MA Crossover strategy for ${selectedCoinForBacktest.name}.`});
      const results = runMACrossoverBacktest(config, historicalData);
      setCurrentBacktestResults(results);
      toast({ title: "Backtest Complete!", description: `Results for ${selectedCoinForBacktest.name} are now displayed.`});

    } catch (err) {
      console.error("Error during backtest:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during the backtest.";
      setBacktestRunError(errorMessage);
      toast({
        title: "Backtest Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsBacktestRunInProgress(false);
    }
  }, [selectedCoinForBacktest, toast]);


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
        case "potentialGainLoss":
          const gainA = (typeof a.exitPrice === 'number' && typeof a.currentPrice === 'number') ? a.exitPrice - a.currentPrice : -Infinity;
          const gainB = (typeof b.exitPrice === 'number' && typeof b.currentPrice === 'number') ? b.exitPrice - b.currentPrice : -Infinity;
          valA = gainA;
          valB = gainB;
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
    <div className="flex flex-col min-h-[calc(100vh_-_var(--header-height)_-_var(--footer-height))]">
      <main className="flex-grow container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <DashboardControls
           lastUpdated={lastUpdated}
           onRefresh={() => performAnalysis(searchQuery.trim() || undefined, selectedTimeFrame)}
           isRefreshing={isLoading}
        />
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
            onAddToPortfolio={handleOpenAddHoldingDialog}
            onInitiateBacktest={handleInitiateBacktest}
            isAddingToPortfolioPossible={!isCoinListLoading}
          />
        )}
      </main>
      <footer className="py-3 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/50">
        TradeWise &copy; {new Date().getFullYear()}. Crypto data analysis for informational purposes only. Stablecoins are excluded. Data from <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">CoinGecko</a>.
      </footer>
      
      <AddHoldingDialog
          isOpen={isAddHoldingDialogOpen}
          setIsOpen={setIsAddHoldingDialogOpen}
          onHoldingAdded={handleHoldingAdded}
          coinList={coinList}
          initialCoinData={selectedCoinForPortfolio}
      />

      {selectedCoinForBacktest && (
        <BacktestingModal
            isOpen={isBacktestingModalOpen}
            setIsOpen={(isOpen) => {
                setIsBacktestingModalOpen(isOpen);
                if (!isOpen) { // Reset states when modal is closed
                    setSelectedCoinForBacktest(null);
                    setCurrentBacktestResults(null);
                    setBacktestRunError(null);
                }
            }}
            coin={selectedCoinForBacktest}
            coinList={coinList} // Pass full coinList for the form's dropdown (though it will be disabled)
            onRunBacktest={handleRunBacktestInModal}
            results={currentBacktestResults}
            isLoading={isBacktestRunInProgress}
            error={backtestRunError}
        />
      )}
    </div>
  );
}
