import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  headers?: string[];
}

export function TableSkeleton({
  rows = 5,
  cols = 6,
  headers,
}: TableSkeletonProps) {
  const columnCount = headers ? headers.length : cols;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {headers
              ? headers.map((h, i) => (
                  <TableHead key={i} className="font-semibold">
                    {h}
                  </TableHead>
                ))
              : Array.from({ length: columnCount }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="hover:bg-transparent">
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <TableCell key={colIndex} className="py-3.5">
                  <Skeleton
                    className={`h-4 ${
                      colIndex === 0
                        ? "w-12"
                        : colIndex === 1
                        ? "w-24"
                        : colIndex === columnCount - 1
                        ? "w-16"
                        : "w-32"
                    }`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
