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
import type { DashboardSourceData, DashboardSourceType } from "@/lib/types";
import type { SectionKpiMetric } from "@/components/dashboard/section-kpi-bar";
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
import { LineGraphWithImageDownload } from "@/components/dashboard/line-graph-with-image-download";

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

// Columns for extended PayPal Balance Summary section
const BALANCE_SUMMARY_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: "account", header: "Account" },
  { key: "currency", header: "Currency" },
  { key: "available", header: "Available", render: (v, r) => formatCurrency(Number(v), r.currency as string) },
  { key: "pending", header: "Pending", render: (v, r) => formatCurrency(Number(v), r.currency as string) },
  { key: "total", header: "Total", render: (v, r) => formatCurrency(Number(v), r.currency as string) },
  { key: "asOf", header: "As of" },
];

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
  const [data, setData] = useState<DashboardSourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<DashboardSourceType>("all");
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [currency, setCurrency] = useState("EUR");

  useEffect(() => {
    getDashboardSourceData()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loading size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-theme-border bg-theme-surface p-8 text-center text-theme-text-muted">
        Failed to load dashboard data.
      </div>
    );
  }

  const kpis = getKpisForSource(source, data);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-theme-text">Dashboard</h1>
          <p className="mt-1 text-sm text-theme-text-muted">
            View data by source: PayPal Balance, Disputes, Reconciliation, Statement, and Stripe.
          </p>
        </div>
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
                      columns={BALANCE_SUMMARY_COLUMNS}
                      rows={data.paypalBalanceSummary.balanceSummaryTable as unknown as Record<string, unknown>[]}
                      filename="paypal-balance-summary.csv"
                    />
                    <TableWithCsvDownload
                      title="Merchant PayPal"
                      columns={MERCHANT_PAYPAL_COLUMNS}
                      rows={data.paypalBalanceSummary.merchantPaypalTable as unknown as Record<string, unknown>[]}
                      filename="merchant-paypal.csv"
                    />
                    <TableWithCsvDownload
                      title="Merchant PayPal Master"
                      columns={MERCHANT_MASTER_COLUMNS}
                      rows={data.paypalBalanceSummary.merchantPaypalMasterTable as unknown as Record<string, unknown>[]}
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
                    data={data.paypalDisputeSection.disputeReason}
                    series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                    filename="paypal-dispute-reason.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Reason Development Over Time"
                    data={data.paypalDisputeSection.disputeReasonOverTime}
                    series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                    filename="paypal-dispute-reason-over-time.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Type"
                    data={data.paypalDisputeSection.disputeType}
                    series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                    filename="paypal-dispute-type.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Type Over Time"
                    data={data.paypalDisputeSection.disputeTypeOverTime}
                    series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                    filename="paypal-dispute-type-over-time.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Outcome"
                    data={data.paypalDisputeSection.disputeOutcome}
                    series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                    filename="paypal-dispute-outcome.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Outcome Over Time"
                    data={data.paypalDisputeSection.disputeOutcomeOverTime}
                    series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                    filename="paypal-dispute-outcome-over-time.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Delay By Currency"
                    data={data.paypalDisputeSection.disputeDelayByCurrency}
                    series={[
                      { dataKey: "USD", name: "USD", stroke: "#3b82f6" },
                      { dataKey: "EUR", name: "EUR", stroke: "#22c55e" },
                      { dataKey: "GBP", name: "GBP", stroke: "#f59e0b" },
                    ]}
                    filename="paypal-dispute-delay-by-currency.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Delay By Case Reason"
                    data={data.paypalDisputeSection.disputeDelayByCaseReason}
                    series={[
                      { dataKey: "Item not received", name: "Item not received", stroke: "#3b82f6" },
                      { dataKey: "Unauthorized", name: "Unauthorized", stroke: "#ef4444" },
                      { dataKey: "Duplicate", name: "Duplicate", stroke: "#8b5cf6" },
                    ]}
                    filename="paypal-dispute-delay-by-case-reason.png"
                  />
                  <LineGraphWithImageDownload
                    title="PayPal Dispute Delay By Case Type"
                    data={data.paypalDisputeSection.disputeDelayByCaseType}
                    series={[
                      { dataKey: "Chargeback", name: "Chargeback", stroke: "#ef4444" },
                      { dataKey: "Claim", name: "Claim", stroke: "#f59e0b" },
                      { dataKey: "Inquiry", name: "Inquiry", stroke: "#22c55e" },
                    ]}
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
                    columns={BALANCE_SUMMARY_COLUMNS}
                    rows={data.paypalBalanceSummary.balanceSummaryTable as unknown as Record<string, unknown>[]}
                    filename="paypal-balance-summary.csv"
                  />
                  <TableWithCsvDownload
                    title="Merchant PayPal"
                    columns={MERCHANT_PAYPAL_COLUMNS}
                    rows={data.paypalBalanceSummary.merchantPaypalTable as unknown as Record<string, unknown>[]}
                    filename="merchant-paypal.csv"
                  />
                  <TableWithCsvDownload
                    title="Merchant PayPal Master"
                    columns={MERCHANT_MASTER_COLUMNS}
                    rows={data.paypalBalanceSummary.merchantPaypalMasterTable as unknown as Record<string, unknown>[]}
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
                  data={data.paypalDisputeSection.disputeReason}
                  series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                  filename="paypal-dispute-reason.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Reason Development Over Time"
                  data={data.paypalDisputeSection.disputeReasonOverTime}
                  series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                  filename="paypal-dispute-reason-over-time.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Type"
                  data={data.paypalDisputeSection.disputeType}
                  series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                  filename="paypal-dispute-type.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Type Over Time"
                  data={data.paypalDisputeSection.disputeTypeOverTime}
                  series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                  filename="paypal-dispute-type-over-time.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Outcome"
                  data={data.paypalDisputeSection.disputeOutcome}
                  series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                  filename="paypal-dispute-outcome.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Outcome Over Time"
                  data={data.paypalDisputeSection.disputeOutcomeOverTime}
                  series={[{ dataKey: "value", name: "Count", stroke: "#6366f1" }]}
                  filename="paypal-dispute-outcome-over-time.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Delay By Currency"
                  data={data.paypalDisputeSection.disputeDelayByCurrency}
                  series={[
                    { dataKey: "USD", name: "USD", stroke: "#3b82f6" },
                    { dataKey: "EUR", name: "EUR", stroke: "#22c55e" },
                    { dataKey: "GBP", name: "GBP", stroke: "#f59e0b" },
                  ]}
                  filename="paypal-dispute-delay-by-currency.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Delay By Case Reason"
                  data={data.paypalDisputeSection.disputeDelayByCaseReason}
                  series={[
                    { dataKey: "Item not received", name: "Item not received", stroke: "#3b82f6" },
                    { dataKey: "Unauthorized", name: "Unauthorized", stroke: "#ef4444" },
                    { dataKey: "Duplicate", name: "Duplicate", stroke: "#8b5cf6" },
                  ]}
                  filename="paypal-dispute-delay-by-case-reason.png"
                />
                <LineGraphWithImageDownload
                  title="PayPal Dispute Delay By Case Type"
                  data={data.paypalDisputeSection.disputeDelayByCaseType}
                  series={[
                    { dataKey: "Chargeback", name: "Chargeback", stroke: "#ef4444" },
                    { dataKey: "Claim", name: "Claim", stroke: "#f59e0b" },
                    { dataKey: "Inquiry", name: "Inquiry", stroke: "#22c55e" },
                  ]}
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
