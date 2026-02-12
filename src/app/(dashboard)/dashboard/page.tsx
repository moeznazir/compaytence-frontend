"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  Wallet,
  BarChart3,
  FileText,
  Calendar,
} from "lucide-react";
import { getDashboardSourceData } from "@/lib/api/dashboard";
import { getMerchantData, type MerchantDataResponse } from "@/lib/api/merchant-data";
import type { DashboardSourceData, DashboardSourceType } from "@/lib/types";
import type { SectionKpiMetric } from "@/components/dashboard/section-kpi-bar";
import { useAuthStore } from "@/store/auth-store";
import { Loading } from "@/components/ui/loading";
import { SourceTabs } from "@/components/dashboard/source-tabs";
import { SectionKpiBar } from "@/components/dashboard/section-kpi-bar";
import {
  BalanceTable,
  DisputeTable,
  ReconciliationTable,
  StatementTable,
  StripeTable,
} from "@/components/dashboard/source-tables";
import { SourceLineChart } from "@/components/dashboard/source-charts";
import { TableWithCsvDownload, type TableColumn } from "@/components/dashboard/table-with-csv-download";
import { LineGraphWithImageDownload, type LineSeriesConfig } from "@/components/dashboard/line-graph-with-image-download";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function getKpisForSource(
  source: DashboardSourceType,
  data: DashboardSourceData
): SectionKpiMetric[] {
  const overview = [
    {
      icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
      value: "€8,139.38",
      label: "Total Sales",
      trendText: "+12.5% from last period",
      trend: "up" as const,
    },
    {
      icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
      value: "€4,296.79",
      label: "Risk Volume",
      trendText: "53.26% from last period",
      trend: "up" as const,
    },
    {
      icon: <RotateCcw className="h-5 w-5 text-purple-400" />,
      value: "53.25%",
      label: "Refund Rate",
      trendText: "-2.1% from last period",
      trend: "down" as const,
    },
    {
      icon: <RefreshCw className="h-5 w-5 text-cyan-400" />,
      value: "0.01%",
      label: "Dispute Rate",
      trendText: "0.00% from last period",
      trend: "neutral" as const,
    },
  ];

  if (source === "all") return overview;

  if (source === "paypal_balance") {
    const total = data.paypalBalance.table.reduce((s, r) => s + (r.total ?? 0), 0);
    const lastChart = data.paypalBalance.chart?.slice(-1)?.[0]?.value ?? 0;
    return [
      {
        icon: <Wallet className="h-5 w-5 text-blue-400" />,
        value: formatCurrency(total),
        label: "Total Balance",
        trendText: "+12.5% from last period",
        trend: "up" as const,
      },
      {
        icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
        value: formatCurrency(lastChart * 0.05),
        label: "Volume at Risk",
        trendText: "-10.8% from last period",
        trend: "up" as const,
      },
      {
        icon: <BarChart3 className="h-5 w-5 text-purple-400" />,
        value: "13%",
        label: "Rolling Reserve",
        trendText: "-0.5% from last period",
        trend: "down" as const,
      },
      {
        icon: <Calendar className="h-5 w-5 text-cyan-400" />,
        value: "3.5 days",
        label: "Dispute Delay",
        trendText: "-0.4 days from last period",
        trend: "down" as const,
      },
    ];
  }

  if (source === "paypal_dispute") {
    const open = data.paypalDispute.table.filter((r) => r.status === "Open").length;
    const resolved = data.paypalDispute.table.filter((r) => r.status === "Resolved").length;
    return [
      {
        icon: <AlertCircle className="h-5 w-5 text-blue-400" />,
        value: String(data.paypalDispute.table.length),
        label: "Total Disputes",
        trendText: "+4.2% from last period",
        trend: "up" as const,
      },
      {
        icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
        value: String(open),
        label: "Open",
        trendText: "Active",
        trend: "neutral" as const,
      },
      {
        icon: <TrendingUp className="h-5 w-5 text-green-400" />,
        value: String(resolved),
        label: "Resolved",
        trendText: "+2.1% from last period",
        trend: "up" as const,
      },
      {
        icon: <Wallet className="h-5 w-5 text-cyan-400" />,
        value: formatCurrency(data.paypalDispute.table.reduce((s, r) => s + (r.amount ?? 0), 0)),
        label: "Dispute Volume",
        trendText: "0.00% from last period",
        trend: "neutral" as const,
      },
    ];
  }

  if (source === "paypal_reconciliation") {
    const credits = data.paypalReconciliation.table.filter((r) => r.type === "Credit").length;
    const debits = data.paypalReconciliation.table.filter((r) => r.type === "Debit").length;
    const lastBalance = data.paypalReconciliation.table[0]?.balance ?? 0;
    return [
      {
        icon: <Wallet className="h-5 w-5 text-blue-400" />,
        value: formatCurrency(lastBalance),
        label: "Current Balance",
        trendText: "+6.8% from last period",
        trend: "up" as const,
      },
      {
        icon: <TrendingUp className="h-5 w-5 text-green-400" />,
        value: String(credits),
        label: "Credits",
        trendText: "+1 from last period",
        trend: "up" as const,
      },
      {
        icon: <RotateCcw className="h-5 w-5 text-amber-400" />,
        value: String(debits),
        label: "Debits",
        trendText: "0% from last period",
        trend: "neutral" as const,
      },
      {
        icon: <BarChart3 className="h-5 w-5 text-cyan-400" />,
        value: formatCurrency(
          data.paypalReconciliation.table.reduce((s, r) => s + (r.amount ?? 0), 0)
        ),
        label: "Net Movement",
        trendText: "+2.1% from last period",
        trend: "up" as const,
      },
    ];
  }

  if (source === "paypal_statement") {
    const rows = data.paypalStatement.table;
    const last = rows[0];
    return [
      {
        icon: <FileText className="h-5 w-5 text-blue-400" />,
        value: last ? formatCurrency(Number(last.closingBalance)) : "—",
        label: "Statement Total",
        trendText: "+8.2% from last period",
        trend: "up" as const,
      },
      {
        icon: <BarChart3 className="h-5 w-5 text-amber-400" />,
        value: String(rows.reduce((s, r) => s + (Number(r.transactionCount) || 0), 0)),
        label: "Transactions",
        trendText: "+2 from last period",
        trend: "up" as const,
      },
      {
        icon: <Wallet className="h-5 w-5 text-purple-400" />,
        value: formatCurrency(
          rows.reduce((s, r) => s + (Number(r.totalIn) || 0), 0)
        ),
        label: "Total In",
        trendText: "0% from last period",
        trend: "neutral" as const,
      },
      {
        icon: <Calendar className="h-5 w-5 text-cyan-400" />,
        value: last?.period ?? "—",
        label: "Period",
        trendText: "Current",
        trend: "neutral" as const,
      },
    ];
  }

  if (source === "stripe") {
    const totalVolume = data.stripe.table.reduce((s, r) => s + (r.amount ?? 0), 0);
    return [
      {
        icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
        value: formatCurrency(Math.max(0, totalVolume)),
        label: "Total Sales",
        trendText: "+12.5% from last period",
        trend: "up" as const,
      },
      {
        icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
        value: formatCurrency(Math.max(0, totalVolume) * 0.23),
        label: "Risk Volume",
        trendText: "53.26% from last period",
        trend: "up" as const,
      },
      {
        icon: <RotateCcw className="h-5 w-5 text-purple-400" />,
        value: "2.4%",
        label: "Refund Rate",
        trendText: "-2.1% from last period",
        trend: "down" as const,
      },
      {
        icon: <RefreshCw className="h-5 w-5 text-cyan-400" />,
        value: "0.01%",
        label: "Dispute Rate",
        trendText: "0.00% from last period",
        trend: "neutral" as const,
      },
    ];
  }

  return overview;
}

// Columns for extended PayPal Balance Summary section (fallback when no merchant data kpi)
const BALANCE_SUMMARY_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: "account", header: "Account" },
  { key: "currency", header: "Currency" },
  { key: "available", header: "Available", render: (v, r) => formatCurrency(Number(v), r.currency as string) },
  { key: "pending", header: "Pending", render: (v, r) => formatCurrency(Number(v), r.currency as string) },
  { key: "total", header: "Total", render: (v, r) => formatCurrency(Number(v), r.currency as string) },
  { key: "asOf", header: "As of" },
];

/**
 * Build PayPal Balance Summary table columns and rows from merchant_data API paypal_master.kpi.
 * Columns are derived from the first row's keys (e.g. sale_amount → "Sale Amount").
 */
function getPaypalBalanceSummaryFromMerchantData(
  merchantData: MerchantDataResponse | null
): { columns: TableColumn<Record<string, unknown>>[]; rows: Record<string, unknown>[] } {
  const kpiData = (merchantData?.paypal_master?.kpi ?? []) as Record<string, unknown>[];
  if (!Array.isArray(kpiData) || kpiData.length === 0) {
    return { columns: [], rows: [] };
  }
  const firstRow = kpiData[0];
  const keys = Object.keys(firstRow);
  const columns: TableColumn<Record<string, unknown>>[] = keys.map((key) => {
    const label = key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    return { key, header: label };
  });
  return { columns, rows: kpiData };
}

/**
 * Build Merchant PayPal table columns and rows from merchant_data API paypal_master.merchant_paypal.
 * Columns are derived from the first row's keys (e.g. month_date → "Month Date").
 */
function getMerchantPaypalFromMerchantData(
  merchantData: MerchantDataResponse | null
): { columns: TableColumn<Record<string, unknown>>[]; rows: Record<string, unknown>[] } {
  const rows = (merchantData?.paypal_master?.merchant_paypal ?? []) as Record<string, unknown>[];
  if (!Array.isArray(rows) || rows.length === 0) {
    return { columns: [], rows: [] };
  }
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  const columns: TableColumn<Record<string, unknown>>[] = keys.map((key) => {
    const label = key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    return { key, header: label };
  });
  return { columns, rows };
}

/** Allowed columns for Merchant PayPal Master (from paypal_master.merchant_paypal). API may use rr05/rr10 or rr_5/rr_10. */
const MERCHANT_PAYPAL_MASTER_ALLOWED_KEYS = [
  "month_date",
  "refund_rate",
  "dispute_rate",
  "risk_rate",
  "risk_volume",
  "rr_5",
  "rr_10",
  "rr_15",
  "rr_20",
  "rr_25",
  "rr_30",
  "rr05",
  "rr10",
  "rr15",
  "rr20",
  "rr25",
  "rr30",
] as const;

/**
 * Build Merchant PayPal Master table from merchant_data API paypal_master.merchant_paypal.
 * Uses a fixed set of columns; labels rr* as "RR X%".
 */
function getMerchantPaypalMasterFromMerchantData(
  merchantData: MerchantDataResponse | null
): { columns: TableColumn<Record<string, unknown>>[]; rows: Record<string, unknown>[] } {
  const rawRows = (merchantData?.paypal_master?.merchant_paypal ?? []) as Record<string, unknown>[];
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return { columns: [], rows: [] };
  }
  const firstRow = rawRows[0];
  const keys = MERCHANT_PAYPAL_MASTER_ALLOWED_KEYS.filter((k) => firstRow[k] !== undefined);

  const columns: TableColumn<Record<string, unknown>>[] = keys.map((key) => {
    let header: string;
    if (key.startsWith("rr_")) {
      const pct = key.split("_")[1];
      header = `RR ${pct}%`;
    } else if (/^rr\d+$/.test(key)) {
      const pct = key.replace(/^rr/, "");
      header = `RR ${parseInt(pct, 10)}%`;
    } else {
      header = key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    }
    return { key, header };
  });

  const rows = rawRows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      if (row[key] !== undefined) out[key] = row[key];
    }
    return out;
  });

  return { columns, rows };
}

/** Flatten paypal_dispute.caseReason.count (month -> category -> count) to array of { dispute_month, category, count } */
function flattenCaseReasonCountsDynamic(
  countObj: Record<string, Record<string, unknown>> | null | undefined
): { dispute_month: string; category: string; count: number }[] {
  if (!countObj || typeof countObj !== "object") return [];
  const result: { dispute_month: string; category: string; count: number }[] = [];
  const months = Object.keys(countObj).sort();
  for (const month of months) {
    const categories = countObj[month];
    if (!categories || typeof categories !== "object") continue;
    for (const category of Object.keys(categories)) {
      result.push({
        dispute_month: month,
        category,
        count: Number(categories[category]) ?? 0,
      });
    }
  }
  return result;
}

const DISPUTE_REASON_CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

/** Dedupe categories by trimmed key; return sorted unique keys and map key -> display name (first seen). */
function uniqueCategoriesFromFlat(
  flat: { dispute_month: string; category: string; count: number }[]
): { keys: string[]; displayName: (key: string) => string } {
  const normalizedToDisplay: Record<string, string> = {};
  const seenKeys = new Set<string>();
  for (const r of flat) {
    const key = r.category.trim();
    if (!key) continue;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      normalizedToDisplay[key] = r.category;
    }
  }
  const keys = [...seenKeys].sort();
  return {
    keys,
    displayName: (key: string) => normalizedToDisplay[key] ?? key,
  };
}

/**
 * Build PayPal Dispute Reason chart data from merchant_data API paypal_dispute.caseReason.count.
 * Pivots flattened (month, category, count) to chart shape; categories deduped by trimmed key so each series appears once.
 */
function getDisputeReasonChartFromMerchantData(
  merchantData: MerchantDataResponse | null
): { data: { period: string; [key: string]: string | number | undefined }[]; series: LineSeriesConfig[] } {
  const caseReason = merchantData?.paypal_dispute as Record<string, unknown> | undefined;
  const caseReasonData = caseReason?.caseReason as Record<string, unknown> | undefined;
  const countObj = caseReasonData?.count as Record<string, Record<string, unknown>> | undefined;
  const flat = flattenCaseReasonCountsDynamic(countObj ?? undefined);
  if (flat.length === 0) return { data: [], series: [] };

  const months = [...new Set(flat.map((r) => r.dispute_month))].sort();
  const { keys: categories, displayName } = uniqueCategoriesFromFlat(flat);

  const data = months.map((period) => {
    const row: { period: string; [key: string]: string | number | undefined } = { period };
    for (const cat of categories) {
      const items = flat.filter((f) => f.dispute_month === period && f.category.trim() === cat);
      row[cat] = items.reduce((sum, f) => sum + f.count, 0);
    }
    return row;
  });

  const series: LineSeriesConfig[] = categories.map((cat, i) => ({
    dataKey: cat,
    name: displayName(cat),
    stroke: DISPUTE_REASON_CHART_COLORS[i % DISPUTE_REASON_CHART_COLORS.length],
  }));

  return { data, series };
}

/**
 * Build PayPal Dispute Reason Development Over Time chart from merchant_data API paypal_dispute.caseReason.percentage.
 * Same shape as dispute reason (flatten + pivot); uses .percentage instead of .count; categories deduped so each series appears once.
 */
function getDisputeReasonOverTimeChartFromMerchantData(
  merchantData: MerchantDataResponse | null
): { data: { period: string; [key: string]: string | number | undefined }[]; series: LineSeriesConfig[] } {
  const caseReason = merchantData?.paypal_dispute as Record<string, unknown> | undefined;
  const caseReasonData = caseReason?.caseReason as Record<string, unknown> | undefined;
  const percentageObj = caseReasonData?.percentage as Record<string, Record<string, unknown>> | undefined;
  const flat = flattenCaseReasonCountsDynamic(percentageObj ?? undefined);
  if (flat.length === 0) return { data: [], series: [] };

  const months = [...new Set(flat.map((r) => r.dispute_month))].sort();
  const { keys: categories, displayName } = uniqueCategoriesFromFlat(flat);

  const data = months.map((period) => {
    const row: { period: string; [key: string]: string | number | undefined } = { period };
    for (const cat of categories) {
      const items = flat.filter((f) => f.dispute_month === period && f.category.trim() === cat);
      row[cat] = items.reduce((sum, f) => sum + f.count, 0);
    }
    return row;
  });

  const series: LineSeriesConfig[] = categories.map((cat, i) => ({
    dataKey: cat,
    name: displayName(cat),
    stroke: DISPUTE_REASON_CHART_COLORS[i % DISPUTE_REASON_CHART_COLORS.length],
  }));

  return { data, series };
}

/**
 * Build PayPal Dispute Type chart from merchant_data API paypal_dispute.caseType.count.
 * Same shape as dispute reason (flatten + pivot); categories deduped so each series appears once.
 */
function getDisputeTypeChartFromMerchantData(
  merchantData: MerchantDataResponse | null
): { data: { period: string; [key: string]: string | number | undefined }[]; series: LineSeriesConfig[] } {
  const paypalDispute = merchantData?.paypal_dispute as Record<string, unknown> | undefined;
  const caseTypeData = paypalDispute?.caseType as Record<string, unknown> | undefined;
  const countObj = caseTypeData?.count as Record<string, Record<string, unknown>> | undefined;
  const flat = flattenCaseReasonCountsDynamic(countObj ?? undefined);
  if (flat.length === 0) return { data: [], series: [] };

  const months = [...new Set(flat.map((r) => r.dispute_month))].sort();
  const { keys: categories, displayName } = uniqueCategoriesFromFlat(flat);

  const data = months.map((period) => {
    const row: { period: string; [key: string]: string | number | undefined } = { period };
    for (const cat of categories) {
      const items = flat.filter((f) => f.dispute_month === period && f.category.trim() === cat);
      row[cat] = items.reduce((sum, f) => sum + f.count, 0);
    }
    return row;
  });

  const series: LineSeriesConfig[] = categories.map((cat, i) => ({
    dataKey: cat,
    name: displayName(cat),
    stroke: DISPUTE_REASON_CHART_COLORS[i % DISPUTE_REASON_CHART_COLORS.length],
  }));

  return { data, series };
}

/**
 * Build PayPal Dispute Type Over Time chart from merchant_data API paypal_dispute.caseType.percentage.
 * Same shape as dispute type (flatten + pivot); uses .percentage instead of .count; categories deduped.
 */
function getDisputeTypeOverTimeChartFromMerchantData(
  merchantData: MerchantDataResponse | null
): { data: { period: string; [key: string]: string | number | undefined }[]; series: LineSeriesConfig[] } {
  const paypalDispute = merchantData?.paypal_dispute as Record<string, unknown> | undefined;
  const caseTypeData = paypalDispute?.caseType as Record<string, unknown> | undefined;
  const percentageObj = caseTypeData?.percentage as Record<string, Record<string, unknown>> | undefined;
  const flat = flattenCaseReasonCountsDynamic(percentageObj ?? undefined);
  if (flat.length === 0) return { data: [], series: [] };

  const months = [...new Set(flat.map((r) => r.dispute_month))].sort();
  const { keys: categories, displayName } = uniqueCategoriesFromFlat(flat);

  const data = months.map((period) => {
    const row: { period: string; [key: string]: string | number | undefined } = { period };
    for (const cat of categories) {
      const items = flat.filter((f) => f.dispute_month === period && f.category.trim() === cat);
      row[cat] = items.reduce((sum, f) => sum + f.count, 0);
    }
    return row;
  });

  const series: LineSeriesConfig[] = categories.map((cat, i) => ({
    dataKey: cat,
    name: displayName(cat),
    stroke: DISPUTE_REASON_CHART_COLORS[i % DISPUTE_REASON_CHART_COLORS.length],
  }));

  return { data, series };
}

/**
 * Build PayPal Dispute Outcome chart from merchant_data API paypal_dispute.disputeOutcome.count.
 * Same shape as dispute reason (flatten + pivot); categories deduped so each series appears once.
 */
function getDisputeOutcomeChartFromMerchantData(
  merchantData: MerchantDataResponse | null
): { data: { period: string; [key: string]: string | number | undefined }[]; series: LineSeriesConfig[] } {
  const paypalDispute = merchantData?.paypal_dispute as Record<string, unknown> | undefined;
  const outcomeData = paypalDispute?.disputeOutcome as Record<string, unknown> | undefined;
  const countObj = outcomeData?.count as Record<string, Record<string, unknown>> | undefined;
  const flat = flattenCaseReasonCountsDynamic(countObj ?? undefined);
  if (flat.length === 0) return { data: [], series: [] };

  const months = [...new Set(flat.map((r) => r.dispute_month))].sort();
  const { keys: categories, displayName } = uniqueCategoriesFromFlat(flat);

  const data = months.map((period) => {
    const row: { period: string; [key: string]: string | number | undefined } = { period };
    for (const cat of categories) {
      const items = flat.filter((f) => f.dispute_month === period && f.category.trim() === cat);
      row[cat] = items.reduce((sum, f) => sum + f.count, 0);
    }
    return row;
  });

  const series: LineSeriesConfig[] = categories.map((cat, i) => ({
    dataKey: cat,
    name: displayName(cat),
    stroke: DISPUTE_REASON_CHART_COLORS[i % DISPUTE_REASON_CHART_COLORS.length],
  }));

  return { data, series };
}

/**
 * Build PayPal Dispute Outcome Over Time chart from merchant_data API paypal_dispute.disputeOutcome.percentage.
 * Same shape as dispute outcome (flatten + pivot); uses .percentage instead of .count; categories deduped.
 */
function getDisputeOutcomeOverTimeChartFromMerchantData(
  merchantData: MerchantDataResponse | null
): { data: { period: string; [key: string]: string | number | undefined }[]; series: LineSeriesConfig[] } {
  const paypalDispute = merchantData?.paypal_dispute as Record<string, unknown> | undefined;
  const outcomeData = paypalDispute?.disputeOutcome as Record<string, unknown> | undefined;
  const percentageObj = outcomeData?.percentage as Record<string, Record<string, unknown>> | undefined;
  const flat = flattenCaseReasonCountsDynamic(percentageObj ?? undefined);
  if (flat.length === 0) return { data: [], series: [] };

  const months = [...new Set(flat.map((r) => r.dispute_month))].sort();
  const { keys: categories, displayName } = uniqueCategoriesFromFlat(flat);

  const data = months.map((period) => {
    const row: { period: string; [key: string]: string | number | undefined } = { period };
    for (const cat of categories) {
      const items = flat.filter((f) => f.dispute_month === period && f.category.trim() === cat);
      row[cat] = items.reduce((sum, f) => sum + f.count, 0);
    }
    return row;
  });

  const series: LineSeriesConfig[] = categories.map((cat, i) => ({
    dataKey: cat,
    name: displayName(cat),
    stroke: DISPUTE_REASON_CHART_COLORS[i % DISPUTE_REASON_CHART_COLORS.length],
  }));

  return { data, series };
}

/**
 * Build PayPal Dispute Delay By Currency chart from merchant_data API paypal_dispute.disputeDelay.byCurrency.
 * Same flatten + pivot; categories (currencies) deduped so each series appears once.
 */
function getDisputeDelayByCurrencyChartFromMerchantData(
  merchantData: MerchantDataResponse | null
): { data: { period: string; [key: string]: string | number | undefined }[]; series: LineSeriesConfig[] } {
  const paypalDispute = merchantData?.paypal_dispute as Record<string, unknown> | undefined;
  const delayData = paypalDispute?.disputeDelay as Record<string, unknown> | undefined;
  const byCurrencyObj = delayData?.byCurrency as Record<string, Record<string, unknown>> | undefined;
  const flat = flattenCaseReasonCountsDynamic(byCurrencyObj ?? undefined);
  if (flat.length === 0) return { data: [], series: [] };

  const months = [...new Set(flat.map((r) => r.dispute_month))].sort();
  const { keys: categories, displayName } = uniqueCategoriesFromFlat(flat);

  const data = months.map((period) => {
    const row: { period: string; [key: string]: string | number | undefined } = { period };
    for (const cat of categories) {
      const items = flat.filter((f) => f.dispute_month === period && f.category.trim() === cat);
      row[cat] = items.reduce((sum, f) => sum + f.count, 0);
    }
    return row;
  });

  const series: LineSeriesConfig[] = categories.map((cat, i) => ({
    dataKey: cat,
    name: displayName(cat),
    stroke: DISPUTE_REASON_CHART_COLORS[i % DISPUTE_REASON_CHART_COLORS.length],
  }));

  return { data, series };
}

/**
 * Build PayPal Dispute Delay By Case Reason chart from merchant_data API paypal_dispute.disputeDelay.byCaseReason.
 * Same flatten + pivot; categories (case reasons) deduped so each series appears once.
 */
function getDisputeDelayByCaseReasonChartFromMerchantData(
  merchantData: MerchantDataResponse | null
): { data: { period: string; [key: string]: string | number | undefined }[]; series: LineSeriesConfig[] } {
  const paypalDispute = merchantData?.paypal_dispute as Record<string, unknown> | undefined;
  const delayData = paypalDispute?.disputeDelay as Record<string, unknown> | undefined;
  const byCaseReasonObj = delayData?.byCaseReason as Record<string, Record<string, unknown>> | undefined;
  const flat = flattenCaseReasonCountsDynamic(byCaseReasonObj ?? undefined);
  if (flat.length === 0) return { data: [], series: [] };

  const months = [...new Set(flat.map((r) => r.dispute_month))].sort();
  const { keys: categories, displayName } = uniqueCategoriesFromFlat(flat);

  const data = months.map((period) => {
    const row: { period: string; [key: string]: string | number | undefined } = { period };
    for (const cat of categories) {
      const items = flat.filter((f) => f.dispute_month === period && f.category.trim() === cat);
      row[cat] = items.reduce((sum, f) => sum + f.count, 0);
    }
    return row;
  });

  const series: LineSeriesConfig[] = categories.map((cat, i) => ({
    dataKey: cat,
    name: displayName(cat),
    stroke: DISPUTE_REASON_CHART_COLORS[i % DISPUTE_REASON_CHART_COLORS.length],
  }));

  return { data, series };
}

/**
 * Build PayPal Dispute Delay By Case Type chart from merchant_data API paypal_dispute.disputeDelay.byCaseType.
 * Same flatten + pivot; categories (case types) deduped so each series appears once.
 */
function getDisputeDelayByCaseTypeChartFromMerchantData(
  merchantData: MerchantDataResponse | null
): { data: { period: string; [key: string]: string | number | undefined }[]; series: LineSeriesConfig[] } {
  const paypalDispute = merchantData?.paypal_dispute as Record<string, unknown> | undefined;
  const delayData = paypalDispute?.disputeDelay as Record<string, unknown> | undefined;
  const byCaseTypeObj = delayData?.byCaseType as Record<string, Record<string, unknown>> | undefined;
  const flat = flattenCaseReasonCountsDynamic(byCaseTypeObj ?? undefined);
  if (flat.length === 0) return { data: [], series: [] };

  const months = [...new Set(flat.map((r) => r.dispute_month))].sort();
  const { keys: categories, displayName } = uniqueCategoriesFromFlat(flat);

  const data = months.map((period) => {
    const row: { period: string; [key: string]: string | number | undefined } = { period };
    for (const cat of categories) {
      const items = flat.filter((f) => f.dispute_month === period && f.category.trim() === cat);
      row[cat] = items.reduce((sum, f) => sum + f.count, 0);
    }
    return row;
  });

  const series: LineSeriesConfig[] = categories.map((cat, i) => ({
    dataKey: cat,
    name: displayName(cat),
    stroke: DISPUTE_REASON_CHART_COLORS[i % DISPUTE_REASON_CHART_COLORS.length],
  }));

  return { data, series };
}

const MERCHANT_PAYPAL_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: "merchantId", header: "Merchant ID" },
  { key: "balance", header: "Balance", render: (v) => formatCurrency(Number(v)) },
  { key: "currency", header: "Currency" },
  { key: "pending", header: "Pending", render: (v) => formatCurrency(Number(v)) },
  { key: "available", header: "Available", render: (v) => formatCurrency(Number(v)) },
  { key: "asOf", header: "As of" },
];

const MERCHANT_MASTER_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: "accountName", header: "Account name" },
  { key: "totalBalance", header: "Total balance", render: (v) => formatCurrency(Number(v)) },
  { key: "holdBalance", header: "Hold balance", render: (v) => formatCurrency(Number(v)) },
  { key: "currency", header: "Currency" },
  { key: "lastUpdated", header: "Last updated" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

function getDefaultDateRange() {
  const year = new Date().getFullYear();
  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);
  const [data, setData] = useState<DashboardSourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [source, setSource] = useState<DashboardSourceType>("all");
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [currency, setCurrency] = useState("EUR");
  /** Merchant data API response – for dashboard data */
  const [merchantData, setMerchantData] = useState<MerchantDataResponse | null>(null);
  const [merchantDataError, setMerchantDataError] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  useEffect(() => {
    setDashboardError(null);
    getDashboardSourceData()
      .then((d) => {
        setData(d);
        setDashboardError(null);
      })
      .catch((err) => {
        setData(null);
        const message = err instanceof Error ? err.message : String(err);
        setDashboardError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Call merchant_data API on dashboard page load (after auth ready) and when filters change
  useEffect(() => {
    if (authLoading) {
      console.log("[Merchant Data API] Skipped: auth still loading.");
      return;
    }
    if (!token) {
      setMerchantData(null);
      setMerchantDataError("Not logged in (no token).");
      console.log("[Merchant Data API] Skipped: no token.");
      return;
    }
    const merchantId = user?.companyProfileId;
    if (!merchantId) {
      setMerchantData(null);
      setMerchantDataError("Logged in but no company_profile_id. Your user may need a company_profile_id from auth/me.");
      console.log("[Merchant Data API] Skipped: no merchant_id (companyProfileId:", user?.companyProfileId, "companyId:", user?.companyId, "id:", user?.id, ").");
      return;
    }
    setMerchantDataError(null);
    console.log("[Merchant Data API] Calling with merchant_id:", merchantId, "currency:", currency, "dateRange:", dateRange);
    getMerchantData(
      {
        record_currency: currency,
        start_date: dateRange.from,
        end_date: dateRange.to,
        merchant_id: merchantId,
      },
      token
    )
      .then((res) => {
        setMerchantData(res);
        setMerchantDataError(null);
        console.log("[Merchant Data API]", res);
      })
      .catch((err) => {
        setMerchantData(null);
        const message = err instanceof Error ? err.message : String(err);
        setMerchantDataError(message);
        toast.error(message);
        console.warn("[Merchant Data API] Error:", err);
      });
  }, [authLoading, token, user?.companyProfileId, user?.companyId, user?.id, currency, dateRange.from, dateRange.to]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loading size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-theme-border bg-theme-surface p-8 text-center">
        <p className="text-theme-text-muted">Failed to load dashboard data.</p>
        {dashboardError && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
            {dashboardError}
          </p>
        )}
      </div>
    );
  }

  const kpis = getKpisForSource(source, data);

  // PayPal Balance Summary table from merchant_data API (paypal_master.kpi) when available
  const balanceSummaryFromMerchant = getPaypalBalanceSummaryFromMerchantData(merchantData);
  const paypalBalanceSummaryColumns =
    balanceSummaryFromMerchant.rows.length > 0
      ? balanceSummaryFromMerchant.columns
      : BALANCE_SUMMARY_COLUMNS;
  const paypalBalanceSummaryRows =
    balanceSummaryFromMerchant.rows.length > 0
      ? balanceSummaryFromMerchant.rows
      : (data.paypalBalanceSummary?.balanceSummaryTable as unknown as Record<string, unknown>[]) ?? [];

  // Merchant PayPal table from merchant_data API (paypal_master.merchant_paypal) when available
  const merchantPaypalFromMerchant = getMerchantPaypalFromMerchantData(merchantData);
  const paypalMerchantPaypalColumns =
    merchantPaypalFromMerchant.rows.length > 0
      ? merchantPaypalFromMerchant.columns
      : MERCHANT_PAYPAL_COLUMNS;
  const paypalMerchantPaypalRows =
    merchantPaypalFromMerchant.rows.length > 0
      ? merchantPaypalFromMerchant.rows
      : (data.paypalBalanceSummary?.merchantPaypalTable as unknown as Record<string, unknown>[]) ?? [];

  // Merchant PayPal Master table from merchant_data API (paypal_master.merchant_paypal, allowed columns)
  const merchantPaypalMasterFromMerchant = getMerchantPaypalMasterFromMerchantData(merchantData);
  const paypalMerchantMasterColumns =
    merchantPaypalMasterFromMerchant.rows.length > 0
      ? merchantPaypalMasterFromMerchant.columns
      : MERCHANT_MASTER_COLUMNS;
  const paypalMerchantMasterRows =
    merchantPaypalMasterFromMerchant.rows.length > 0
      ? merchantPaypalMasterFromMerchant.rows
      : (data.paypalBalanceSummary?.merchantPaypalMasterTable as unknown as Record<string, unknown>[]) ?? [];

  // PayPal Dispute Reason chart from merchant_data API (paypal_dispute.caseReason.count)
  const disputeReasonChartFromMerchant = getDisputeReasonChartFromMerchantData(merchantData);
  const paypalDisputeReasonChartData =
    disputeReasonChartFromMerchant.data.length > 0
      ? disputeReasonChartFromMerchant.data
      : data.paypalDisputeSection?.disputeReason ?? [];
  const paypalDisputeReasonChartSeries =
    disputeReasonChartFromMerchant.series.length > 0
      ? disputeReasonChartFromMerchant.series
      : [{ dataKey: "value", name: "Count", stroke: "#6366f1" }];

  // PayPal Dispute Reason Development Over Time from merchant_data (paypal_dispute.caseReason.percentage)
  const disputeReasonOverTimeChartFromMerchant = getDisputeReasonOverTimeChartFromMerchantData(merchantData);
  const paypalDisputeReasonOverTimeChartData =
    disputeReasonOverTimeChartFromMerchant.data.length > 0
      ? disputeReasonOverTimeChartFromMerchant.data
      : data.paypalDisputeSection?.disputeReasonOverTime ?? [];
  const paypalDisputeReasonOverTimeChartSeries =
    disputeReasonOverTimeChartFromMerchant.series.length > 0
      ? disputeReasonOverTimeChartFromMerchant.series
      : [{ dataKey: "value", name: "Count", stroke: "#6366f1" }];

  // PayPal Dispute Type chart from merchant_data (paypal_dispute.caseType.count)
  const disputeTypeChartFromMerchant = getDisputeTypeChartFromMerchantData(merchantData);
  const paypalDisputeTypeChartData =
    disputeTypeChartFromMerchant.data.length > 0
      ? disputeTypeChartFromMerchant.data
      : data.paypalDisputeSection?.disputeType ?? [];
  const paypalDisputeTypeChartSeries =
    disputeTypeChartFromMerchant.series.length > 0
      ? disputeTypeChartFromMerchant.series
      : [{ dataKey: "value", name: "Count", stroke: "#6366f1" }];

  // PayPal Dispute Type Over Time from merchant_data (paypal_dispute.caseType.percentage)
  const disputeTypeOverTimeChartFromMerchant = getDisputeTypeOverTimeChartFromMerchantData(merchantData);
  const paypalDisputeTypeOverTimeChartData =
    disputeTypeOverTimeChartFromMerchant.data.length > 0
      ? disputeTypeOverTimeChartFromMerchant.data
      : data.paypalDisputeSection?.disputeTypeOverTime ?? [];
  const paypalDisputeTypeOverTimeChartSeries =
    disputeTypeOverTimeChartFromMerchant.series.length > 0
      ? disputeTypeOverTimeChartFromMerchant.series
      : [{ dataKey: "value", name: "Count", stroke: "#6366f1" }];

  // PayPal Dispute Outcome chart from merchant_data (paypal_dispute.disputeOutcome.count)
  const disputeOutcomeChartFromMerchant = getDisputeOutcomeChartFromMerchantData(merchantData);
  const paypalDisputeOutcomeChartData =
    disputeOutcomeChartFromMerchant.data.length > 0
      ? disputeOutcomeChartFromMerchant.data
      : data.paypalDisputeSection?.disputeOutcome ?? [];
  const paypalDisputeOutcomeChartSeries =
    disputeOutcomeChartFromMerchant.series.length > 0
      ? disputeOutcomeChartFromMerchant.series
      : [{ dataKey: "value", name: "Count", stroke: "#6366f1" }];

  // PayPal Dispute Outcome Over Time from merchant_data (paypal_dispute.disputeOutcome.percentage)
  const disputeOutcomeOverTimeChartFromMerchant = getDisputeOutcomeOverTimeChartFromMerchantData(merchantData);
  const paypalDisputeOutcomeOverTimeChartData =
    disputeOutcomeOverTimeChartFromMerchant.data.length > 0
      ? disputeOutcomeOverTimeChartFromMerchant.data
      : data.paypalDisputeSection?.disputeOutcomeOverTime ?? [];
  const paypalDisputeOutcomeOverTimeChartSeries =
    disputeOutcomeOverTimeChartFromMerchant.series.length > 0
      ? disputeOutcomeOverTimeChartFromMerchant.series
      : [{ dataKey: "value", name: "Count", stroke: "#6366f1" }];

  // PayPal Dispute Delay By Currency from merchant_data (paypal_dispute.disputeDelay.byCurrency)
  const disputeDelayByCurrencyChartFromMerchant = getDisputeDelayByCurrencyChartFromMerchantData(merchantData);
  const paypalDisputeDelayByCurrencyChartData =
    disputeDelayByCurrencyChartFromMerchant.data.length > 0
      ? disputeDelayByCurrencyChartFromMerchant.data
      : data.paypalDisputeSection?.disputeDelayByCurrency ?? [];
  const paypalDisputeDelayByCurrencyChartSeries =
    disputeDelayByCurrencyChartFromMerchant.series.length > 0
      ? disputeDelayByCurrencyChartFromMerchant.series
      : [
          { dataKey: "USD", name: "USD", stroke: "#3b82f6" },
          { dataKey: "EUR", name: "EUR", stroke: "#22c55e" },
          { dataKey: "GBP", name: "GBP", stroke: "#f59e0b" },
        ];

  // PayPal Dispute Delay By Case Reason from merchant_data (paypal_dispute.disputeDelay.byCaseReason)
  const disputeDelayByCaseReasonChartFromMerchant = getDisputeDelayByCaseReasonChartFromMerchantData(merchantData);
  const paypalDisputeDelayByCaseReasonChartData =
    disputeDelayByCaseReasonChartFromMerchant.data.length > 0
      ? disputeDelayByCaseReasonChartFromMerchant.data
      : data.paypalDisputeSection?.disputeDelayByCaseReason ?? [];
  const paypalDisputeDelayByCaseReasonChartSeries =
    disputeDelayByCaseReasonChartFromMerchant.series.length > 0
      ? disputeDelayByCaseReasonChartFromMerchant.series
      : [
          { dataKey: "Item not received", name: "Item not received", stroke: "#3b82f6" },
          { dataKey: "Unauthorized", name: "Unauthorized", stroke: "#ef4444" },
          { dataKey: "Duplicate", name: "Duplicate", stroke: "#8b5cf6" },
        ];

  // PayPal Dispute Delay By Case Type from merchant_data (paypal_dispute.disputeDelay.byCaseType)
  const disputeDelayByCaseTypeChartFromMerchant = getDisputeDelayByCaseTypeChartFromMerchantData(merchantData);
  const paypalDisputeDelayByCaseTypeChartData =
    disputeDelayByCaseTypeChartFromMerchant.data.length > 0
      ? disputeDelayByCaseTypeChartFromMerchant.data
      : data.paypalDisputeSection?.disputeDelayByCaseType ?? [];
  const paypalDisputeDelayByCaseTypeChartSeries =
    disputeDelayByCaseTypeChartFromMerchant.series.length > 0
      ? disputeDelayByCaseTypeChartFromMerchant.series
      : [
          { dataKey: "Chargeback", name: "Chargeback", stroke: "#ef4444" },
          { dataKey: "Claim", name: "Claim", stroke: "#f59e0b" },
          { dataKey: "Inquiry", name: "Inquiry", stroke: "#22c55e" },
        ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-theme-text">Dashboard</h1>
          <p className="mt-1 text-sm text-theme-text-muted">
            View data by source: PayPal Balance, Disputes, Reconciliation, Statement, and Stripe.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJsonModal(true)}
            className="shrink-0 border-theme-border text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-elevated"
            title="View merchant data API response (testing)"
          >
            View API response
          </Button>
          <div className="flex items-center rounded-xl border border-theme-border bg-theme-surface shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-r border-theme-border">
              <Calendar className="h-4 w-4 shrink-0 text-theme-text-muted" aria-hidden />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className="min-w-0 w-[120px] rounded border-0 bg-transparent py-0.5 text-sm text-theme-text focus:outline-none focus:ring-0 [color-scheme:inherit]"
              aria-label="From date"
            />
            <span className="text-theme-text-muted text-sm">–</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className="min-w-0 w-[120px] rounded border-0 bg-transparent py-0.5 text-sm text-theme-text focus:outline-none focus:ring-0 [color-scheme:inherit]"
              aria-label="To date"
            />
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-full min-w-[88px] rounded-none border-0 bg-transparent px-4 py-2.5 text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-inset focus:ring-theme-accent"
            aria-label="Currency"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          </div>
        </div>
      </div>

      <Modal
        open={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        title="Merchant Data API Response (testing)"
        size="xl"
      >
        <div className="p-4">
          {merchantData ? (
            <pre className="max-h-[70vh] overflow-auto rounded-lg border border-theme-border bg-theme-bg-muted p-4 text-left text-sm text-theme-text whitespace-pre-wrap break-words font-mono">
              {JSON.stringify(merchantData, null, 2)}
            </pre>
          ) : (
            <div className="space-y-2 text-sm text-theme-text-muted">
              <p>No response yet.</p>
              {merchantDataError && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-amber-800 dark:text-amber-200 font-medium">
                  {merchantDataError}
                </p>
              )}
              <p>Check the browser console (F12 → Console) for more details.</p>
            </div>
          )}
        </div>
      </Modal>

      <SourceTabs selected={source} onSelect={setSource} />

      <div className="space-y-8">
        <SectionKpiBar metrics={kpis} />

        {source === "all" && (
          <>
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-theme-text">PayPal Balance Summary</h2>
              {data.paypalBalanceSummary ? (
                <>
                  <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-3">
                    <TableWithCsvDownload
                      title="PayPal Balance Summary"
                      columns={paypalBalanceSummaryColumns}
                      rows={paypalBalanceSummaryRows}
                      filename="paypal-balance-summary.csv"
                    />
                    <TableWithCsvDownload
                      title="Merchant PayPal"
                      columns={paypalMerchantPaypalColumns}
                      rows={paypalMerchantPaypalRows}
                      filename="merchant-paypal.csv"
                    />
                    <TableWithCsvDownload
                      title="Merchant PayPal Master"
                      columns={paypalMerchantMasterColumns}
                      rows={paypalMerchantMasterRows}
                      filename="merchant-paypal-master.csv"
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                    <LineGraphWithImageDownload
                      title="PayPal Balance"
                      data={data.paypalBalanceSummary.paypalBalanceChart}
                      filename="paypal-balance-chart.png"
                    />
                    <LineGraphWithImageDownload
                      title="Volume at Risk"
                      data={data.paypalBalanceSummary.volumeAtRiskChart}
                      series={[{ dataKey: "value", name: "Volume at risk", stroke: "#ef4444" }]}
                      filename="volume-at-risk-chart.png"
                    />
                    <LineGraphWithImageDownload
                      title="Rolling Reserve Levels vs Risk"
                      data={data.paypalBalanceSummary.rollingReserveVsRiskChart}
                      series={[{ dataKey: "value", name: "Reserve %", stroke: "#f59e0b" }]}
                      filename="rolling-reserve-vs-risk-chart.png"
                    />
                    <LineGraphWithImageDownload
                      title="PayPal Dispute Delay"
                      data={data.paypalBalanceSummary.paypalDisputeDelayChart}
                      series={[{ dataKey: "value", name: "Days", stroke: "#8b5cf6" }]}
                      filename="paypal-dispute-delay-chart.png"
                    />
                  </div>
                </>
              ) : (
                <>
                  <BalanceTable rows={data.paypalBalance.table} />
                  {data.paypalBalance.chart?.length ? (
                    <SourceLineChart title="Balance" data={data.paypalBalance.chart} />
                  ) : null}
                </>
              )}
            </section>
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-theme-text">PayPal Dispute</h2>
              {data.paypalDisputeSection ? (
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Reason"
                    data={paypalDisputeReasonChartData}
                    series={paypalDisputeReasonChartSeries}
                    filename="paypal-dispute-reason.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Reason Development Over Time"
                    data={paypalDisputeReasonOverTimeChartData}
                    series={paypalDisputeReasonOverTimeChartSeries}
                    filename="paypal-dispute-reason-over-time.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Type"
                    data={paypalDisputeTypeChartData}
                    series={paypalDisputeTypeChartSeries}
                    filename="paypal-dispute-type.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Type Over Time"
                    data={paypalDisputeTypeOverTimeChartData}
                    series={paypalDisputeTypeOverTimeChartSeries}
                    filename="paypal-dispute-type-over-time.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Outcome"
                    data={paypalDisputeOutcomeChartData}
                    series={paypalDisputeOutcomeChartSeries}
                    filename="paypal-dispute-outcome.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Outcome Over Time"
                    data={paypalDisputeOutcomeOverTimeChartData}
                    series={paypalDisputeOutcomeOverTimeChartSeries}
                    filename="paypal-dispute-outcome-over-time.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Delay By Currency"
                    data={paypalDisputeDelayByCurrencyChartData}
                    series={paypalDisputeDelayByCurrencyChartSeries}
                    filename="paypal-dispute-delay-by-currency.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Delay By Case Reason"
                    data={paypalDisputeDelayByCaseReasonChartData}
                    series={paypalDisputeDelayByCaseReasonChartSeries}
                    filename="paypal-dispute-delay-by-case-reason.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Delay By Case Type"
                    data={paypalDisputeDelayByCaseTypeChartData}
                    series={paypalDisputeDelayByCaseTypeChartSeries}
                    filename="paypal-dispute-delay-by-case-type.png"
                  />
                </div>
              ) : (
                <>
                  <DisputeTable rows={data.paypalDispute.table} />
                  {data.paypalDispute.chart?.length ? (
                    <SourceLineChart title="Disputes" data={data.paypalDispute.chart} />
                  ) : null}
                </>
              )}
            </section>
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-theme-text">PayPal Reconciliation</h2>
              {data.paypalReconciliationSection ? (
                <>
                  <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-3">
                    <TableWithCsvDownload
                      title="PayPal Reconciliation"
                      columns={[
                        { key: "date", header: "Date" },
                        { key: "type", header: "Type" },
                        { key: "description", header: "Description" },
                        { key: "amount", header: "Amount", render: (v) => formatCurrency(Number(v)) },
                        { key: "balance", header: "Balance", render: (v) => formatCurrency(Number(v)) },
                        { key: "reference", header: "Reference" },
                      ]}
                      rows={data.paypalReconciliationSection.reconciliationTable as unknown as Record<string, unknown>[]}
                      filename="paypal-reconciliation.csv"
                    />
                    <TableWithCsvDownload
                      title="Merchant PayPal"
                      columns={MERCHANT_PAYPAL_COLUMNS}
                      rows={data.paypalReconciliationSection.merchantPaypalTable as unknown as Record<string, unknown>[]}
                      filename="merchant-paypal-reconciliation.csv"
                    />
                    <TableWithCsvDownload
                      title="Merchant PayPal Master"
                      columns={MERCHANT_MASTER_COLUMNS}
                      rows={data.paypalReconciliationSection.merchantPaypalMasterTable as unknown as Record<string, unknown>[]}
                      filename="merchant-paypal-master-reconciliation.csv"
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                    <LineGraphWithImageDownload
                      title="PayPal Reconciliation Balance"
                      data={data.paypalReconciliationSection.reconciliationBalanceChart}
                      series={[{ dataKey: "value", name: "Balance", stroke: "#22c55e" }]}
                      filename="paypal-reconciliation-balance.png"
                    />
                    <LineGraphWithImageDownload
                      title="Volume at Risk"
                      data={data.paypalReconciliationSection.volumeAtRiskChart}
                      series={[{ dataKey: "value", name: "Volume at risk", stroke: "#ef4444" }]}
                      filename="volume-at-risk-reconciliation.png"
                    />
                    <LineGraphWithImageDownload
                      title="Rolling Reserve Levels vs Risk"
                      data={data.paypalReconciliationSection.rollingReserveVsRiskChart}
                      series={[{ dataKey: "value", name: "Reserve %", stroke: "#f59e0b" }]}
                      filename="rolling-reserve-levels-vs-risk.png"
                    />
                  </div>
                </>
              ) : (
                <>
                  <ReconciliationTable rows={data.paypalReconciliation.table} />
                  {data.paypalReconciliation.chart?.length ? (
                    <SourceLineChart title="Reconciliation" data={data.paypalReconciliation.chart} />
                  ) : null}
                </>
              )}
            </section>
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-theme-text">PayPal Statement</h2>
              <StatementTable rows={data.paypalStatement.table} />
            </section>
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-theme-text">Stripe</h2>
              {data.stripeSection ? (
                <>
                  <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
                    <TableWithCsvDownload
                      title="Stripe"
                      columns={[
                        { key: "date", header: "Date" },
                        { key: "description", header: "Description" },
                        { key: "type", header: "Type" },
                        { key: "amount", header: "Amount", render: (v, row) => formatCurrency(Number(v), row.currency as string) },
                        { key: "status", header: "Status" },
                      ]}
                      rows={data.stripeSection.stripeTable as unknown as Record<string, unknown>[]}
                      filename="stripe.csv"
                    />
                    <TableWithCsvDownload
                      title="Stripe Summary"
                      columns={[
                        { key: "period", header: "Period" },
                        { key: "totalVolume", header: "Total volume", render: (v, row) => formatCurrency(Number(v), row.currency as string) },
                        { key: "totalFees", header: "Total fees", render: (v, row) => formatCurrency(Number(v), row.currency as string) },
                        { key: "netBalance", header: "Net balance", render: (v, row) => formatCurrency(Number(v), row.currency as string) },
                        { key: "transactionCount", header: "Transactions" },
                        { key: "currency", header: "Currency" },
                      ]}
                      rows={data.stripeSection.stripeSummaryTable as unknown as Record<string, unknown>[]}
                      filename="stripe-summary.csv"
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                    <LineGraphWithImageDownload
                      title="Stripe Balance"
                      data={data.stripeSection.stripeBalanceChart}
                      series={[{ dataKey: "value", name: "Balance", stroke: "#8b5cf6" }]}
                      filename="stripe-balance.png"
                    />
                    <LineGraphWithImageDownload
                      title="Rolling Reserve Levels vs Risk"
                      data={data.stripeSection.rollingReserveVsRiskChart}
                      series={[{ dataKey: "value", name: "Reserve %", stroke: "#f59e0b" }]}
                      filename="stripe-rolling-reserve-levels-vs-risk.png"
                    />
                  </div>
                </>
              ) : (
                <>
                  <StripeTable rows={data.stripe.table} />
                  {data.stripe.chart?.length ? (
                    <SourceLineChart title="Stripe" data={data.stripe.chart} />
                  ) : null}
                </>
              )}
            </section>
          </>
        )}

        {source === "paypal_balance" && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-theme-text">PayPal Balance Summary</h2>
            {data.paypalBalanceSummary ? (
              <>
                <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-3">
                  <TableWithCsvDownload
                    title="PayPal Balance Summary"
                    columns={paypalBalanceSummaryColumns}
                    rows={paypalBalanceSummaryRows}
                    filename="paypal-balance-summary.csv"
                  />
                  <TableWithCsvDownload
                    title="Merchant PayPal"
                    columns={paypalMerchantPaypalColumns}
                    rows={paypalMerchantPaypalRows}
                    filename="merchant-paypal.csv"
                  />
                  <TableWithCsvDownload
                    title="Merchant PayPal Master"
                    columns={paypalMerchantMasterColumns}
                    rows={paypalMerchantMasterRows}
                    filename="merchant-paypal-master.csv"
                  />
                </div>
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  <LineGraphWithImageDownload
                    title="PayPal Balance"
                    data={data.paypalBalanceSummary.paypalBalanceChart}
                    filename="paypal-balance-chart.png"
                  />
                  <LineGraphWithImageDownload
                    title="Volume at Risk"
                    data={data.paypalBalanceSummary.volumeAtRiskChart}
                    series={[{ dataKey: "value", name: "Volume at risk", stroke: "#ef4444" }]}
                    filename="volume-at-risk-chart.png"
                  />
                  <LineGraphWithImageDownload
                    title="Rolling Reserve Levels vs Risk"
                    data={data.paypalBalanceSummary.rollingReserveVsRiskChart}
                    series={[{ dataKey: "value", name: "Reserve %", stroke: "#f59e0b" }]}
                    filename="rolling-reserve-vs-risk-chart.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Delay"
                    data={data.paypalBalanceSummary.paypalDisputeDelayChart}
                    series={[{ dataKey: "value", name: "Days", stroke: "#8b5cf6" }]}
                    filename="paypal-dispute-delay-chart.png"
                  />
                </div>
              </>
            ) : (
              <>
                <BalanceTable rows={data.paypalBalance.table} />
                {data.paypalBalance.chart?.length ? (
                  <SourceLineChart title="Balance" data={data.paypalBalance.chart} />
                ) : null}
              </>
            )}
          </section>
        )}

        {source === "paypal_dispute" && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-theme-text">PayPal Dispute</h2>
            {data.paypalDisputeSection ? (
              <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Reason"
                    data={paypalDisputeReasonChartData}
                    series={paypalDisputeReasonChartSeries}
                    filename="paypal-dispute-reason.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Reason Development Over Time"
                    data={paypalDisputeReasonOverTimeChartData}
                    series={paypalDisputeReasonOverTimeChartSeries}
                    filename="paypal-dispute-reason-over-time.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Type"
                    data={paypalDisputeTypeChartData}
                    series={paypalDisputeTypeChartSeries}
                    filename="paypal-dispute-type.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Type Over Time"
                  data={paypalDisputeTypeOverTimeChartData}
                  series={paypalDisputeTypeOverTimeChartSeries}
                  filename="paypal-dispute-type-over-time.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Outcome"
                  data={paypalDisputeOutcomeChartData}
                  series={paypalDisputeOutcomeChartSeries}
                  filename="paypal-dispute-outcome.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Outcome Over Time"
                  data={paypalDisputeOutcomeOverTimeChartData}
                  series={paypalDisputeOutcomeOverTimeChartSeries}
                  filename="paypal-dispute-outcome-over-time.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Delay By Currency"
                  data={paypalDisputeDelayByCurrencyChartData}
                  series={paypalDisputeDelayByCurrencyChartSeries}
                  filename="paypal-dispute-delay-by-currency.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Delay By Case Reason"
                  data={paypalDisputeDelayByCaseReasonChartData}
                  series={paypalDisputeDelayByCaseReasonChartSeries}
                  filename="paypal-dispute-delay-by-case-reason.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Delay By Case Type"
                  data={paypalDisputeDelayByCaseTypeChartData}
                  series={paypalDisputeDelayByCaseTypeChartSeries}
                  filename="paypal-dispute-delay-by-case-type.png"
                />
              </div>
            ) : (
              <>
                <DisputeTable rows={data.paypalDispute.table} />
                {data.paypalDispute.chart?.length ? (
                  <SourceLineChart title="Disputes" data={data.paypalDispute.chart} />
                ) : null}
              </>
            )}
          </section>
        )}

        {source === "paypal_reconciliation" && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-theme-text">PayPal Reconciliation</h2>
            {data.paypalReconciliationSection ? (
              <>
                <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-3">
                  <TableWithCsvDownload
                    title="PayPal Reconciliation"
                    columns={[
                      { key: "date", header: "Date" },
                      { key: "type", header: "Type" },
                      { key: "description", header: "Description" },
                      { key: "amount", header: "Amount", render: (v) => formatCurrency(Number(v)) },
                      { key: "balance", header: "Balance", render: (v) => formatCurrency(Number(v)) },
                      { key: "reference", header: "Reference" },
                    ]}
                    rows={data.paypalReconciliationSection.reconciliationTable as unknown as Record<string, unknown>[]}
                    filename="paypal-reconciliation.csv"
                  />
                  <TableWithCsvDownload
                    title="Merchant PayPal"
                    columns={MERCHANT_PAYPAL_COLUMNS}
                    rows={data.paypalReconciliationSection.merchantPaypalTable as unknown as Record<string, unknown>[]}
                    filename="merchant-paypal-reconciliation.csv"
                  />
                  <TableWithCsvDownload
                    title="Merchant PayPal Master"
                    columns={MERCHANT_MASTER_COLUMNS}
                    rows={data.paypalReconciliationSection.merchantPaypalMasterTable as unknown as Record<string, unknown>[]}
                    filename="merchant-paypal-master-reconciliation.csv"
                  />
                </div>
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  <LineGraphWithImageDownload
                    title="PayPal Reconciliation Balance"
                    data={data.paypalReconciliationSection.reconciliationBalanceChart}
                    series={[{ dataKey: "value", name: "Balance", stroke: "#22c55e" }]}
                    filename="paypal-reconciliation-balance.png"
                  />
                  <LineGraphWithImageDownload
                    title="Volume at Risk"
                    data={data.paypalReconciliationSection.volumeAtRiskChart}
                    series={[{ dataKey: "value", name: "Volume at risk", stroke: "#ef4444" }]}
                    filename="volume-at-risk-reconciliation.png"
                  />
                  <LineGraphWithImageDownload
                    title="Rolling Reserve Levels vs Risk"
                    data={data.paypalReconciliationSection.rollingReserveVsRiskChart}
                    series={[{ dataKey: "value", name: "Reserve %", stroke: "#f59e0b" }]}
                    filename="rolling-reserve-levels-vs-risk.png"
                  />
                </div>
              </>
            ) : (
              <>
                <ReconciliationTable rows={data.paypalReconciliation.table} />
                {data.paypalReconciliation.chart?.length ? (
                  <SourceLineChart title="Reconciliation" data={data.paypalReconciliation.chart} />
                ) : null}
              </>
            )}
          </section>
        )}

        {source === "paypal_statement" && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-theme-text">PayPal Statement</h2>
            <StatementTable rows={data.paypalStatement.table} />
          </section>
        )}

        {source === "stripe" && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-theme-text">Stripe</h2>
            {data.stripeSection ? (
              <>
                <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
                  <TableWithCsvDownload
                    title="Stripe"
                    columns={[
                      { key: "date", header: "Date" },
                      { key: "description", header: "Description" },
                      { key: "type", header: "Type" },
                      { key: "amount", header: "Amount", render: (v, row) => formatCurrency(Number(v), row.currency as string) },
                      { key: "status", header: "Status" },
                    ]}
                    rows={data.stripeSection.stripeTable as unknown as Record<string, unknown>[]}
                    filename="stripe.csv"
                  />
                  <TableWithCsvDownload
                    title="Stripe Summary"
                    columns={[
                      { key: "period", header: "Period" },
                      { key: "totalVolume", header: "Total volume", render: (v, row) => formatCurrency(Number(v), row.currency as string) },
                      { key: "totalFees", header: "Total fees", render: (v, row) => formatCurrency(Number(v), row.currency as string) },
                      { key: "netBalance", header: "Net balance", render: (v, row) => formatCurrency(Number(v), row.currency as string) },
                      { key: "transactionCount", header: "Transactions" },
                      { key: "currency", header: "Currency" },
                    ]}
                    rows={data.stripeSection.stripeSummaryTable as unknown as Record<string, unknown>[]}
                    filename="stripe-summary.csv"
                  />
                </div>
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  <LineGraphWithImageDownload
                    title="Stripe Balance"
                    data={data.stripeSection.stripeBalanceChart}
                    series={[{ dataKey: "value", name: "Balance", stroke: "#8b5cf6" }]}
                    filename="stripe-balance.png"
                  />
                  <LineGraphWithImageDownload
                    title="Rolling Reserve Levels vs Risk"
                    data={data.stripeSection.rollingReserveVsRiskChart}
                    series={[{ dataKey: "value", name: "Reserve %", stroke: "#f59e0b" }]}
                    filename="stripe-rolling-reserve-levels-vs-risk.png"
                  />
                </div>
              </>
            ) : (
              <>
                <StripeTable rows={data.stripe.table} />
                {data.stripe.chart?.length ? (
                  <SourceLineChart title="Stripe" data={data.stripe.chart} />
                ) : null}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
