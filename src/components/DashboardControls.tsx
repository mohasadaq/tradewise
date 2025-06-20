
"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientOnly from "@/components/ClientOnly";

interface DashboardControlsProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function DashboardControls({ lastUpdated, onRefresh, isRefreshing }: DashboardControlsProps) {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-card rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-3">
      <h2 className="text-xl font-semibold text-foreground">AI Analysis Dashboard</h2>
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
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh Data"
          className="h-9"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="ml-2 hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh Analysis"}</span>
          <span className="ml-2 sm:hidden">{isRefreshing ? "..." : "Refresh"}</span>
        </Button>
      </div>
    </div>
  );
}
