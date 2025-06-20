
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, DollarSign, LineChart, Settings, RotateCcw } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import type { CoinListItem } from '@/services/crypto-data-service';
import type { BacktestConfiguration } from '@/types/backtesting';

const backtestConfigSchema = z.object({
  coinGeckoId: z.string().min(1, "Please select a coin"),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  initialCapital: z.number().positive("Initial capital must be positive.").min(1, "Initial capital must be at least 1."),
  shortMAPeriod: z.number().int().positive("Short MA period must be a positive integer.").min(2, "Short MA must be at least 2."),
  longMAPeriod: z.number().int().positive("Long MA period must be a positive integer.").min(5, "Long MA must be at least 5."),
}).refine(data => data.startDate < data.endDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
}).refine(data => data.shortMAPeriod < data.longMAPeriod, {
  message: "Short MA period must be less than Long MA period.",
  path: ["longMAPeriod"],
});

export type BacktestConfigFormData = z.infer<typeof backtestConfigSchema>;

interface BacktestConfigurationFormProps {
  coinList: CoinListItem[];
  onSubmit: (data: BacktestConfiguration) => void;
  isLoading: boolean;
  defaultValues?: Partial<BacktestConfigFormData>;
}

export default function BacktestConfigurationForm({
  coinList,
  onSubmit,
  isLoading,
  defaultValues
}: BacktestConfigurationFormProps) {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<BacktestConfigFormData>({
    resolver: zodResolver(backtestConfigSchema),
    defaultValues: {
      startDate: defaultValues?.startDate || subDays(new Date(), 90),
      endDate: defaultValues?.endDate || subDays(new Date(), 1),
      initialCapital: defaultValues?.initialCapital || 10000,
      shortMAPeriod: defaultValues?.shortMAPeriod || 10,
      longMAPeriod: defaultValues?.longMAPeriod || 30,
      coinGeckoId: defaultValues?.coinGeckoId || '',
    }
  });

  const selectedCoinGeckoId = watch('coinGeckoId');

  const processSubmit: SubmitHandler<BacktestConfigFormData> = (data) => {
    onSubmit(data);
  };
  
  const handleReset = () => {
    reset({
      startDate: subDays(new Date(), 90),
      endDate: subDays(new Date(), 1),
      initialCapital: 10000,
      shortMAPeriod: 10,
      longMAPeriod: 30,
      coinGeckoId: '',
    });
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6 p-4 sm:p-6 bg-card rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {/* Coin Selection */}
        <div className="space-y-1">
          <Label htmlFor="coinGeckoId" className="flex items-center text-sm font-medium">
            <LineChart className="h-4 w-4 mr-2 text-primary" />
            Cryptocurrency
          </Label>
          <Controller
            name="coinGeckoId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger id="coinGeckoId" className="w-full bg-background">
                  <SelectValue placeholder="Select a coin" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {coinList.length > 0 ? coinList.map(coin => (
                      <SelectItem key={coin.id} value={coin.id}>
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </SelectItem>
                    )) : <SelectItem value="loading" disabled>Loading coins...</SelectItem>}
                  </ScrollArea>
                </SelectContent>
              </Select>
            )}
          />
          {errors.coinGeckoId && <p className="text-xs text-destructive mt-1">{errors.coinGeckoId.message}</p>}
        </div>

        {/* Initial Capital */}
        <div className="space-y-1">
          <Label htmlFor="initialCapital" className="flex items-center text-sm font-medium">
            <DollarSign className="h-4 w-4 mr-2 text-primary" />
            Initial Capital (USD)
          </Label>
          <Controller
            name="initialCapital"
            control={control}
            render={({ field }) => (
              <Input
                id="initialCapital"
                type="number"
                placeholder="e.g. 10000"
                className="bg-background"
                value={field.value === undefined ? '' : String(field.value)}
                onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
              />
            )}
          />
          {errors.initialCapital && <p className="text-xs text-destructive mt-1">{errors.initialCapital.message}</p>}
        </div>

        {/* Date Range */}
        <div className="space-y-1 md:col-span-2 lg:col-span-1">
          <Label className="flex items-center text-sm font-medium mb-1">
            <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
            Date Range
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal bg-background"
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date > subDays(new Date(), 1) || date > (watch("endDate") || new Date())}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal bg-background"
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date > subDays(new Date(), 1) || date < (watch("startDate") || new Date(0))}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
          {errors.startDate && <p className="text-xs text-destructive mt-1">{errors.startDate.message}</p>}
          {errors.endDate && <p className="text-xs text-destructive mt-1">{errors.endDate.message}</p>}
        </div>
      </div>
      
      {/* MA Strategy Parameters */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        <h3 className="text-md font-semibold flex items-center">
          <Settings className="h-5 w-5 mr-2 text-primary" />
          MA Crossover Strategy Parameters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="shortMAPeriod" className="text-sm font-medium">Short MA Period</Label>
            <Controller
              name="shortMAPeriod"
              control={control}
              render={({ field }) => (
                <Input
                  id="shortMAPeriod"
                  type="number"
                  placeholder="e.g. 10"
                  className="bg-background"
                  value={field.value === undefined ? '' : String(field.value)}
                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                />
              )}
            />
            {errors.shortMAPeriod && <p className="text-xs text-destructive mt-1">{errors.shortMAPeriod.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="longMAPeriod" className="text-sm font-medium">Long MA Period</Label>
            <Controller
              name="longMAPeriod"
              control={control}
              render={({ field }) => (
                <Input
                  id="longMAPeriod"
                  type="number"
                  placeholder="e.g. 30"
                  className="bg-background"
                  value={field.value === undefined ? '' : String(field.value)}
                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                />
              )}
            />
            {errors.longMAPeriod && <p className="text-xs text-destructive mt-1">{errors.longMAPeriod.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="outline" onClick={handleReset} disabled={isLoading}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Form
        </Button>
        <Button type="submit" disabled={isLoading || !selectedCoinGeckoId} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {isLoading ? 'Running Backtest...' : 'Run Backtest'}
        </Button>
      </div>
    </form>
  );
}
