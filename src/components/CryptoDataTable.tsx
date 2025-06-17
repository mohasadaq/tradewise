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
import { ArrowUpDown, Info, TrendingUp, TrendingDown, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import type { AnalyzeCryptoTradesOutput } from "@/ai/flows/analyze-crypto-trades";
import type { SortKey, SortDirection } from "./FilterSortControls";

type TradingRecommendation = AnalyzeCryptoTradesOutput["tradingRecommendations"][0];

interface CryptoDataTableProps {
  recommendations: TradingRecommendation[];
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
}

const ConfidenceBadge = ({ level }: { level: string }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let className = "";
  let IconComponent = HelpCircle;

  switch (level.toLowerCase()) {
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
    <Badge variant={variant} className={`capitalize ${className} flex items-center gap-1.5 text-xs`}>
      <IconComponent className="h-3.5 w-3.5" />
      {level}
    </Badge>
  );
};

const formatPrice = (price: number) => {
  if (price >= 1) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
};

export default function CryptoDataTable({ recommendations, sortKey, sortDirection, onSort }: CryptoDataTableProps) {
  const renderSortIcon = (key: SortKey) => {
    if (sortKey === key) {
      return sortDirection === "asc" ? <TrendingUp className="ml-2 h-4 w-4" /> : <TrendingDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
  };

  return (
    <TooltipProvider>
      <div className="rounded-lg border shadow-md overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-card">
              {[
                { key: "coin", label: "Coin" },
                { key: "entryPrice", label: "Entry Price" },
                { key: "exitPrice", label: "Exit Price" },
                { key: "confidenceLevel", label: "Confidence" },
                { key: null, label: "Technical Indicators" },
                { key: null, label: "Order Book Analysis" },
              ].map((header) => (
                <TableHead key={header.label} className="px-4 py-3">
                  {header.key ? (
                     <Button variant="ghost" onClick={() => onSort(header.key as SortKey)} className="px-1 py-1 h-auto text-xs sm:text-sm">
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
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No recommendations available. Try analyzing some coins.
                </TableCell>
              </TableRow>
            ) : (
              recommendations.map((rec) => (
                <TableRow key={rec.coin} className="hover:bg-muted/50">
                  <TableCell className="font-medium px-4 py-3">{rec.coin}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">${formatPrice(rec.entryPrice)}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">${formatPrice(rec.exitPrice)}</TableCell>
                  <TableCell className="px-4 py-3">
                    <ConfidenceBadge level={rec.confidenceLevel} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Info className="h-4 w-4 text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-popover text-popover-foreground p-3 rounded-md shadow-lg">
                        <p className="font-semibold mb-1">Technical Indicators:</p>
                        <ul className="list-disc list-inside text-sm space-y-0.5">
                          {rec.technicalIndicators.map((indicator, idx) => (
                            <li key={idx}>{indicator}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Info className="h-4 w-4 text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md bg-popover text-popover-foreground p-3 rounded-md shadow-lg">
                         <p className="font-semibold mb-1">Order Book Analysis:</p>
                        <p className="text-sm">{rec.orderBookAnalysis}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
