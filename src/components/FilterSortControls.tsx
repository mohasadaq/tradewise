
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
    <div className="p-3 sm:p-4 bg-card rounded-lg shadow mb-4 sm:mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
        <div className="lg:col-span-1 sm:col-span-2 space-y-1">
          <p className="text-sm font-medium text-foreground">Analysis Scope</p>
          <p className="text-xs text-muted-foreground">
            Enter coin symbols (e.g. btc,eth) for specific analysis, or leave blank for default top coins (stablecoins excluded).
          </p>
        </div>
        
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="searchFilter" className="text-xs sm:text-sm">Search by Coin Symbols</Label>
          <div className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              id="searchFilter"
              type="text"
              placeholder="e.g. btc,eth,tao"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 bg-background text-xs sm:text-sm h-9 sm:h-10"
            />
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="confidenceFilter" className="text-xs sm:text-sm">Filter by Confidence</Label>
          <Select
            value={confidenceFilter}
            onValueChange={(value) => setConfidenceFilter(value as ConfidenceFilter)}
          >
            <SelectTrigger id="confidenceFilter" className="bg-background text-xs sm:text-sm h-9 sm:h-10">
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
        
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="sortKey" className="text-xs sm:text-sm">Sort By</Label>
                <Select
                    value={sortKey}
                    onValueChange={(value) => setSortKey(value as SortKey)}
                >
                    <SelectTrigger id="sortKey" className="bg-background text-xs sm:text-sm h-9 sm:h-10">
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
            <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="sortDirection" className="text-xs sm:text-sm">Direction</Label>
                <Select
                    value={sortDirection}
                    onValueChange={(value) => setSortDirection(value as SortDirection)}
                >
                    <SelectTrigger id="sortDirection" className="bg-background text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
        <Button variant="outline" onClick={onResetFilters} disabled={isLoading} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4">
            <ListRestart className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> Reset & Show Top
        </Button>
        <Button onClick={onAnalyze} disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin': ''}`} />
          {isLoading ? 'Analyzing...' : (searchQuery.trim() ? 'Analyze Symbols' : 'Analyze Top Coins')}
        </Button>
      </div>
    </div>
  );
}
