
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
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-card rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground">AI Analysis Dashboard</h2>
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <ClientOnly fallback={<span className="text-xs text-muted-foreground self-center sm:self-auto">Loading...</span>}>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground self-center sm:self-auto">
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
          className="h-9 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="ml-2 sm:hidden">{isRefreshing ? "..." : "Refresh"}</span>
          <span className="ml-2 hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh Analysis"}</span>
        </Button>
      </div>
    </div>
  );
}
