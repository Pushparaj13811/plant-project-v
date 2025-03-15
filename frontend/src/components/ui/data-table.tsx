import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type ColumnKey<T> = keyof T | string;
type ColumnValue<T> = T[keyof T] | string | number | boolean | null | undefined;

interface Column<T> {
  key: ColumnKey<T>;
  label: string;
  render?: (value: ColumnValue<T>, record: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (record: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record, index) => (
            <TableRow
              key={index}
              onClick={() => onRowClick?.(record)}
              className={cn(
                onRowClick && 'cursor-pointer hover:bg-muted/50'
              )}
            >
              {columns.map((column) => {
                const value = record[column.key as keyof T] as ColumnValue<T>;
                return (
                  <TableCell key={String(column.key)}>
                    {column.render ? column.render(value, record) : String(value)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 