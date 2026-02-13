/**
 * Centralized theme and colors.
 * - Chart colors (Recharts, exports): change here only.
 * - KPI icon Tailwind classes: change here only.
 * - UI theme (background, text, border, accent) is in app/globals.css (CSS variables).
 */

// ─── Chart colors (hex, for Recharts and other JS) ─────────────────────────

export const chartColors = {
  /** Default primary / single-series line */
  primary: "#6366f1",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  pink: "#ec4899",
  lime: "#84cc16",
  blue: "#3b82f6",
} as const;

/** Palette for multi-series charts (e.g. dispute reasons). Use by index. */
export const chartPalette: readonly string[] = [
  chartColors.primary,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.purple,
  chartColors.cyan,
  chartColors.pink,
  chartColors.lime,
];

/** Currency series (USD, EUR, GBP) */
export const chartCurrency = {
  USD: chartColors.blue,
  EUR: chartColors.success,
  GBP: chartColors.warning,
} as const;

/** Case reason / type semantic colors */
export const chartCaseReason = {
  itemNotReceived: chartColors.blue,
  unauthorized: chartColors.danger,
  duplicate: chartColors.purple,
  chargeback: chartColors.danger,
  claim: chartColors.warning,
  inquiry: chartColors.success,
} as const;

/** Default single series for line/area charts */
export const defaultSeriesStroke = chartColors.primary;

// ─── Chart styling (grid, axis, tooltip – for Recharts inline styles) ───────
// Align with CSS theme where possible; Recharts needs hex/values.

export const chartStyle = {
  gridStroke: "#e2e8f0",
  tickFill: "#64748b",
  axisLineStroke: "#e2e8f0",
  cursorStroke: "#94a3b8",
  labelFill: "#475569",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e2e8f0",
} as const;

// ─── KPI / icon Tailwind classes ───────────────────────────────────────────
// Single place to change icon colors used in dashboard KPIs.

export const iconColors = {
  blue: "text-blue-400",
  amber: "text-amber-400",
  cyan: "text-cyan-400",
  green: "text-green-400",
  purple: "text-purple-400",
} as const;
