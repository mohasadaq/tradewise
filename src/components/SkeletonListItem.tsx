
"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonListItem() {
  return (
    <Card className="mb-4 shadow-md bg-card">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-32 mb-1" /> {/* Coin Name + Symbol */}
            <Skeleton className="h-4 w-20" />      {/* Signal */}
          </div>
          <Skeleton className="h-6 w-20 rounded-full" /> {/* Confidence Badge */}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 text-sm space-y-3">
        <div className="grid grid-cols-3 gap-x-3 gap-y-2">
            <div>
                <Skeleton className="h-3 w-20 mb-1" /> {/* Label Current Price */}
                <Skeleton className="h-5 w-24" />     {/* Value Current Price */}
            </div>
            <div>
                <Skeleton className="h-3 w-16 mb-1" /> {/* Label Entry Price */}
                <Skeleton className="h-5 w-20" />     {/* Value Entry Price */}
            </div>
            <div>
                <Skeleton className="h-3 w-16 mb-1" /> {/* Label Exit Price */}
                <Skeleton className="h-5 w-20" />     {/* Value Exit Price */}
            </div>
            <div className="col-span-3">
                <Skeleton className="h-3 w-24 mb-1" /> {/* Label Potential G/L */}
                <Skeleton className="h-5 w-28" />     {/* Value Potential G/L */}
            </div>
            <div className="col-span-3">
                <Skeleton className="h-3 w-24 mb-1" /> {/* Label Strategy */}
                <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4 rounded-sm" /> {/* Icon */}
                    <Skeleton className="h-4 w-32" />          {/* Strategy Text */}
                </div>
            </div>
        </div>
        
        <div className="space-y-2 pt-2 border-t mt-3">
            <Skeleton className="h-5 w-1/2 mt-2" /> {/* Time Frame Context Trigger */}
            <Skeleton className="h-5 w-1/2" /> {/* Indicators Trigger */}
            <Skeleton className="h-5 w-1/2" /> {/* Analysis Trigger */}
            <Skeleton className="h-5 w-1/2" /> {/* Risk Management Trigger */}
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-3 pt-2 border-t">
        <Skeleton className="h-9 w-full rounded-md" /> {/* Add to Portfolio Button */}
      </CardFooter>
    </Card>
  );
}
