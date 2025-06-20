
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
import { ListRestart, RefreshCw, Search, Clock } from "lucide-react";
import type { AppTimeFrame } from '@/services/crypto-data-service';

export type ConfidenceFilter = "All" | "High" | "Medium" | "Low";
export type SortKey = "coin" | "currentPrice" | "entryPrice" | "exitPrice" | "signal" | "confidenceLevel" | "potentialGainLoss";
export type SortDirection = "asc" | "desc";
export type TimeFrame = AppTimeFrame; 

const timeFrameOptions: { value: TimeFrame; label: string }[] = [
  { value: "15m", label: "15 Min" },
  { value: "30m", label: "30 Min" },
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "12h", label: "12 Hours" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
];

interface FilterSortControlsProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  confidenceFilter: ConfidenceFilter;
  setConfidenceFilter: Dispatch<SetStateAction<ConfidenceFilter>>;
  sortKey: SortKey;
  setSortKey: Dispatch<SetStateAction<SortKey>>;
  sortDirection: SortDirection;
  setSortDirection: Dispatch<SetStateAction<SortDirection>>;
  selectedTimeFrame: TimeFrame;
  setSelectedTimeFrame: Dispatch<SetStateAction<TimeFrame>>;
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
  selectedTimeFrame,
  setSelectedTimeFrame,
  onAnalyze,
  isLoading,
  onResetFilters,
}: FilterSortControlsProps) {
  return (
    <div className="p-3 sm:p-4 bg-card rounded-lg shadow mb-4 sm:mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 items-end">
        <div className="lg:col-span-1 sm:col-span-2 xl:col-span-1 space-y-1">
          <p className="text-sm font-medium text-foreground">Analysis Scope & Filters</p>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Enter symbols (e.g. btc,eth) for specific analysis. Blank analyzes top coins. Stablecoins excluded.
          </p>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="searchFilter" className="text-xs sm:text-sm">Search Symbols</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="searchFilter"
              type="text"
              placeholder="e.g. btc,eth"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-background text-xs sm:text-sm h-9"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="timeFrameFilter" className="text-xs sm:text-sm">Time Frame</Label>
          <Select
            value={selectedTimeFrame}
            onValueChange={(value) => setSelectedTimeFrame(value as TimeFrame)}
          >
            <SelectTrigger id="timeFrameFilter" className="bg-background text-xs sm:text-sm h-9">
              <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Select time frame" />
            </SelectTrigger>
            <SelectContent>
              {timeFrameOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="confidenceFilter" className="text-xs sm:text-sm">Confidence</Label>
          <Select
            value={confidenceFilter}
            onValueChange={(value) => setConfidenceFilter(value as ConfidenceFilter)}
          >
            <SelectTrigger id="confidenceFilter" className="bg-background text-xs sm:text-sm h-9">
              <SelectValue placeholder="Select confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All" className="text-xs sm:text-sm">All</SelectItem>
              <SelectItem value="High" className="text-xs sm:text-sm">High</SelectItem>
              <SelectItem value="Medium" className="text-xs sm:text-sm">Medium</SelectItem>
              <SelectItem value="Low" className="text-xs sm:text-sm">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:col-span-2 lg:col-span-1 xl:col-span-1">
            <div className="space-y-1">
                <Label htmlFor="sortKey" className="text-xs sm:text-sm">Sort By</Label>
                <Select
                    value={sortKey}
                    onValueChange={(value) => setSortKey(value as SortKey)}
                >
                    <SelectTrigger id="sortKey" className="bg-background text-xs sm:text-sm h-9">
                    <SelectValue placeholder="Select key" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="coin" className="text-xs sm:text-sm">Coin</SelectItem>
                    <SelectItem value="currentPrice" className="text-xs sm:text-sm">Current Price</SelectItem>
                    <SelectItem value="entryPrice" className="text-xs sm:text-sm">Entry Price</SelectItem>
                    <SelectItem value="exitPrice" className="text-xs sm:text-sm">Exit Price</SelectItem>
                    <SelectItem value="potentialGainLoss" className="text-xs sm:text-sm">Pot. G/L</SelectItem>
                    <SelectItem value="signal" className="text-xs sm:text-sm">Signal</SelectItem>
                    <SelectItem value="confidenceLevel" className="text-xs sm:text-sm">Confidence</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label htmlFor="sortDirection" className="text-xs sm:text-sm">Direction</Label>
                <Select
                    value={sortDirection}
                    onValueChange={(value) => setSortDirection(value as SortDirection)}
                >
                    <SelectTrigger id="sortDirection" className="bg-background text-xs sm:text-sm h-9">
                    <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="asc" className="text-xs sm:text-sm">Asc</SelectItem>
                    <SelectItem value="desc" className="text-xs sm:text-sm">Desc</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>
      <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
        <Button variant="outline" onClick={onResetFilters} disabled={isLoading} className="w-full sm:w-auto h-9 text-xs sm:text-sm px-3">
            <ListRestart className="mr-1.5 h-3.5 w-3.5" /> 
            <span className="hidden sm:inline">Reset & Show Top</span>
            <span className="sm:hidden">Reset</span>
        </Button>
        <Button onClick={onAnalyze} disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-xs sm:text-sm px-3">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? 'animate-spin': ''}`} />
          {isLoading ? 'Analyzing...' : (searchQuery.trim() ? 'Analyze Symbols' : 'Analyze Top Coins')}
        </Button>
      </div>
    </div>
  );
}
