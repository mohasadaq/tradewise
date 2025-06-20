
"use client";

import { useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, DollarSign, Settings, RotateCcw, LineChart, InfoIcon, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { BacktestConfiguration } from '@/types/backtesting';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { TimeFrame } from '../FilterSortControls';
import type { TradingRecommendation } from '@/app/page'; // Assuming this type is accessible


// Schema for AI Recommendation backtest form (MA params removed)
const backtestConfigSchemaForAI = z.object({
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  initialCapital: z.number().positive("Initial capital must be positive.").min(1, "Initial capital must be at least 1."),
}).refine(data => data.startDate < data.endDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

export type BacktestConfigFormDataForAI = z.infer<typeof backtestConfigSchemaForAI>;

interface BacktestConfigurationFormProps {
  onSubmit: (data: BacktestConfigFormDataForAI) => void;
  isLoading: boolean;
  defaultValues?: Partial<BacktestConfigFormDataForAI>; // Default values for date, capital
  initialCoin: { // Includes AI recommendation details
    id: string; 
    name: string; 
    symbol: string; 
    analysisTimeFrame?: TimeFrame;
    aiSignal?: TradingRecommendation['signal'];
    aiEntryPrice?: TradingRecommendation['entryPrice'];
    aiExitPrice?: TradingRecommendation['exitPrice'];
  };
}

const formatPriceNullable = (price: number | null | undefined) => {
  if (price === null || price === undefined || isNaN(price)) return "N/A";
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}`;
}

export default function BacktestConfigurationForm({
  onSubmit,
  isLoading,
  defaultValues,
  initialCoin
}: BacktestConfigurationFormProps) {
  
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<BacktestConfigFormDataForAI>({
    resolver: zodResolver(backtestConfigSchemaForAI),
    defaultValues: {
      startDate: defaultValues?.startDate || subDays(new Date(), 90),
      endDate: defaultValues?.endDate || subDays(new Date(), 1),
      initialCapital: defaultValues?.initialCapital || 10000,
    }
  });

  useEffect(() => {
    reset({
      startDate: watch('startDate') || subDays(new Date(), 90),
      endDate: watch('endDate') || subDays(new Date(), 1),
      initialCapital: watch('initialCapital') || 10000,
    });
  }, [initialCoin.id, reset, watch]);


  const processSubmit: SubmitHandler<BacktestConfigFormDataForAI> = (data) => {
    onSubmit(data);
  };
  
  const handleResetForm = () => {
    reset({
      startDate: subDays(new Date(), 90),
      endDate: subDays(new Date(), 1),
      initialCapital: 10000,
    });
  };

  const SignalIcon = 
    initialCoin.aiSignal?.toLowerCase() === 'buy' ? TrendingUp :
    initialCoin.aiSignal?.toLowerCase() === 'sell' ? TrendingDown :
    initialCoin.aiSignal?.toLowerCase() === 'hold' ? Minus :
    Brain; // Default if signal is unusual

  const signalColor = 
    initialCoin.aiSignal?.toLowerCase() === 'buy' ? 'text-accent' :
    initialCoin.aiSignal?.toLowerCase() === 'sell' ? 'text-destructive' :
    'text-muted-foreground';

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
      <Alert variant="default" className="bg-muted/50">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle className="font-semibold">Backtesting AI Recommendation: {initialCoin.name} ({initialCoin.symbol})</AlertTitle>
        <AlertDescription className="text-xs space-y-1 mt-1">
          <p>Configure date range and capital. This will simulate trades based on the AI's following recommendation:</p>
          <div className="pl-2 border-l-2 border-primary/50 text-xs space-y-0.5 py-1">
            <p className="flex items-center"><SignalIcon className={`h-3.5 w-3.5 mr-1.5 ${signalColor}`} /> Signal: <span className={`font-medium ml-1 ${signalColor}`}>{initialCoin.aiSignal || "N/A"}</span></p>
            <p>Entry Price: <span className="font-medium">{formatPriceNullable(initialCoin.aiEntryPrice)}</span></p>
            <p>Exit Price: <span className="font-medium">{formatPriceNullable(initialCoin.aiExitPrice)}</span></p>
            {initialCoin.analysisTimeFrame && <p>Analysis Time Frame: <span className="font-medium">{initialCoin.analysisTimeFrame}</span></p>}
          </div>
        </AlertDescription>
      </Alert>
      
      {/* coinGeckoId is passed implicitly through initialCoin and added in parent component */}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <div className="space-y-1">
          <Label htmlFor="initialCapital" className="flex items-center text-sm font-medium">
            <DollarSign className="h-3.5 w-3.5 mr-1.5 text-primary" />
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
                className="bg-background text-sm h-9"
                value={field.value === undefined ? '' : String(field.value)}
                onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
              />
            )}
          />
          {errors.initialCapital && <p className="text-xs text-destructive mt-1">{errors.initialCapital.message}</p>}
        </div>

        <div className="space-y-1">
          <Label className="flex items-center text-sm font-medium mb-1">
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Date Range
          </Label>
          <div className="flex flex-col xs:flex-row gap-2">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal bg-background text-sm h-9"
                    >
                      {field.value ? format(field.value, "PPP") : <span>Start date</span>}
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
                      className="w-full justify-start text-left font-normal bg-background text-sm h-9"
                    >
                      {field.value ? format(field.value, "PPP") : <span>End date</span>}
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
          {errors.endDate && !errors.startDate && <p className="text-xs text-destructive mt-1">{errors.endDate.message}</p>}
        </div>
      </div>
      
      {/* MA Crossover Parameters Removed for AI Recommendation Backtest */}

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-border/30 mt-4">
        <Button type="button" variant="outline" onClick={handleResetForm} disabled={isLoading} size="sm">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset Dates/Capital
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
          {isLoading ? 'Running...' : 'Run AI Backtest'}
        </Button>
      </div>
    </form>
  );
}
