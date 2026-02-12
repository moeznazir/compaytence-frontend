"use client";

export type KpiTrend = "up" | "down" | "neutral";

export interface SectionKpiMetric {
  icon: React.ReactNode;
  value: string;
  label: string;
  trendText: string;
  trend: KpiTrend;
}

interface SectionKpiBarProps {
  metrics: SectionKpiMetric[];
  className?: string;
}

function trendColor(trend: KpiTrend): string {
  switch (trend) {
    case "up":
      return "text-green-500";
    case "down":
      return "text-red-500";
    default:
      return "text-theme-text-muted";
  }
}

export function SectionKpiBar({ metrics, className = "" }: SectionKpiBarProps) {
  if (metrics.length === 0) return null;

  return (
    <div
      className={
        "rounded-xl border border-theme-border bg-theme-surface p-4 " + className
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={
              "flex flex-col gap-1 px-4 " +
              (index > 0 ? "border-l border-theme-border" : "")
            }
          >
            <div className="flex items-center gap-2">{metric.icon}</div>
            <p className="text-2xl font-semibold text-theme-text tabular-nums">
              {metric.value}
            </p>
            <p className="text-sm font-medium text-theme-text">{metric.label}</p>
            <p
              className={
                "text-xs " + trendColor(metric.trend)
              }
            >
              {metric.trendText}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
