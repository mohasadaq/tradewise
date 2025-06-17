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
    <header className="py-6 px-4 md:px-8 border-b border-border/50 shadow-md bg-card sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">TradeWise</h1>
        </div>
        <div className="flex items-center gap-4">
          <ClientOnly fallback={<span className="text-sm text-muted-foreground">Loading timestamp...</span>}>
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
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
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </header>
  );
}
