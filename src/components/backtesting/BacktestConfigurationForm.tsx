
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
import { CalendarIcon, DollarSign, Settings, RotateCcw, LineChart, InfoIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { CoinListItem } from '@/services/crypto-data-service';
import type { BacktestConfiguration } from '@/types/backtesting';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { TimeFrame } from '../FilterSortControls';

const backtestConfigSchema = z.object({
  coinGeckoId: z.string().min(1, "Coin ID is required for backtesting."),
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
  initialCoin: { id: string; name: string; symbol: string; analysisTimeFrame?: TimeFrame }; // analysisTimeFrame added
}

// Heuristic to get default MA periods based on analysis time frame
const getDefaultMAPeriods = (analysisTimeFrame?: TimeFrame): { short: number; long: number } => {
  switch (analysisTimeFrame) {
    case '15m':
    case '30m':
      return { short: 7, long: 14 };
    case '1h':
      return { short: 10, long: 20 };
    case '4h':
      return { short: 12, long: 26 };
    case '12h':
    case '24h':
      return { short: 20, long: 50 };
    case '7d':
    case '30d':
      return { short: 50, long: 200 };
    default: // Default if no analysisTimeFrame or unknown
      return { short: 10, long: 30 };
  }
};


export default function BacktestConfigurationForm({
  coinList,
  onSubmit,
  isLoading,
  defaultValues,
  initialCoin
}: BacktestConfigurationFormProps) {
  const initialMAPeriods = getDefaultMAPeriods(initialCoin.analysisTimeFrame);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<BacktestConfigFormData>({
    resolver: zodResolver(backtestConfigSchema),
    defaultValues: {
      ...defaultValues,
      coinGeckoId: initialCoin.id,
      startDate: defaultValues?.startDate || subDays(new Date(), 90),
      endDate: defaultValues?.endDate || subDays(new Date(), 1),
      initialCapital: defaultValues?.initialCapital || 10000,
      shortMAPeriod: defaultValues?.shortMAPeriod || initialMAPeriods.short,
      longMAPeriod: defaultValues?.longMAPeriod || initialMAPeriods.long,
    }
  });

  useEffect(() => {
    const newDefaultMAPeriods = getDefaultMAPeriods(initialCoin.analysisTimeFrame);
    reset({
      ...watch(), 
      coinGeckoId: initialCoin.id,
      startDate: watch('startDate') || subDays(new Date(), 90), // Preserve user changes if any
      endDate: watch('endDate') || subDays(new Date(), 1),
      initialCapital: watch('initialCapital') || 10000,
      // Only update MAs if they haven't been touched by the user from the initial heuristic defaults
      // This check is a bit tricky with react-hook-form's defaultValues. A simpler approach for now:
      // always reset to heuristic if initialCoin.analysisTimeFrame changes, or user explicitly resets.
      // For more sophisticated "only if not touched", one might track if field is dirty.
      shortMAPeriod: newDefaultMAPeriods.short,
      longMAPeriod: newDefaultMAPeriods.long,
    });
  }, [initialCoin.id, initialCoin.analysisTimeFrame, reset, watch]);


  const processSubmit: SubmitHandler<BacktestConfigFormData> = (data) => {
    onSubmit(data);
  };
  
  const handleResetForm = () => {
    const freshDefaultMAPeriods = getDefaultMAPeriods(initialCoin.analysisTimeFrame);
    reset({
      coinGeckoId: initialCoin.id, 
      startDate: subDays(new Date(), 90),
      endDate: subDays(new Date(), 1),
      initialCapital: 10000,
      shortMAPeriod: freshDefaultMAPeriods.short,
      longMAPeriod: freshDefaultMAPeriods.long,
    });
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
      <Alert variant="default" className="bg-muted/50">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle className="font-semibold">Backtesting: {initialCoin.name} ({initialCoin.symbol})</AlertTitle>
        <AlertDescription className="text-xs">
          Configure parameters to simulate the MA Crossover strategy for this coin.
          {initialCoin.analysisTimeFrame && ` Default MA periods suggested based on ${initialCoin.analysisTimeFrame} analysis view.`}
        </AlertDescription>
      </Alert>
      
      <Controller name="coinGeckoId" control={control} render={({ field }) => <input type="hidden" {...field} />} />
      
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
      
      <div className="space-y-3 pt-3 border-t border-border/30">
        <h3 className="text-sm font-semibold flex items-center">
          <Settings className="h-4 w-4 mr-1.5 text-primary" />
          MA Crossover Parameters
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
                  className="bg-background text-sm h-9"
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
                  className="bg-background text-sm h-9"
                  value={field.value === undefined ? '' : String(field.value)}
                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                />
              )}
            />
            {errors.longMAPeriod && <p className="text-xs text-destructive mt-1">{errors.longMAPeriod.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-border/30 mt-4">
        <Button type="button" variant="outline" onClick={handleResetForm} disabled={isLoading} size="sm">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset Parameters
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
          {isLoading ? 'Running...' : 'Run Backtest'}
        </Button>
      </div>
    </form>
  );
}
