"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportTableToCsv } from "@/lib/utils/export-csv";
import { cn } from "@/lib/utils/cn";

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface TableWithCsvDownloadProps {
  title: string;
  columns: TableColumn<Record<string, unknown>>[];
  rows: Record<string, unknown>[];
  filename: string;
  className?: string;
}

export function TableWithCsvDownload({
  title,
  columns,
  rows,
  filename,
  className,
}: TableWithCsvDownloadProps) {
  const handleDownload = useCallback(() => {
    exportTableToCsv(
      rows,
      filename,
      columns.map((c) => ({ key: c.key as string, header: c.header }))
    );
  }, [rows, filename, columns]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-base font-semibold text-theme-text">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="text-theme-text-muted hover:text-theme-text"
          title="Download as CSV"
        >
          <Download className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-left text-theme-text-muted">
              {columns.map((col) => (
                <th key={String(col.key)} className="pb-2 pr-4 font-medium last:pr-0">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-theme-text-muted">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={(row.id as string) ?? i} className="border-b border-theme-border-muted">
                  {columns.map((col) => {
                    const value = row[col.key as string];
                    const cell = col.render ? col.render(value, row) : String(value ?? "");
                    return (
                      <td key={String(col.key)} className="py-3 pr-4 text-theme-text last:pr-0">
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
