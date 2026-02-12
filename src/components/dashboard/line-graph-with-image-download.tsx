"use client";

import { useRef, useCallback } from "react";
import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportElementAsPng } from "@/lib/utils/export-chart-image";
import type { SourceChartPoint } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

/** Chart data: must have period; value or series keys for values */
export type ChartDataPoint = (SourceChartPoint | (Record<string, unknown> & { period: string }));

export interface LineSeriesConfig {
  dataKey: string;
  name: string;
  stroke: string;
}

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "none",
  borderRadius: "12px",
  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)",
  padding: "12px 16px",
  fontSize: "13px",
  fontWeight: 500,
};

interface LineGraphWithImageDownloadProps {
  title: string;
  data: ChartDataPoint[];
  series?: LineSeriesConfig[];
  filename: string;
  className?: string;
}

export function LineGraphWithImageDownload({
  title,
  data,
  series = [{ dataKey: "value", name: "Value", stroke: "#6366f1" }],
  filename,
  className,
}: LineGraphWithImageDownloadProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!containerRef.current) return;
    await exportElementAsPng(containerRef.current, filename);
  }, [filename]);

  if (!data?.length) return null;

  return (
    <Card className={cn("overflow-hidden border-theme-border shadow-sm transition-shadow hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-theme-border bg-theme-surface-elevated/50 pb-3">
        <h3 className="text-base font-semibold text-theme-text">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="text-theme-text-muted hover:bg-theme-surface-elevated hover:text-theme-text"
          title="Download as image"
        >
          <Download className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <div ref={containerRef} className="h-72 bg-theme-surface rounded-b-lg">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
              <defs>
                {series.map((s, i) => (
                  <linearGradient key={s.dataKey} id={`gradient-${s.dataKey}-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.stroke} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={s.stroke} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} strokeOpacity={0.8} />
              <XAxis
                dataKey="period"
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (typeof v === "number" && v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 4" }}
                formatter={(value: unknown, name: string) => [typeof value === "number" ? value.toLocaleString() : String(value ?? ""), name]}
                labelStyle={{ color: "#475569", fontWeight: 600, marginBottom: 4 }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span className="text-theme-text font-medium">{value}</span>}
              />
              {series.map((s, i) => (
                <Area
                  key={`area-${s.dataKey}`}
                  type="monotone"
                  dataKey={s.dataKey}
                  fill={`url(#gradient-${s.dataKey}-${i})`}
                  stroke="none"
                />
              ))}
              {series.map((s) => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.stroke}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ fill: s.stroke, stroke: "#fff", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff", fill: s.stroke }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
