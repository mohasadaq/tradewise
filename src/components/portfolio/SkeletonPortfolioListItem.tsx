
"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonPortfolioListItem() {
  return (
    <Card className="shadow-md bg-card">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-32 mb-1" /> {/* Coin Name + Symbol */}
            <Skeleton className="h-4 w-40" />      {/* Qty + Avg Buy Price */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 text-sm space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <Skeleton className="h-3.5 w-20 mb-0.5" /> {/* Label Current Price */}
            <Skeleton className="h-5 w-20" />         {/* Value Current Price */}
          </div>
          <div>
            <Skeleton className="h-3.5 w-20 mb-0.5" /> {/* Label Total Cost */}
            <Skeleton className="h-5 w-24" />         {/* Value Total Cost */}
          </div>
          <div>
            <Skeleton className="h-3.5 w-24 mb-0.5" /> {/* Label Current Value */}
            <Skeleton className="h-5 w-24" />         {/* Value Current Value */}
          </div>
          <div>
            <Skeleton className="h-3.5 w-20 mb-0.5" /> {/* Label P/L */}
            <Skeleton className="h-5 w-20" />         {/* Value P/L */}
          </div>
          <div className="col-span-2">
            <Skeleton className="h-3.5 w-24 mb-0.5" /> {/* Label P/L % */}
            <Skeleton className="h-5 w-16" />         {/* Value P/L % */}
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-3 pt-3 border-t">
        <Skeleton className="h-9 w-full rounded-md" /> {/* Remove Button */}
      </CardFooter>
    </Card>
  );
}
