
"use client";

import { useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
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

const holdingSchema = z.object({
  coinGeckoId: z.string().min(1, "Please select a coin"),
  quantity: z.number().positive("Quantity must be positive"),
  purchasePrice: z.number().nonnegative("Purchase price cannot be negative"),
});

type HoldingFormData = z.infer<typeof holdingSchema>;

interface AddHoldingDialogProps {
  children: ReactNode; // Trigger element
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onHoldingAdded: () => void;
  coinList: CoinListItem[];
}

export default function AddHoldingDialog({ children, isOpen, setIsOpen, onHoldingAdded, coinList }: AddHoldingDialogProps) {
  const { toast } = useToast();
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
    defaultValues: {
      quantity: undefined, // Use undefined for react-hook-form to treat as empty
      purchasePrice: undefined,
    }
  });

  const onSubmit = (data: HoldingFormData) => {
    const selectedCoin = coinList.find(c => c.id === data.coinGeckoId);
    if (!selectedCoin) {
      toast({ title: "Error", description: "Selected coin not found.", variant: "destructive" });
      return;
    }

    try {
      addPortfolioHolding({
        coin: { id: selectedCoin.id, name: selectedCoin.name, symbol: selectedCoin.symbol },
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
      });
      onHoldingAdded();
      reset();
    } catch (error) {
      console.error("Error adding holding:", error);
      toast({ title: "Error", description: "Failed to add holding.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Holding</DialogTitle>
          <DialogDescription>
            Enter the details of your cryptocurrency holding.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="coinGeckoId" className="text-right">Coin</Label>
            <Controller
              name="coinGeckoId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                  value={field.value ?? ""}
                  onChange={e => field.onChange(parseFloat(e.target.value))}
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
                  value={field.value ?? ""}
                  onChange={e => field.onChange(parseFloat(e.target.value))}
                />
              )}
            />
            {errors.purchasePrice && <p className="col-span-4 text-right text-xs text-destructive">{errors.purchasePrice.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
