
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import SkeletonListItem from "./SkeletonListItem";

export default function SkeletonTable({ rows = 3 }: { rows?: number }) {
  const isMobile = useIsMobile();
  const numColumns = 13; // Coin, Current, Entry, Exit, Pot. G/L, Signal, Strategy, Risk, Confidence, Indicators, Order Book, TF Context, Actions

  if (isMobile) {
    return (
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <SkeletonListItem key={rowIndex} />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border shadow-md overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="hover:bg-card">
              {Array.from({ length: numColumns }).map((_, index) => (
                <TableHead key={index} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => {
              const cells = [
                <TableCell key={`skel-cell-${rowIndex}-0`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-12 sm:w-16" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-1`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-20 sm:w-24" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-2`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-20 sm:w-24" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-3`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-20 sm:w-24" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-4`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-16 sm:w-20" /></TableCell>, // Pot. G/L
                <TableCell key={`skel-cell-${rowIndex}-5`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-16 sm:w-20" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-6`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-20 sm:w-28" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-7`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-6 w-6 sm:h-7 sm:w-7 rounded-full" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-8`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-7 sm:h-8 w-16 sm:w-20 rounded-full" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-9`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-6 w-6 sm:h-7 sm:w-7 rounded-full" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-10`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-6 w-6 sm:h-7 sm:w-7 rounded-full" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-11`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-6 w-6 sm:h-7 sm:w-7 rounded-full" /></TableCell>,
                <TableCell key={`skel-cell-${rowIndex}-12`} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" /></TableCell> 
              ];
              return (
                <TableRow key={rowIndex} className="hover:bg-muted/50">
                  {cells}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
