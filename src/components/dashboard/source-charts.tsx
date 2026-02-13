"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SourceChartPoint } from "@/lib/types";
import { chartStyle, defaultSeriesStroke } from "@/lib/theme";

const chartTooltipStyle = {
  backgroundColor: chartStyle.tooltipBg,
  border: `1px solid ${chartStyle.tooltipBorder}`,
  borderRadius: "8px",
};

export function SourceBarChart({
  title,
  data,
  dataKey = "value",
  fill = chartStyle.labelFill,
}: {
  title: string;
  data: SourceChartPoint[];
  dataKey?: string;
  fill?: string;
}) {
  if (!data?.length) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-theme-text">{title}</h3>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="period" tick={{ fill: chartStyle.tickFill, fontSize: 12 }} />
              <YAxis tick={{ fill: chartStyle.tickFill, fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey={dataKey} name="Value" fill={fill} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SourceLineChart({
  title,
  data,
  dataKey = "value",
  stroke = defaultSeriesStroke,
}: {
  title: string;
  data: SourceChartPoint[];
  dataKey?: string;
  stroke?: string;
}) {
  if (!data?.length) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-theme-text">{title}</h3>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="period" tick={{ fill: chartStyle.tickFill, fontSize: 12 }} />
              <YAxis tick={{ fill: chartStyle.tickFill, fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line
                type="monotone"
                dataKey={dataKey}
                name="Value"
                stroke={stroke}
                strokeWidth={2}
                dot={{ fill: stroke }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SourceAreaChart({
  title,
  data,
  dataKey = "value",
  fill = defaultSeriesStroke,
}: {
  title: string;
  data: SourceChartPoint[];
  dataKey?: string;
  fill?: string;
}) {
  if (!data?.length) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-theme-text">{title}</h3>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="period" tick={{ fill: chartStyle.tickFill, fontSize: 12 }} />
              <YAxis tick={{ fill: chartStyle.tickFill, fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area
                type="monotone"
                dataKey={dataKey}
                name="Value"
                stroke={fill}
                fill={fill}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
