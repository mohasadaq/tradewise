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
import { Filter, ListRestart } from "lucide-react";

export type ConfidenceFilter = "All" | "High" | "Medium" | "Low";
export type SortKey = "coin" | "currentPrice" | "entryPrice" | "exitPrice" | "confidenceLevel";
export type SortDirection = "asc" | "desc";

interface FilterSortControlsProps {
  coinList: string;
  setCoinList: Dispatch<SetStateAction<string>>;
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
  coinList,
  setCoinList,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
        <div className="space-y-2">
          <Label htmlFor="coinList">Coins to Analyze (comma-separated)</Label>
          <Input
            id="coinList"
            placeholder="e.g., BTC,ETH,SOL"
            value={coinList}
            onChange={(e) => setCoinList(e.target.value.toUpperCase())}
            className="bg-background"
          />
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
            <ListRestart className="mr-2 h-4 w-4" /> Reset Filters
        </Button>
        <Button onClick={onAnalyze} disabled={isLoading || !coinList.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Filter className="mr-2 h-4 w-4" /> Analyze Coins
        </Button>
      </div>
    </div>
  );
}
