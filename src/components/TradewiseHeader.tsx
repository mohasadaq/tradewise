
"use client";

import { RefreshCw, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientOnly from "@/components/ClientOnly";

interface TradewiseHeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function TradewiseHeader({ lastUpdated, onRefresh, isRefreshing }: TradewiseHeaderProps) {
  return (
    <header className="py-4 px-2 sm:px-4 md:px-8 border-b border-border/50 shadow-md bg-card sticky top-0 z-50">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">TradeWise</h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <ClientOnly fallback={<span className="text-xs sm:text-sm text-muted-foreground">Loading...</span>}>
            {lastUpdated && (
              <span className="text-xs sm:text-sm text-muted-foreground">
                Last Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </ClientOnly>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh Data"
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </header>
  );
}
