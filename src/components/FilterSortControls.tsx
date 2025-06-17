
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ListRestart, RefreshCw, Search } from "lucide-react"; 

export type ConfidenceFilter = "All" | "High" | "Medium" | "Low";
export type SortKey = "coin" | "currentPrice" | "entryPrice" | "exitPrice" | "signal" | "confidenceLevel";
export type SortDirection = "asc" | "desc";

interface FilterSortControlsProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  confidenceFilter: ConfidenceFilter;
  setConfidenceFilter: Dispatch<SetStateAction<ConfidenceFilter>>;
  sortKey: SortKey;
  setSortKey: Dispatch<SetStateAction<SortKey>>;
  sortDirection: SortDirection;
  setSortDirection: Dispatch<SetStateAction<SortDirection>>;
  onAnalyze: () => void;
  isLoading: boolean;
  onResetFilters: () => void;
}

export default function FilterSortControls({
  searchQuery,
  setSearchQuery,
  confidenceFilter,
  setConfidenceFilter,
  sortKey,
  setSortKey,
  sortDirection,
  setSortDirection,
  onAnalyze,
  isLoading,
  onResetFilters,
}: FilterSortControlsProps) {
  return (
    <div className="p-4 md:p-6 bg-card rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
        <div className="lg:col-span-1 md:col-span-2 space-y-2">
          <p className="text-sm font-medium text-foreground">Analysis Scope</p>
          <p className="text-xs text-muted-foreground">
            Showing analysis for the top 5 cryptocurrencies by market cap from CoinGecko.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="searchFilter">Search Coin</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="searchFilter"
              type="text"
              placeholder="e.g. Bitcoin or BTC"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confidenceFilter">Filter by Confidence</Label>
          <Select
            value={confidenceFilter}
            onValueChange={(value) => setConfidenceFilter(value as ConfidenceFilter)}
          >
            <SelectTrigger id="confidenceFilter" className="bg-background">
              <SelectValue placeholder="Select confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="sortKey">Sort By</Label>
                <Select
                    value={sortKey}
                    onValueChange={(value) => setSortKey(value as SortKey)}
                >
                    <SelectTrigger id="sortKey" className="bg-background">
                    <SelectValue placeholder="Select key" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="coin">Coin</SelectItem>
                    <SelectItem value="currentPrice">Current Price</SelectItem>
                    <SelectItem value="entryPrice">Entry Price</SelectItem>
                    <SelectItem value="exitPrice">Exit Price</SelectItem>
                    <SelectItem value="signal">Signal</SelectItem>
                    <SelectItem value="confidenceLevel">Confidence</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="sortDirection">Direction</Label>
                <Select
                    value={sortDirection}
                    onValueChange={(value) => setSortDirection(value as SortDirection)}
                >
                    <SelectTrigger id="sortDirection" className="bg-background">
                    <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
        <Button variant="outline" onClick={onResetFilters} disabled={isLoading}>
            <ListRestart className="mr-2 h-4 w-4" /> Reset Filters & Search
        </Button>
        <Button onClick={onAnalyze} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin': ''}`} /> 
          {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>
    </div>
  );
}
