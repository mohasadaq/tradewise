
"use client";

import { useState, useEffect, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { CoinListItem } from '@/services/crypto-data-service';
import { addPortfolioHolding } from '@/services/portfolio-service';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InitialPortfolioHoldingData } from '@/types/portfolio';

const holdingSchema = z.object({
  coinGeckoId: z.string().min(1, "Please select a coin"),
  quantity: z.number().positive("Quantity must be positive"),
  purchasePrice: z.number().nonnegative("Purchase price cannot be negative"),
  // These are not part of the form submission but help with display
  coinName: z.string().optional(),
  coinSymbol: z.string().optional(),
});

type HoldingFormData = z.infer<typeof holdingSchema>;

interface AddHoldingDialogProps {
  children?: ReactNode; // Trigger element - optional if opened programmatically
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onHoldingAdded: () => void;
  coinList: CoinListItem[];
  initialCoinData?: InitialPortfolioHoldingData | null;
  triggerButton?: ReactNode; // Alternative way to provide a trigger
}

export default function AddHoldingDialog({ 
  children, 
  isOpen, 
  setIsOpen, 
  onHoldingAdded, 
  coinList, 
  initialCoinData,
  triggerButton
}: AddHoldingDialogProps) {
  const { toast } = useToast();
  
  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
    defaultValues: {
      coinGeckoId: initialCoinData?.coinGeckoId || '',
      quantity: undefined,
      purchasePrice: initialCoinData?.currentPrice !== undefined && initialCoinData?.currentPrice !== null ? initialCoinData.currentPrice : undefined,
      coinName: initialCoinData?.name || '',
      coinSymbol: initialCoinData?.symbol || '',
    }
  });

  useEffect(() => {
    if (initialCoinData) {
      setValue('coinGeckoId', initialCoinData.coinGeckoId);
      setValue('coinName', initialCoinData.name);
      setValue('coinSymbol', initialCoinData.symbol);
      if (initialCoinData.currentPrice !== undefined && initialCoinData.currentPrice !== null) {
        setValue('purchasePrice', initialCoinData.currentPrice);
      } else {
        setValue('purchasePrice', undefined);
      }
      setValue('quantity', undefined); // Ensure quantity is reset
    } else {
       reset({ quantity: undefined, purchasePrice: undefined, coinGeckoId: '', coinName: '', coinSymbol: '' });
    }
  }, [initialCoinData, setValue, reset, isOpen]); // Reset/re-initialize when dialog opens or initialCoinData changes

  const selectedCoinGeckoId = watch('coinGeckoId');

  const onSubmit = (data: HoldingFormData) => {
    let coinDetails;
    if (initialCoinData && data.coinGeckoId === initialCoinData.coinGeckoId) {
      coinDetails = { id: initialCoinData.coinGeckoId, name: initialCoinData.name, symbol: initialCoinData.symbol };
    } else {
      const selectedCoin = coinList.find(c => c.id === data.coinGeckoId);
      if (!selectedCoin) {
        toast({ title: "Error", description: "Selected coin not found.", variant: "destructive" });
        return;
      }
      coinDetails = { id: selectedCoin.id, name: selectedCoin.name, symbol: selectedCoin.symbol };
    }

    try {
      addPortfolioHolding({
        coin: coinDetails,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
      });
      onHoldingAdded();
      reset({ quantity: undefined, purchasePrice: undefined, coinGeckoId: '', coinName: '', coinSymbol: '' }); // Explicitly reset to empty
    } catch (error) {
      console.error("Error adding holding:", error);
      toast({ title: "Error", description: "Failed to add holding.", variant: "destructive" });
    }
  };
  
  const dialogTrigger = children || triggerButton;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        reset({ quantity: undefined, purchasePrice: undefined, coinGeckoId: '', coinName: '', coinSymbol: '' });
      }
    }}>
      {dialogTrigger && <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialCoinData ? `Add ${initialCoinData.name} to Portfolio` : 'Add New Holding'}</DialogTitle>
          <DialogDescription>
            {initialCoinData ? `Enter quantity and purchase price for ${initialCoinData.name} (${initialCoinData.symbol.toUpperCase()}).` : 'Select a coin and enter the details of your holding.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="coinGeckoId" className="text-right">Coin</Label>
            {initialCoinData ? (
              <Input type="text" value={`${initialCoinData.name} (${initialCoinData.symbol.toUpperCase()})`} disabled className="col-span-3" />
            ) : (
              <Controller
                name="coinGeckoId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={!!initialCoinData}>
                    <SelectTrigger className="col-span-3">
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
            )}
            {errors.coinGeckoId && <p className="col-span-4 text-right text-xs text-destructive">{errors.coinGeckoId.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Quantity</Label>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <Input 
                  id="quantity" 
                  type="number" 
                  step="any"
                  className="col-span-3" 
                  placeholder="e.g. 0.5"
                  value={field.value === undefined ? '' : String(field.value)} // Handle undefined for controlled input
                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                />
              )}
            />
            {errors.quantity && <p className="col-span-4 text-right text-xs text-destructive">{errors.quantity.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchasePrice" className="text-right">Purchase Price (USD)</Label>
            <Controller
              name="purchasePrice"
              control={control}
              render={({ field }) => (
                <Input 
                  id="purchasePrice" 
                  type="number" 
                  step="any"
                  className="col-span-3" 
                  placeholder="e.g. 50000"
                  value={field.value === undefined ? '' : String(field.value)} // Handle undefined
                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                />
              )}
            />
            {errors.purchasePrice && <p className="col-span-4 text-right text-xs text-destructive">{errors.purchasePrice.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setIsOpen(false);
              reset({ quantity: undefined, purchasePrice: undefined, coinGeckoId: '', coinName: '', coinSymbol: '' });
            }}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || ( !initialCoinData && !selectedCoinGeckoId )}>
              {isSubmitting ? 'Adding...' : 'Add Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
