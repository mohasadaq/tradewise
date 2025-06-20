
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, MinusCircle, DollarSign, PieChart, Activity } from "lucide-react";

interface PortfolioSummaryCardProps {
  totalValue: number | null;
  totalCost: number | null;
  totalProfitLoss: number | null;
  totalProfitLossPercentage: number | null;
  isLoading: boolean;
}

const formatCurrency = (value: number | null | undefined, defaultText = "N/A") => {
  if (value == null || isNaN(value)) return defaultText;
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercentage = (value: number | null | undefined, defaultText = "N/A") => {
  if (value == null || isNaN(value)) return defaultText;
  return `${value.toFixed(2)}%`;
};

export default function PortfolioSummaryCard({
  totalValue,
  totalCost,
  totalProfitLoss,
  totalProfitLossPercentage,
  isLoading,
}: PortfolioSummaryCardProps) {

  const plColor = totalProfitLoss == null ? "text-foreground" 
                 : totalProfitLoss > 0 ? "text-accent" 
                 : totalProfitLoss < 0 ? "text-destructive" 
                 : "text-foreground";

  const ProfitLossIcon = totalProfitLoss == null ? MinusCircle 
                       : totalProfitLoss > 0 ? TrendingUp 
                       : totalProfitLoss < 0 ? TrendingDown 
                       : MinusCircle;

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Portfolio Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-4 bg-card rounded-lg border">
            <div className="flex items-center text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Current Value
            </div>
            {isLoading ? <Skeleton className="h-7 w-3/4" /> : 
            <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>}
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <div className="flex items-center text-muted-foreground mb-1">
                <PieChart className="h-4 w-4 mr-2" />
                Total Cost Basis
            </div>
            {isLoading ? <Skeleton className="h-7 w-3/4" /> :
            <p className="text-2xl font-semibold">{formatCurrency(totalCost)}</p>}
          </div>
          
          <div className="p-4 bg-card rounded-lg border">
            <div className="flex items-center text-muted-foreground mb-1">
               <ProfitLossIcon className={cn("h-4 w-4 mr-2", plColor)} />
                Total Profit/Loss
            </div>
             {isLoading ? <Skeleton className="h-7 w-3/4" /> :
            <p className={cn("text-2xl font-semibold", plColor)}>{totalProfitLoss != null && totalProfitLoss > 0 ? "+" : ""}{formatCurrency(totalProfitLoss)}</p>}
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <div className="flex items-center text-muted-foreground mb-1">
                 <Activity className="h-4 w-4 mr-2" />
                 Total P/L %
            </div>
            {isLoading ? <Skeleton className="h-7 w-1/2" /> :
            <p className={cn("text-2xl font-semibold", plColor)}>{totalProfitLossPercentage != null && totalProfitLossPercentage > 0 ? "+" : ""}{formatPercentage(totalProfitLossPercentage)}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
