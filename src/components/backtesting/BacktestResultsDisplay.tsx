
"use client";

import type { BacktestResult, TradeLogEntry } from '@/types/backtesting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, MinusCircle, DollarSign, Percent, ListChecks, CandlestickChart, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle as UIAlertTitle } from "@/components/ui/alert"; 
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

interface BacktestResultsDisplayProps {
  results: BacktestResult;
  coinSymbol: string;
}

const formatCurrency = (value: number | null | undefined, defaultText = "N/A") => {
  if (value == null || isNaN(value)) return defaultText;
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercentage = (value: number | null | undefined, defaultText = "N/A") => {
  if (value == null || isNaN(value)) return defaultText;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const ProfitLossIndicator = ({ value }: { value: number | null | undefined }) => {
  if (value == null || isNaN(value)) {
    return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  }
  if (value > 0) {
    return <TrendingUp className="h-4 w-4 text-accent" />;
  }
  if (value < 0) {
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  }
  return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
};

// Internal component for mobile trade log item
const MobileTradeLogItem = ({ trade, coinSymbol }: { trade: TradeLogEntry, coinSymbol: string }) => {
  return (
    <Card className="mb-3 shadow-sm bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
        <div>
          <CardTitle className={cn("text-base font-semibold", trade.type === 'Buy' ? 'text-accent' : 'text-destructive')}>
            {trade.type} {coinSymbol.toUpperCase()}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {format(trade.date, "PPp")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 text-xs space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Price:</span>
          <span className="font-medium">{formatCurrency(trade.price)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Quantity:</span>
          <span className="font-medium">{trade.quantity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Cash After:</span>
          <span className="font-medium">{formatCurrency(trade.cashAfterTrade)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Coins Held:</span>
          <span className="font-medium">{trade.coinsHeld.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</span>
        </div>
        <div className="mt-1">
          <span className="text-muted-foreground">Reason:</span>
          <p className="font-medium text-foreground whitespace-pre-wrap break-words text-[0.7rem] leading-snug">{trade.reason}</p>
        </div>
      </CardContent>
    </Card>
  );
};


export default function BacktestResultsDisplay({ results, coinSymbol }: BacktestResultsDisplayProps) {
  const isMobile = useIsMobile();
  const { 
    config, 
    finalPortfolioValue, 
    totalProfitLoss, 
    profitLossPercentage, 
    totalTrades, 
    tradeLog,
    buyAndHoldProfitLossPercentage,
    statusMessage
  } = results;

  const plColor = totalProfitLoss == null ? "text-foreground" 
                 : totalProfitLoss > 0 ? "text-accent" 
                 : totalProfitLoss < 0 ? "text-destructive" 
                 : "text-foreground";

  const bhPlColor = buyAndHoldProfitLossPercentage == null ? "text-foreground"
                   : buyAndHoldProfitLossPercentage > 0 ? "text-accent"
                   : buyAndHoldProfitLossPercentage < 0 ? "text-destructive"
                   : "text-foreground";

  const isAIRecommendationTest = config.aiSignal !== undefined;
  const titleText = isAIRecommendationTest 
    ? `AI Recommendation: ${coinSymbol.toUpperCase()}`
    : `Strategy: ${coinSymbol.toUpperCase()}`;


  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Backtest Results</CardTitle>
        <CardDescription>
          {titleText} | Period: {format(config.startDate, "PPP")} - {format(config.endDate, "PPP")} | Initial Capital: {formatCurrency(config.initialCapital)}
          {isAIRecommendationTest && config.aiSignal && (
            <span className="block text-xs mt-1">
              AI Signal: <span className="font-medium">{config.aiSignal}</span> | 
              AI Entry: <span className="font-medium">{formatCurrency(config.aiEntryPrice, "N/A")}</span> | 
              AI Exit: <span className="font-medium">{formatCurrency(config.aiExitPrice, "N/A")}</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {statusMessage && (
          <Alert variant="default" className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <UIAlertTitle>Information</UIAlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 bg-card-foreground/5">
            <div className="flex items-center text-muted-foreground mb-1 text-sm">
              <DollarSign className="h-4 w-4 mr-2" /> Final Portfolio Value
            </div>
            <p className="text-xl sm:text-2xl font-semibold">{formatCurrency(finalPortfolioValue)}</p>
          </Card>
          <Card className="p-4 bg-card-foreground/5">
            <div className="flex items-center text-muted-foreground mb-1 text-sm">
              <ProfitLossIndicator value={totalProfitLoss} />
              <span className="ml-2">Strategy Profit/Loss</span>
            </div>
            <p className={cn("text-xl sm:text-2xl font-semibold", plColor)}>{totalProfitLoss != null && totalProfitLoss > 0 ? "+" : ""}{formatCurrency(totalProfitLoss)}</p>
          </Card>
          <Card className="p-4 bg-card-foreground/5">
            <div className="flex items-center text-muted-foreground mb-1 text-sm">
              <Percent className="h-4 w-4 mr-2" /> Strategy P/L %
            </div>
            <p className={cn("text-xl sm:text-2xl font-semibold", plColor)}>{formatPercentage(profitLossPercentage)}</p>
          </Card>
          <Card className="p-4 bg-card-foreground/5">
            <div className="flex items-center text-muted-foreground mb-1 text-sm">
              <ListChecks className="h-4 w-4 mr-2" /> Total Trades (Strategy)
            </div>
            <p className="text-xl sm:text-2xl font-semibold">{totalTrades}</p>
          </Card>
          {buyAndHoldProfitLossPercentage !== undefined && (
            <Card className="p-4 bg-card-foreground/5 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center text-muted-foreground mb-1 text-sm">
                    <CandlestickChart className="h-4 w-4 mr-2" /> Buy & Hold P/L %
                </div>
                <p className={cn("text-xl sm:text-2xl font-semibold", bhPlColor)}>{formatPercentage(buyAndHoldProfitLossPercentage)}</p>
            </Card>
          )}
        </div>

        {tradeLog.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Trade Log (Strategy)</h3>
            <ScrollArea className="h-[300px] w-full rounded-md border">
              {isMobile ? (
                <div className="p-2">
                  {tradeLog.map((trade, index) => (
                    <MobileTradeLogItem key={index} trade={trade} coinSymbol={coinSymbol} />
                  ))}
                </div>
              ) : (
                <Table className="min-w-[max-content]">
                  <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                      <TableHead className="w-[130px] text-left">Date</TableHead>
                      <TableHead className="text-left">Type</TableHead>
                      <TableHead className="text-right">Price (USD)</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Cash After</TableHead>
                      <TableHead className="text-right">Coins Held</TableHead>
                      <TableHead className="min-w-[300px] sm:min-w-[350px] text-left">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeLog.map((trade, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-left whitespace-nowrap">{format(trade.date, "PP pp")}</TableCell>
                        <TableCell className="text-left">
                          <span className={cn(trade.type === 'Buy' ? 'text-accent' : 'text-destructive', "font-medium")}>
                            {trade.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(trade.price)}</TableCell>
                        <TableCell className="text-right tabular-nums">{trade.quantity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(trade.cashAfterTrade)}</TableCell>
                        <TableCell className="text-right tabular-nums">{trade.coinsHeld.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</TableCell>
                        <TableCell className="text-xs text-muted-foreground text-left whitespace-pre-wrap break-words">{trade.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        )}
        {tradeLog.length === 0 && !statusMessage?.includes("Not enough historical data") && ( 
            <p className="text-muted-foreground text-center py-4">No trades were executed by the strategy during this backtest period with the given parameters.</p>
        )}
      </CardContent>
    </Card>
  );
}

