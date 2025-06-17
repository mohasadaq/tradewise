
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
  const numColumns = 8; 

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
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-muted/50">
                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-12 sm:w-16" /></TableCell>
                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-20 sm:w-24" /></TableCell> 
                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-20 sm:w-24" /></TableCell> 
                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-20 sm:w-24" /></TableCell> 
                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-4 sm:h-5 w-16 sm:w-20" /></TableCell> 
                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-7 sm:h-8 w-16 sm:w-20 rounded-full" /></TableCell>
                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-6 w-6 sm:h-7 sm:w-7 rounded-full" /></TableCell>
                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap"><Skeleton className="h-6 w-6 sm:h-7 sm:w-7 rounded-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
