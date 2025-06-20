
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

const backtestConfigSchema = z.object({
  coinGeckoId: z.string().min(1, "Coin ID is required for backtesting."), // This will be pre-filled
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
  // coinList is kept for potential future generic use, but selection is disabled when initialCoin is provided
  coinList: CoinListItem[]; 
  onSubmit: (data: BacktestConfiguration) => void;
  isLoading: boolean;
  defaultValues?: Partial<BacktestConfigFormData>; // For re-populating if modal reopens with same coin
  initialCoin: { id: string; name: string; symbol: string }; // The coin this form is for
}

export default function BacktestConfigurationForm({
  coinList,
  onSubmit,
  isLoading,
  defaultValues,
  initialCoin
}: BacktestConfigurationFormProps) {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<BacktestConfigFormData>({
    resolver: zodResolver(backtestConfigSchema),
    defaultValues: {
      ...defaultValues, // Apply any re-population values first
      coinGeckoId: initialCoin.id, // Override with the specific coin for this instance
      startDate: defaultValues?.startDate || subDays(new Date(), 90),
      endDate: defaultValues?.endDate || subDays(new Date(), 1),
      initialCapital: defaultValues?.initialCapital || 10000,
      shortMAPeriod: defaultValues?.shortMAPeriod || 10,
      longMAPeriod: defaultValues?.longMAPeriod || 30,
    }
  });

  useEffect(() => {
    // Ensure coinGeckoId is always set to the initialCoin.id when the component mounts or initialCoin changes
    reset({
      ...watch(), // preserve other form values
      coinGeckoId: initialCoin.id,
      // Re-apply defaults if not provided in defaultValues from parent
      startDate: defaultValues?.startDate || watch('startDate') || subDays(new Date(), 90),
      endDate: defaultValues?.endDate || watch('endDate') || subDays(new Date(), 1),
      initialCapital: defaultValues?.initialCapital || watch('initialCapital') || 10000,
      shortMAPeriod: defaultValues?.shortMAPeriod || watch('shortMAPeriod') || 10,
      longMAPeriod: defaultValues?.longMAPeriod || watch('longMAPeriod') || 30,
    });
  }, [initialCoin, reset, watch, defaultValues]);


  const processSubmit: SubmitHandler<BacktestConfigFormData> = (data) => {
    onSubmit(data);
  };
  
  const handleResetForm = () => {
    reset({
      coinGeckoId: initialCoin.id, // Keep the selected coin
      startDate: subDays(new Date(), 90),
      endDate: subDays(new Date(), 1),
      initialCapital: 10000,
      shortMAPeriod: 10,
      longMAPeriod: 30,
    });
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
      <Alert variant="default" className="bg-muted/50">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle className="font-semibold">Backtesting: {initialCoin.name} ({initialCoin.symbol})</AlertTitle>
        <AlertDescription className="text-xs">
          Configure parameters to simulate the MA Crossover strategy for this coin.
        </AlertDescription>
      </Alert>
      
      {/* Hidden input for coinGeckoId as it's fixed */}
      <Controller name="coinGeckoId" control={control} render={({ field }) => <input type="hidden" {...field} />} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        {/* Initial Capital */}
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

        {/* Date Range (using two popovers) */}
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
      
      {/* MA Strategy Parameters */}
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
