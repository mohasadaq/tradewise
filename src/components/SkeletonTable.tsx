
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

export default function SkeletonTable({ rows = 5 }: { rows?: number }) {
  const numColumns = 8; // Coin, Current Price, Entry, Exit, Signal, Confidence, Indicators, Order Book

  return (
    <div className="rounded-lg border shadow-md overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-card">
            {Array.from({ length: numColumns }).map((_, index) => ( 
              <TableHead key={index} className="px-4 py-3">
                <Skeleton className="h-5 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="hover:bg-muted/50">
              <TableCell className="px-4 py-3"><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell className="px-4 py-3"><Skeleton className="h-5 w-24" /></TableCell> 
              <TableCell className="px-4 py-3"><Skeleton className="h-5 w-24" /></TableCell> 
              <TableCell className="px-4 py-3"><Skeleton className="h-5 w-24" /></TableCell> 
              <TableCell className="px-4 py-3"><Skeleton className="h-5 w-20" /></TableCell> 
              <TableCell className="px-4 py-3"><Skeleton className="h-8 w-20 rounded-full" /></TableCell>
              <TableCell className="px-4 py-3"><Skeleton className="h-7 w-7 rounded-full" /></TableCell>
              <TableCell className="px-4 py-3"><Skeleton className="h-7 w-7 rounded-full" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
