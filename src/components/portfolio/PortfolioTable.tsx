
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import type { EnrichedPortfolioHolding } from "@/types/portfolio";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ReactNode } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import PortfolioListItem from "./PortfolioListItem";
import SkeletonPortfolioListItem from "./SkeletonPortfolioListItem";


interface PortfolioTableProps {
  holdings: EnrichedPortfolioHolding[];
  onRemoveHolding: (holdingId: string) => void;
  isLoadingMarketData: boolean;
  onRefresh: () => void;
}

const formatPrice = (price: number | undefined | null, minimumFractionDigits = 2, maximumFractionDigits = 2) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return "N/A";
  }
  if (price > 0 && price < 0.01 && maximumFractionDigits < 5) {
     return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 5 });
  }
  return price.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits });
};

const formatQuantity = (quantity: number | undefined | null) => {
  if (typeof quantity !== 'number' || isNaN(quantity)) {
    return "N/A";
  }
  return quantity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8});
}

const formatPercentage = (percentage: number | undefined | null) => {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return "N/A";
  }
  return `${percentage.toFixed(2)}%`;
};

const renderSkeletonCellsForHolding = (keyPrefix: string): ReactNode[] => [
    <TableCell key={`${keyPrefix}-skel-cp`} className="text-right px-2 py-2 sm:px-4 sm:py-3"><Skeleton className="h-5 w-16 sm:w-20 ml-auto" /></TableCell>,
    <TableCell key={`${keyPrefix}-skel-tc`} className="text-right px-2 py-2 sm:px-4 sm:py-3"><Skeleton className="h-5 w-16 sm:w-20 ml-auto" /></TableCell>,
    <TableCell key={`${keyPrefix}-skel-cv`} className="text-right px-2 py-2 sm:px-4 sm:py-3"><Skeleton className="h-5 w-20 sm:w-24 ml-auto" /></TableCell>,
    <TableCell key={`${keyPrefix}-skel-pl`} className="text-right px-2 py-2 sm:px-4 sm:py-3"><Skeleton className="h-5 w-16 sm:w-20 ml-auto" /></TableCell>,
    <TableCell key={`${keyPrefix}-skel-plp`} className="text-right px-2 py-2 sm:px-4 sm:py-3"><Skeleton className="h-5 w-12 sm:w-16 ml-auto" /></TableCell>
];
  
const renderValueCellsForHolding = (holding: EnrichedPortfolioHolding): ReactNode[] => {
    const plColor = holding.profitLoss == null ? "text-foreground" 
                   : holding.profitLoss > 0 ? "text-accent" 
                   : holding.profitLoss < 0 ? "text-destructive" 
                   : "text-foreground";
    return [
      <TableCell key={`${holding.id}-val-cp`} className="text-right px-2 py-2 sm:px-4 sm:py-3 tabular-nums text-xs sm:text-sm">${formatPrice(holding.currentPrice, 2, 5)}</TableCell>,
      <TableCell key={`${holding.id}-val-tc`} className="text-right px-2 py-2 sm:px-4 sm:py-3 tabular-nums text-xs sm:text-sm">${formatPrice(holding.totalCost)}</TableCell>,
      <TableCell key={`${holding.id}-val-cv`} className="text-right px-2 py-2 sm:px-4 sm:py-3 tabular-nums text-xs sm:text-sm">${formatPrice(holding.currentValue)}</TableCell>,
      <TableCell key={`${holding.id}-val-pl`} className={cn("text-right font-medium tabular-nums text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3", plColor)}>
        {(holding.profitLoss != null && holding.profitLoss > 0 ? "+" : "") + `$${formatPrice(holding.profitLoss)}`}
      </TableCell>,
      <TableCell key={`${holding.id}-val-plp`} className={cn("text-right font-medium tabular-nums text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3", plColor)}>
        {(holding.profitLossPercentage != null && holding.profitLossPercentage > 0 ? "+" : "") + `${formatPercentage(holding.profitLossPercentage)}`}
      </TableCell>
    ];
};

export default function PortfolioTable({ holdings, onRemoveHolding, isLoadingMarketData, onRefresh }: PortfolioTableProps) {
  const isMobile = useIsMobile();

  const renderSkeletonRowsForInitialLoad = (count: number, isMobileView: boolean): ReactNode[] => {
    if (isMobileView) {
      return Array.from({ length: count }).map((_, index) => (
        <SkeletonPortfolioListItem key={`skel-mobile-initial-${index}`} />
      ));
    }
    return Array.from({ length: count }).map((_, index) => {
      const staticSkeletonCells: ReactNode[] = [
        <TableCell key={`skel-initial-${index}-name`} className="px-2 py-2 sm:px-4 sm:py-3"><Skeleton className="h-5 w-20 sm:w-24" /></TableCell>,
        <TableCell key={`skel-initial-${index}-symbol`} className="px-2 py-2 sm:px-4 sm:py-3"><Skeleton className="h-5 w-10 sm:w-12" /></TableCell>,
        <TableCell key={`skel-initial-${index}-qty`} className="text-right px-2 py-2 sm:px-4 sm:py-3"><Skeleton className="h-5 w-16 sm:w-20 ml-auto" /></TableCell>,
        <TableCell key={`skel-initial-${index}-buyprice`} className="text-right px-2 py-2 sm:px-4 sm:py-3"><Skeleton className="h-5 w-16 sm:w-20 ml-auto" /></TableCell>
      ];
      const dynamicSkeletonCells = renderSkeletonCellsForHolding(`skeleton-initial-data-${index}`);
      const actionSkeletonCell = <TableCell key={`skel-initial-${index}-action`} className="text-center px-2 py-2 sm:px-4 sm:py-3"><Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded mx-auto" /></TableCell>;
      
      return (
        <TableRow key={`skeleton-initial-${index}`}>
          {staticSkeletonCells}
          {...dynamicSkeletonCells}
          {actionSkeletonCell}
        </TableRow>
      );
    });
  };

  if (isMobile) {
    return (
      <div className="mt-6 space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center px-1 sm:px-0">
          <h2 className="text-lg sm:text-xl font-semibold">Your Holdings</h2>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoadingMarketData && holdings.length > 0} className="h-8 sm:h-9 text-xs sm:text-sm">
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoadingMarketData && holdings.length > 0 ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {isLoadingMarketData && holdings.length === 0 ? (
          renderSkeletonRowsForInitialLoad(3, true)
        ) : !isLoadingMarketData && holdings.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            You have no holdings in your portfolio.
          </div>
        ) : (
          holdings.map((holding) => (
            <PortfolioListItem 
              key={holding.id} 
              holding={holding} 
              onRemoveHolding={onRemoveHolding} 
              isLoadingMarketData={isLoadingMarketData && holding.currentPrice === undefined}
            />
          ))
        )}
      </div>
    );
  }
  
  return (
    <div className="mt-6 rounded-lg border shadow-md overflow-hidden bg-card">
       <div className="flex justify-between items-center p-3 sm:p-4 border-b">
        <h2 className="text-lg sm:text-xl font-semibold">Your Holdings</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoadingMarketData && holdings.length > 0} className="h-8 sm:h-9 text-xs sm:text-sm">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoadingMarketData && holdings.length > 0 ? 'animate-spin' : ''}`} />
          Refresh Prices
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-card">
              <TableHead className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Coin</TableHead>
              <TableHead className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Symbol</TableHead>
              <TableHead className="text-right px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Quantity</TableHead>
              <TableHead className="text-right px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Avg. Buy Price</TableHead>
              <TableHead className="text-right px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Current Price</TableHead>
              <TableHead className="text-right px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Total Cost</TableHead>
              <TableHead className="text-right px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Current Value</TableHead>
              <TableHead className="text-right px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">P/L</TableHead>
              <TableHead className="text-right px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">P/L %</TableHead>
              <TableHead className="text-center px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingMarketData && holdings.length === 0 ? ( 
              renderSkeletonRowsForInitialLoad(3, false)
            ) : !isLoadingMarketData && holdings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-sm text-muted-foreground">
                  You have no holdings in your portfolio.
                </TableCell>
              </TableRow>
            ) : (
              holdings.map((holding) => (
                  <TableRow key={holding.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">{holding.name}</TableCell>
                    <TableCell className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">{holding.symbol.toUpperCase()}</TableCell>
                    <TableCell className="text-right px-2 py-2 sm:px-4 sm:py-3 tabular-nums text-xs sm:text-sm">{formatQuantity(holding.quantity)}</TableCell>
                    <TableCell className="text-right px-2 py-2 sm:px-4 sm:py-3 tabular-nums text-xs sm:text-sm">${formatPrice(holding.purchasePrice, 2, 5)}</TableCell>
                    {...(isLoadingMarketData || holding.currentPrice === undefined ? 
                        renderSkeletonCellsForHolding(holding.id) : 
                        renderValueCellsForHolding(holding)
                    )}
                    <TableCell className="text-center px-2 py-2 sm:px-4 sm:py-3">
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-7 w-7 sm:h-8 sm:w-8">
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove this holding from your portfolio.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRemoveHolding(holding.id)} className="bg-destructive hover:bg-destructive/90">
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
