
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
import { Info, Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle, HelpCircle, Minus, ListChecks, FileText, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type TradingRecommendation = AnalyzeCryptoTradesOutput["tradingRecommendations"][0] & { tradingStrategy?: string; riskManagementNotes?: string; };

interface CryptoListItemProps {
  recommendation: TradingRecommendation;
}

// Re-using or adapting from CryptoDataTable
const formatPrice = (price: number | undefined | null) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return "N/A";
  }
  if (price < 0.01 && price > 0) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumSignificantDigits: 6 });
  }
  if (price >= 1 || price === 0) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
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
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <div className="col-span-2 sm:col-span-1">
              <p className="text-muted-foreground text-xs">Current Price:</p>
              <p className="font-medium">${formatPrice(rec.currentPrice)}</p>
            </div>
            <div className="col-span-1">
              <p className="text-muted-foreground text-xs">Entry Price:</p>
              <p className="font-medium">${formatPrice(rec.entryPrice)}</p>
            </div>
            <div className="col-span-1">
              <p className="text-muted-foreground text-xs">Exit Price:</p>
              <p className="font-medium">${formatPrice(rec.exitPrice)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-0.5">Suggested Strategy:</p>
              <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-default text-xs p-1 -ml-1 rounded-sm hover:bg-muted">
                          <Brain className="h-3.5 w-3.5 text-primary/80 shrink-0" />
                          <span className="truncate">{rec.tradingStrategy || "N/A"}</span>
                      </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] bg-popover text-popover-foreground p-2 rounded-md shadow-lg">
                      <p className="font-semibold mb-1 text-xs">Strategy Details:</p>
                      <p className="text-xs whitespace-pre-wrap">{rec.tradingStrategy || "Not specified"}</p>
                  </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Accordion type="multiple" className="w-full text-xs">
            <AccordionItem value="indicators" className="border-b">
              <AccordionTrigger className="py-2 text-xs hover:no-underline">
                <div className="flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5 text-primary/90" />
                  <span>Technical Indicators</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2 pl-2 pr-1 text-muted-foreground whitespace-pre-wrap">
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
              <AccordionContent className="pt-1 pb-2 pl-2 pr-1 text-muted-foreground whitespace-pre-wrap">
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
              <AccordionContent className="pt-1 pb-2 pl-2 pr-1 text-muted-foreground whitespace-pre-wrap">
                <p>{rec.riskManagementNotes || "N/A"}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
