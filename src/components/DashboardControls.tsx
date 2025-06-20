
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
    <div className="mb-4 sm:mb-6 p-3 bg-card rounded-lg shadow flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:items-center sm:p-4">
      <h2 className="text-lg font-semibold text-foreground text-center sm:text-xl sm:text-left">AI Analysis Dashboard</h2>
      <div className="flex flex-col items-center gap-2 w-full sm:w-auto sm:flex-row sm:gap-3">
        <ClientOnly fallback={<span className="text-xs text-muted-foreground">Loading...</span>}>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
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
          className="h-9 w-full text-xs sm:w-auto sm:text-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : "sm:mr-2"}`} />
          <span className="ml-2 sm:ml-0">{isRefreshing ? "Refreshing..." : "Refresh Analysis"}</span>
        </Button>
      </div>
    </div>
  );
}
