
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
} from "@/components/ui/alert-dialog"

interface PortfolioTableProps {
  holdings: EnrichedPortfolioHolding[];
  onRemoveHolding: (holdingId: string) => void;
  isLoadingMarketData: boolean; // Specifically for loading market-dependent data (prices, values)
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

const formatPercentage = (percentage: number | undefined | null) => {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return "N/A";
  }
  return `${percentage.toFixed(2)}%`;
};

export default function PortfolioTable({ holdings, onRemoveHolding, isLoadingMarketData, onRefresh }: PortfolioTableProps) {

  const renderSkeletonCellsForHolding = (keyPrefix: string): React.ReactNode[] => [
    <TableCell key={`${keyPrefix}-skel-cp`} className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>, {/* Current Price */}
    <TableCell key={`${keyPrefix}-skel-tc`} className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>, {/* Total Cost */}
    <TableCell key={`${keyPrefix}-skel-cv`} className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>, {/* Current Value */}
    <TableCell key={`${keyPrefix}-skel-pl`} className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>, {/* P/L Amount */}
    <TableCell key={`${keyPrefix}-skel-plp`} className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell> {/* P/L Percent */}
  ];
  
  const renderValueCellsForHolding = (holding: EnrichedPortfolioHolding): React.ReactNode[] => {
    const plColor = holding.profitLoss == null ? "text-foreground" 
                   : holding.profitLoss > 0 ? "text-accent" 
                   : holding.profitLoss < 0 ? "text-destructive" 
                   : "text-foreground";
    return [
      <TableCell key={`${holding.id}-val-cp`} className="text-right">${formatPrice(holding.currentPrice)}</TableCell>,
      <TableCell key={`${holding.id}-val-tc`} className="text-right">${formatPrice(holding.totalCost)}</TableCell>,
      <TableCell key={`${holding.id}-val-cv`} className="text-right">${formatPrice(holding.currentValue)}</TableCell>,
      <TableCell key={`${holding.id}-val-pl`} className={cn("text-right font-medium", plColor)}>
        {(holding.profitLoss != null && holding.profitLoss > 0 ? "+" : "") + `$${formatPrice(holding.profitLoss)}`}
      </TableCell>,
      <TableCell key={`${holding.id}-val-plp`} className={cn("text-right font-medium", plColor)}>
        {(holding.profitLossPercentage != null && holding.profitLossPercentage > 0 ? "+" : "") + `${formatPercentage(holding.profitLossPercentage)}`}
      </TableCell>
    ];
  };

  const renderSkeletonRowsForInitialLoad = (count: number) => {
    return Array.from({ length: count }).map((_, index) => {
      const staticSkeletonCells: React.ReactNode[] = [
        <TableCell key={`skel-initial-${index}-name`}><Skeleton className="h-5 w-24" /></TableCell>,
        <TableCell key={`skel-initial-${index}-symbol`}><Skeleton className="h-5 w-12" /></TableCell>,
        <TableCell key={`skel-initial-${index}-qty`} className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>,
        <TableCell key={`skel-initial-${index}-buyprice`} className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
      ];
      const dynamicSkeletonCells = renderSkeletonCellsForHolding(`skeleton-initial-data-${index}`);
      const actionSkeletonCell = <TableCell key={`skel-initial-${index}-action`} className="text-center"><Skeleton className="h-8 w-8 rounded mx-auto" /></TableCell>;
      
      return (
        <TableRow key={`skeleton-initial-${index}`}>
          {staticSkeletonCells}
          {...dynamicSkeletonCells}
          {actionSkeletonCell}
        </TableRow>
      );
    });
  };
  
  return (
    <div className="mt-6 rounded-lg border shadow-md overflow-hidden bg-card">
       <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold">Your Holdings</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoadingMarketData && holdings.length > 0}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingMarketData && holdings.length > 0 ? 'animate-spin' : ''}`} />
          Refresh Prices
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coin</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Avg. Buy Price</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">P/L</TableHead>
              <TableHead className="text-right">P/L %</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingMarketData && holdings.length === 0 ? ( 
              renderSkeletonRowsForInitialLoad(3)
            ) : !isLoadingMarketData && holdings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  You have no holdings in your portfolio.
                </TableCell>
              </TableRow>
            ) : (
              holdings.map((holding) => (
                  <TableRow key={holding.id}>
                    <TableCell className="font-medium">{holding.name}</TableCell>
                    <TableCell>{holding.symbol.toUpperCase()}</TableCell>
                    <TableCell className="text-right">{formatPrice(holding.quantity, 2, 8)}</TableCell>
                    <TableCell className="text-right">${formatPrice(holding.purchasePrice)}</TableCell>
                    {...(isLoadingMarketData || holding.currentPrice === undefined ? 
                        renderSkeletonCellsForHolding(holding.id) : 
                        renderValueCellsForHolding(holding)
                    )}
                    <TableCell className="text-center">
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                            <Trash2 className="h-4 w-4" />
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
