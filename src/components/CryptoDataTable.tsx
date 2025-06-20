
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Info, TrendingUp, TrendingDown, AlertCircle, CheckCircle, HelpCircle, Minus, Brain, ShieldAlert, ClockIcon, DollarSign, PlusSquare, Loader2 } from "lucide-react";
import type { AnalyzeCryptoTradesOutput } from "@/ai/flows/analyze-crypto-trades";
import type { SortKey, SortDirection } from "./FilterSortControls";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import CryptoListItem from "./CryptoListItem";

type TradingRecommendation = AnalyzeCryptoTradesOutput["tradingRecommendations"][0] & { 
  tradingStrategy?: string; 
  riskManagementNotes?: string;
  timeFrameAnalysisContext?: string;
  id?: string; // CoinGecko ID
  symbol?: string; // Ticker Symbol
  demandZone?: string;
  supplyZone?: string;
};

interface CryptoDataTableProps {
  recommendations: TradingRecommendation[];
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onAddToPortfolio: (coin: TradingRecommendation) => void;
  isAddingToPortfolioPossible: boolean;
}

const ConfidenceBadge = ({ level }: { level: string }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let className = "";
  let IconComponent = HelpCircle;

  switch (level?.toLowerCase()) {
    case "high":
      variant = "default";
      className = "bg-accent text-accent-foreground hover:bg-accent/90";
      IconComponent = CheckCircle;
      break;
    case "medium":
      variant = "secondary";
      className = "bg-[hsl(var(--chart-4))] text-primary-foreground hover:bg-[hsl(var(--chart-4))]/90";
      IconComponent = AlertCircle;
      break;
    case "low":
      variant = "destructive";
      className = "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      IconComponent = AlertCircle;
      break;
    default:
      className = "bg-muted text-muted-foreground";
  }
  return (
    <Badge variant={variant} className={`capitalize ${className} flex items-center gap-1 text-xs px-2 py-0.5`}>
      <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      {level || "N/A"}
    </Badge>
  );
};

const SignalDisplay = ({ signal }: { signal: string }) => {
  let IconComponent = HelpCircle;
  let textColor = "text-muted-foreground";

  switch (signal?.toLowerCase()) {
    case "buy":
      IconComponent = TrendingUp;
      textColor = "text-accent";
      break;
    case "sell":
      IconComponent = TrendingDown;
      textColor = "text-destructive";
      break;
    case "hold":
      IconComponent = Minus;
      textColor = "text-muted-foreground";
      break;
    default:
      IconComponent = HelpCircle;
  }

  return (
    <span className={cn("flex items-center gap-1 sm:gap-1.5 capitalize text-xs sm:text-sm", textColor)}>
      <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      {signal || "N/A"}
    </span>
  );
};


const formatPrice = (price: number | undefined | null) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return "N/A";
  }

  if (price > 0 && price < 0.01) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 5 });
  } else {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 });
  }
};

export default function CryptoDataTable({ recommendations, sortKey, sortDirection, onSort, onAddToPortfolio, isAddingToPortfolioPossible }: CryptoDataTableProps) {
  const isMobile = useIsMobile();

  const renderSortIcon = (key: SortKey) => {
    if (sortKey === key) {
      return sortDirection === "asc" ? <TrendingUp className="ml-1 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" /> : <TrendingDown className="ml-1 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />;
    }
    return <ArrowUpDown className="ml-1 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4 opacity-50" />;
  };

  const tableHeaders = [
    { key: "coin", label: "Coin" },
    { key: "currentPrice", label: "Current Price" },
    { key: "entryPrice", label: "Entry Price" },
    { key: "exitPrice", label: "Exit Price" },
    { key: "potentialGainLoss", label: "Pot. G/L" },
    { key: "signal", label: "Signal" },
    { key: null, label: "Strategy" },
    { key: null, label: "Risk Mgt." },
    { key: "confidenceLevel", label: "Confidence" },
    { key: null, label: "Indicators" },
    { key: null, label: "Order Book" },
    { key: null, label: "TF Context" },
    { key: null, label: "Actions"},
  ] as const;

  if (isMobile) {
    if (recommendations.length === 0) {
      return (
        <div className="py-10 text-center text-muted-foreground">
          No recommendations available. Try analyzing some coins.
        </div>
      );
    }
    return (
      <div className="space-y-0">
        {recommendations.map((rec) => (
          <CryptoListItem 
            key={`${rec.coin}-${rec.coinName}`} 
            recommendation={rec} 
            onAddToPortfolio={onAddToPortfolio}
            isAddingToPortfolioPossible={isAddingToPortfolioPossible}
          />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border shadow-md overflow-hidden bg-card">
        <div className="overflow-x-auto">
            <Table className="min-w-full">
            <TableHeader>
                <TableRow className="hover:bg-card">
                {tableHeaders.map((header) => (
                    <TableHead key={header.label} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                    {header.key ? (
                        <Button variant="ghost" onClick={() => onSort(header.key as SortKey)} className="px-2 py-1 h-auto text-xs sm:text-sm">
                        {header.label}
                        {renderSortIcon(header.key as SortKey)}
                        </Button>
                    ) : (
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">{header.label}</span>
                    )}
                    </TableHead>
                ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {recommendations.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={tableHeaders.length} className="h-24 text-center text-muted-foreground">
                      No recommendations available. Try analyzing some coins.
                      </TableCell>
                  </TableRow>
                ) : recommendations.map((rec) => {
                  const potentialGainLoss = (typeof rec.exitPrice === 'number' && typeof rec.currentPrice === 'number') 
                                              ? rec.exitPrice - rec.currentPrice 
                                              : null;
                  let gainLossColor = "text-foreground";
                  if (potentialGainLoss !== null) {
                    if (potentialGainLoss > 0) gainLossColor = "text-accent";
                    else if (potentialGainLoss < 0) gainLossColor = "text-destructive";
                  }

                  return (
                    <TableRow key={`${rec.coin}-${rec.coinName}`} className="hover:bg-muted/50">
                      <TableCell className="font-medium px-2 py-2 sm:px-4 sm:py-3 uppercase text-xs sm:text-sm whitespace-nowrap">{rec.coinName} ({rec.coin})</TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3 tabular-nums text-xs sm:text-sm whitespace-nowrap">${formatPrice(rec.currentPrice)}</TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3 tabular-nums text-xs sm:text-sm whitespace-nowrap">${formatPrice(rec.entryPrice)}</TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3 tabular-nums text-xs sm:text-sm whitespace-nowrap">${formatPrice(rec.exitPrice)}</TableCell>
                      <TableCell className={cn("px-2 py-2 sm:px-4 sm:py-3 tabular-nums text-xs sm:text-sm whitespace-nowrap", gainLossColor)}>
                        {potentialGainLoss !== null ? (potentialGainLoss > 0 ? "+" : "") + formatPrice(potentialGainLoss) : "N/A"}
                      </TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                          <SignalDisplay signal={rec.signal} />
                      </TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                          <Tooltip delayDuration={100}>
                              <TooltipTrigger asChild>
                                  <span className="flex items-center gap-1 cursor-default">
                                      <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/80" />
                                      <span className="truncate max-w-[120px] lg:max-w-[180px]">{rec.tradingStrategy || "N/A"}</span>
                                  </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px] sm:max-w-xs bg-popover text-popover-foreground p-2 sm:p-3 rounded-md shadow-lg whitespace-pre-wrap break-words">
                                  <p className="font-semibold mb-1 text-xs sm:text-sm">Suggested Strategy:</p>
                                  <p className="text-xs sm:text-sm">{rec.tradingStrategy || "Not specified"}</p>
                              </TooltipContent>
                          </Tooltip>
                      </TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3">
                          <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7">
                              <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px] sm:max-w-md bg-popover text-popover-foreground p-2 sm:p-3 rounded-md shadow-lg whitespace-pre-wrap break-words">
                              <p className="font-semibold mb-1 text-xs sm:text-sm">Risk Management:</p>
                              <p className="text-xs sm:text-sm">{rec.riskManagementNotes || "N/A"}</p>
                          </TooltipContent>
                          </Tooltip>
                      </TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                          <ConfidenceBadge level={rec.confidenceLevel} />
                      </TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3">
                          <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7">
                              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[200px] sm:max-w-xs bg-popover text-popover-foreground p-2 sm:p-3 rounded-md shadow-lg whitespace-pre-wrap break-words">
                              <p className="font-semibold mb-1 text-xs sm:text-sm">Technical Indicators:</p>
                              {rec.technicalIndicators && rec.technicalIndicators.length > 0 ? (
                              <ul className="list-disc list-inside text-xs sm:text-sm space-y-0.5">
                                  {rec.technicalIndicators.map((indicator, idx) => (
                                  <li key={idx}>{indicator}</li>
                                  ))}
                              </ul>
                              ) : (
                              <p className="text-xs sm:text-sm">N/A</p>
                              )}
                          </TooltipContent>
                          </Tooltip>
                      </TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3">
                          <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7">
                              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px] sm:max-w-md bg-popover text-popover-foreground p-2 sm:p-3 rounded-md shadow-lg whitespace-pre-wrap break-words">
                              <p className="font-semibold mb-1 text-xs sm:text-sm">Order Book Analysis:</p>
                              <p className="text-xs sm:text-sm">{rec.orderBookAnalysis || "N/A"}</p>
                          </TooltipContent>
                          </Tooltip>
                      </TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3">
                          <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7">
                              <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px] sm:max-w-md bg-popover text-popover-foreground p-2 sm:p-3 rounded-md shadow-lg whitespace-pre-wrap break-words">
                              <p className="font-semibold mb-1 text-xs sm:text-sm">Time Frame Context:</p>
                              <p className="text-xs sm:text-sm">{rec.timeFrameAnalysisContext || "N/A"}</p>
                          </TooltipContent>
                          </Tooltip>
                      </TableCell>
                      <TableCell className="px-2 py-2 sm:px-4 sm:py-3 text-center">
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => onAddToPortfolio(rec)} 
                              disabled={!isAddingToPortfolioPossible || !rec.id || !rec.symbol}
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              aria-label="Add to portfolio"
                            >
                              {!isAddingToPortfolioPossible ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusSquare className="h-4 w-4 text-primary" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg">
                            <p className="text-xs">Add to Portfolio</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
            </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}

