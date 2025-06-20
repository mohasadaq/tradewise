
"use client";

import type { EnrichedPortfolioHolding } from "@/types/portfolio";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, TrendingUp, TrendingDown, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface PortfolioListItemProps {
  holding: EnrichedPortfolioHolding;
  onRemoveHolding: (holdingId: string) => void;
  isLoadingMarketData: boolean; 
}

const formatPrice = (price: number | undefined | null, minimumFractionDigits = 2, maximumFractionDigits = 2, prefix = "$") => {
  if (typeof price !== 'number' || isNaN(price)) {
    return "N/A";
  }
  const numStr = price.toLocaleString(undefined, { 
    minimumFractionDigits: (price > 0 && price < 0.01 && maximumFractionDigits < 5) ? 0 : minimumFractionDigits, 
    maximumFractionDigits: (price > 0 && price < 0.01 && maximumFractionDigits < 5) ? 5 : maximumFractionDigits 
  });
  return `${prefix}${numStr}`;
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
  const sign = percentage > 0 ? "+" : "";
  return `${sign}${percentage.toFixed(2)}%`;
};

export default function PortfolioListItem({ holding, onRemoveHolding, isLoadingMarketData }: PortfolioListItemProps) {
  const showSkeletons = isLoadingMarketData || holding.currentPrice === undefined;

  const plColor = holding.profitLoss == null ? "text-foreground" 
                 : holding.profitLoss > 0 ? "text-accent" 
                 : holding.profitLoss < 0 ? "text-destructive" 
                 : "text-foreground";

  const ProfitLossIcon = holding.profitLoss == null ? MinusCircle 
                       : holding.profitLoss > 0 ? TrendingUp 
                       : holding.profitLoss < 0 ? TrendingDown 
                       : MinusCircle;

  return (
    <Card className="shadow-md bg-card mb-3">
      <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold">{holding.name} ({holding.symbol.toUpperCase()})</CardTitle>
            <CardDescription className="text-xs pt-0.5">
              Qty: {formatQuantity(holding.quantity)} @ {formatPrice(holding.purchasePrice, 2, 5)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-2.5 text-xs space-y-2">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          <div>
            <p className="text-muted-foreground text-xs">Current Price:</p>
            {showSkeletons ? <Skeleton className="h-4 w-16 mt-0.5" /> : <p className="font-medium text-xs">{formatPrice(holding.currentPrice, 2, 5)}</p>}
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Total Cost:</p>
            <p className="font-medium text-xs">{formatPrice(holding.totalCost)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Current Value:</p>
            {showSkeletons ? <Skeleton className="h-4 w-20 mt-0.5" /> : <p className="font-medium text-xs">{formatPrice(holding.currentValue)}</p>}
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Profit/Loss:</p>
            {showSkeletons ? <Skeleton className="h-4 w-16 mt-0.5" /> : (
              <p className={cn("font-medium flex items-center text-xs", plColor)}>
                <ProfitLossIcon className="h-3 w-3 mr-1 shrink-0" />
                {(holding.profitLoss != null && holding.profitLoss > 0 ? "+" : "") + formatPrice(holding.profitLoss, 2, 2, holding.profitLoss != null && holding.profitLoss < 0 && holding.profitLoss > -0.005 ? "-$" : "$")}
              </p>
            )}
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs">Profit/Loss %:</p>
            {showSkeletons ? <Skeleton className="h-4 w-12 mt-0.5" /> : (
              <p className={cn("font-medium flex items-center text-xs", plColor)}>
                <ProfitLossIcon className="h-3 w-3 mr-1 shrink-0" />
                {formatPercentage(holding.profitLossPercentage)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-3 sm:px-4 pb-3 pt-2 border-t">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive/90 hover:bg-destructive/10 border-destructive/50 hover:border-destructive/70 text-xs h-9">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove this holding ({holding.name}) from your portfolio.
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
      </CardFooter>
    </Card>
  );
}

