
"use client";

import type { BacktestResult, TradeLogEntry } from '@/types/backtesting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, MinusCircle, DollarSign, Percent, ListChecks, CandlestickChart, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle as UIAlertTitle } from "@/components/ui/alert"; 
import { useIsMobile } from '@/hooks/use-mobile';

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
    return <MinusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />;
  }
  if (value > 0) {
    return <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />;
  }
  if (value < 0) {
    return <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />;
  }
  return <MinusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />;
};

const MobileTradeLogItem = ({ trade, coinSymbol }: { trade: TradeLogEntry, coinSymbol: string }) => {
  return (
    <Card className="mb-3 shadow-sm bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-3">
        <div>
          <CardTitle className={cn("text-sm font-semibold", trade.type === 'Buy' ? 'text-accent' : 'text-destructive')}>
            {trade.type} {coinSymbol.toUpperCase()}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground pt-0.5">
            {format(trade.date, "PPp")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 text-xs space-y-1">
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
        <div className="mt-1.5">
          <span className="text-muted-foreground">Reason:</span>
          <p className="font-medium text-foreground whitespace-pre-wrap break-words text-xs leading-snug">{trade.reason}</p>
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
    <Card className="mt-4 sm:mt-6 shadow-lg">
      <CardHeader className="px-3 py-3 sm:px-5 sm:py-4">
        <CardTitle className="text-base sm:text-xl">Backtest Results</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {titleText} | Period: {format(config.startDate, "PP")} - {format(config.endDate, "PP")} | Initial Capital: {formatCurrency(config.initialCapital)}
          {isAIRecommendationTest && config.aiSignal && (
            <span className="block text-xs mt-0.5">
              AI Signal: <span className="font-medium">{config.aiSignal}</span> | 
              AI Entry: <span className="font-medium">{formatCurrency(config.aiEntryPrice, "N/A")}</span> | 
              AI Exit: <span className="font-medium">{formatCurrency(config.aiExitPrice, "N/A")}</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-3 pb-3 sm:px-5 sm:pb-5">
        {statusMessage && (
          <Alert variant="default" className="my-3 sm:my-4">
            <InfoIcon className="h-4 w-4" />
            <UIAlertTitle className="text-sm sm:text-base">Information</UIAlertTitle>
            <AlertDescription className="text-xs sm:text-sm">{statusMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="p-3 bg-card-foreground/5">
            <div className="flex items-center text-muted-foreground mb-1 text-xs sm:text-sm">
              <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Final Portfolio Value
            </div>
            <p className="text-lg sm:text-xl font-semibold">{formatCurrency(finalPortfolioValue)}</p>
          </Card>
          <Card className="p-3 bg-card-foreground/5">
            <div className="flex items-center text-muted-foreground mb-1 text-xs sm:text-sm">
              <ProfitLossIndicator value={totalProfitLoss} />
              <span className="ml-1.5">Strategy Profit/Loss</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-semibold", plColor)}>{totalProfitLoss != null && totalProfitLoss > 0 ? "+" : ""}{formatCurrency(totalProfitLoss)}</p>
          </Card>
          <Card className="p-3 bg-card-foreground/5">
            <div className="flex items-center text-muted-foreground mb-1 text-xs sm:text-sm">
              <Percent className="h-3.5 w-3.5 mr-1.5" /> Strategy P/L %
            </div>
            <p className={cn("text-lg sm:text-xl font-semibold", plColor)}>{formatPercentage(profitLossPercentage)}</p>
          </Card>
          <Card className="p-3 bg-card-foreground/5">
            <div className="flex items-center text-muted-foreground mb-1 text-xs sm:text-sm">
              <ListChecks className="h-3.5 w-3.5 mr-1.5" /> Total Trades (Strategy)
            </div>
            <p className="text-lg sm:text-xl font-semibold">{totalTrades}</p>
          </Card>
          {buyAndHoldProfitLossPercentage !== undefined && (
            <Card className="p-3 bg-card-foreground/5 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center text-muted-foreground mb-1 text-xs sm:text-sm">
                    <CandlestickChart className="h-3.5 w-3.5 mr-1.5" /> Buy & Hold P/L %
                </div>
                <p className={cn("text-lg sm:text-xl font-semibold", bhPlColor)}>{formatPercentage(buyAndHoldProfitLossPercentage)}</p>
            </Card>
          )}
        </div>

        {tradeLog.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 sm:text-base sm:mb-3">Trade Log (Strategy)</h3>
            <ScrollArea className="h-[250px] sm:h-[300px] w-full rounded-md border">
              {isMobile ? (
                <div className="p-1.5 sm:p-2">
                  {tradeLog.map((trade, index) => (
                    <MobileTradeLogItem key={index} trade={trade} coinSymbol={coinSymbol} />
                  ))}
                </div>
              ) : (
                <Table className="min-w-[max-content]">
                  <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                      <TableHead className="w-[130px] text-left text-xs">Date</TableHead>
                      <TableHead className="text-left text-xs">Type</TableHead>
                      <TableHead className="text-right text-xs">Price (USD)</TableHead>
                      <TableHead className="text-right text-xs">Quantity</TableHead>
                      <TableHead className="text-right text-xs">Cash After</TableHead>
                      <TableHead className="text-right text-xs">Coins Held</TableHead>
                      <TableHead className="min-w-[300px] sm:min-w-[350px] text-left text-xs">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeLog.map((trade, index) => (
                      <TableRow key={index} className="text-xs">
                        <TableCell className="text-left whitespace-nowrap py-2 px-2">{format(trade.date, "PP pp")}</TableCell>
                        <TableCell className="text-left py-2 px-2">
                          <span className={cn(trade.type === 'Buy' ? 'text-accent' : 'text-destructive', "font-medium")}>
                            {trade.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums py-2 px-2">{formatCurrency(trade.price)}</TableCell>
                        <TableCell className="text-right tabular-nums py-2 px-2">{trade.quantity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</TableCell>
                        <TableCell className="text-right tabular-nums py-2 px-2">{formatCurrency(trade.cashAfterTrade)}</TableCell>
                        <TableCell className="text-right tabular-nums py-2 px-2">{trade.coinsHeld.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</TableCell>
                        <TableCell className="text-xs text-muted-foreground text-left whitespace-pre-wrap break-words py-2 px-2">{trade.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        )}
        {tradeLog.length === 0 && !statusMessage?.includes("Not enough historical data") && ( 
            <p className="text-muted-foreground text-center py-4 text-xs sm:text-sm">No trades were executed by the strategy during this backtest period with the given parameters.</p>
        )}
      </CardContent>
    </Card>
  );
}

