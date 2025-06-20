
"use client";

import type { AnalyzeCryptoTradesOutput } from "@/ai/flows/analyze-crypto-trades";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info, Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle, HelpCircle, Minus, ListChecks, FileText, ShieldAlert, ClockIcon, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type TradingRecommendation = AnalyzeCryptoTradesOutput["tradingRecommendations"][0] & { 
  tradingStrategy?: string; 
  riskManagementNotes?: string;
  timeFrameAnalysisContext?: string;
};

interface CryptoListItemProps {
  recommendation: TradingRecommendation;
}

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

const SignalDisplay = ({ signal }: { signal: string }) => {
  let IconComponent = HelpCircle;
  let textColor = "text-muted-foreground";
  let signalText = signal || "N/A";

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
  }

  return (
    <span className={cn("flex items-center gap-1.5 capitalize text-sm font-medium", textColor)}>
      <IconComponent className="h-4 w-4" />
      {signalText}
    </span>
  );
};

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
      <IconComponent className="h-3 w-3" />
      {level || "N/A"}
    </Badge>
  );
};


export default function CryptoListItem({ recommendation: rec }: CryptoListItemProps) {
  const potentialGainLoss = (typeof rec.exitPrice === 'number' && typeof rec.currentPrice === 'number') 
                              ? rec.exitPrice - rec.currentPrice 
                              : null;
  let gainLossColor = "text-foreground";
  if (potentialGainLoss !== null) {
    if (potentialGainLoss > 0) gainLossColor = "text-accent";
    else if (potentialGainLoss < 0) gainLossColor = "text-destructive";
  }

  return (
    <TooltipProvider>
      <Card className="mb-4 shadow-md bg-card">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">{rec.coinName} ({rec.coin.toUpperCase()})</CardTitle>
              <CardDescription className="text-xs">
                <SignalDisplay signal={rec.signal} />
              </CardDescription>
            </div>
            <ConfidenceBadge level={rec.confidenceLevel} />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 text-sm space-y-3">
          <div className="grid grid-cols-3 gap-x-3 gap-y-2">
            <div>
              <p className="text-muted-foreground text-xs">Current Price:</p>
              <p className="font-medium">${formatPrice(rec.currentPrice)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Entry Price:</p>
              <p className="font-medium">${formatPrice(rec.entryPrice)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Exit Price:</p>
              <p className="font-medium">${formatPrice(rec.exitPrice)}</p>
            </div>
            <div className="col-span-3">
              <p className="text-muted-foreground text-xs">Potential G/L:</p>
              <p className={cn("font-medium", gainLossColor)}>
                {potentialGainLoss !== null ? (potentialGainLoss > 0 ? "+" : "") + formatPrice(potentialGainLoss) : "N/A"}
              </p>
            </div>
            <div className="col-span-3">
              <p className="text-muted-foreground text-xs mb-0.5">Suggested Strategy:</p>
              <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-default text-xs p-1 -ml-1 rounded-sm hover:bg-muted">
                          <Brain className="h-3.5 w-3.5 text-primary/80 shrink-0" />
                          <span className="truncate break-words">{rec.tradingStrategy || "N/A"}</span>
                      </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] bg-popover text-popover-foreground p-2 rounded-md shadow-lg whitespace-pre-wrap break-words">
                      <p className="font-semibold mb-1 text-xs">Strategy Details:</p>
                      <p className="text-xs">{rec.tradingStrategy || "Not specified"}</p>
                  </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Accordion type="multiple" className="w-full text-xs">
            <AccordionItem value="timeframe-context" className="border-b">
              <AccordionTrigger className="py-2 text-xs hover:no-underline">
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5 text-primary/90" />
                  <span>Time Frame Context</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2 pl-2 pr-1 text-muted-foreground whitespace-pre-wrap break-words">
                <p>{rec.timeFrameAnalysisContext || "N/A"}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="indicators" className="border-b">
              <AccordionTrigger className="py-2 text-xs hover:no-underline">
                <div className="flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5 text-primary/90" />
                  <span>Technical Indicators</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2 pl-2 pr-1 text-muted-foreground whitespace-pre-wrap break-words">
                {rec.technicalIndicators && rec.technicalIndicators.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5">
                    {rec.technicalIndicators.map((indicator, idx) => (
                      <li key={idx}>{indicator}</li>
                    ))}
                  </ul>
                ) : (
                  <p>N/A</p>
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="analysis" className="border-b">
              <AccordionTrigger className="py-2 text-xs hover:no-underline">
                 <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary/90" />
                  <span>Order Book Analysis</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2 pl-2 pr-1 text-muted-foreground whitespace-pre-wrap break-words">
                <p>{rec.orderBookAnalysis || "N/A"}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="risk-management" className="border-b-0">
              <AccordionTrigger className="py-2 text-xs hover:no-underline">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-primary/90" />
                  <span>Risk Management</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2 pl-2 pr-1 text-muted-foreground whitespace-pre-wrap break-words">
                <p>{rec.riskManagementNotes || "N/A"}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
