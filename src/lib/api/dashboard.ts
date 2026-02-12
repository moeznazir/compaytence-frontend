import type {
  DashboardStats,
  PaypalDisputeDataPoint,
  DashboardSourceData,
  PaypalBalanceRow,
  PaypalDisputeRow,
  PaypalReconciliationRow,
  PaypalStatementRow,
  StripeRow,
  StripeSummaryRow,
  SourceChartPoint,
  PaypalBalanceSummaryRow,
  MerchantPaypalRow,
  MerchantPaypalMasterRow,
  DisputeChartPoint,
} from "@/lib/types";
import { mockGet } from "./client";

const MOCK_PAYPAL_DISPUTES: PaypalDisputeDataPoint[] = [
  { month: "Jan", count: 12, resolved: 10 },
  { month: "Feb", count: 15, resolved: 12 },
  { month: "Mar", count: 8, resolved: 7 },
  { month: "Apr", count: 18, resolved: 14 },
  { month: "May", count: 22, resolved: 19 },
  { month: "Jun", count: 14, resolved: 11 },
];

export async function getDashboardStats(): Promise<DashboardStats> {
  return mockGet({
    totalAssessments: 24,
    pendingApprovals: 5,
    paypalDisputes: MOCK_PAYPAL_DISPUTES,
    mockMetric1: 120,
    mockMetric2: 85,
    mockMetric3: 42,
  });
}

// --- Multi-source dashboard data (PayPal Balance, Dispute, Reconciliation, Statement, Stripe) ---

const MOCK_BALANCE: PaypalBalanceRow[] = [
  { id: "1", currency: "USD", available: 12450.0, pending: 320.5, total: 12770.5, asOf: "2024-06-01" },
  { id: "2", currency: "EUR", available: 850.0, pending: 0, total: 850.0, asOf: "2024-06-01" },
];

const MOCK_BALANCE_CHART: SourceChartPoint[] = [
  { period: "Jan", value: 10200 },
  { period: "Feb", value: 11500 },
  { period: "Mar", value: 10800 },
  { period: "Apr", value: 12100 },
  { period: "May", value: 11900 },
  { period: "Jun", value: 12770 },
];

const MOCK_DISPUTE_TABLE: PaypalDisputeRow[] = [
  { id: "1", disputeId: "PP-D-001", status: "Resolved", amount: 150, currency: "USD", reason: "Item not received", createdAt: "2024-05-01", resolvedAt: "2024-05-10" },
  { id: "2", disputeId: "PP-D-002", status: "Open", amount: 89.99, currency: "USD", reason: "Unauthorized", createdAt: "2024-05-15" },
  { id: "3", disputeId: "PP-D-003", status: "Resolved", amount: 45, currency: "USD", reason: "Duplicate", createdAt: "2024-04-20", resolvedAt: "2024-04-28" },
];

const MOCK_DISPUTE_CHART: SourceChartPoint[] = [
  { period: "Jan", value: 12, label: "Total" },
  { period: "Feb", value: 15, label: "Total" },
  { period: "Mar", value: 8, label: "Total" },
  { period: "Apr", value: 18, label: "Total" },
  { period: "May", value: 22, label: "Total" },
  { period: "Jun", value: 14, label: "Total" },
];

const MOCK_RECONCILIATION: PaypalReconciliationRow[] = [
  { id: "1", date: "2024-06-01", type: "Credit", description: "Payment received", amount: 500, balance: 12770, reference: "TXN-001" },
  { id: "2", date: "2024-06-01", type: "Debit", description: "Payout", amount: -1200, balance: 11570, reference: "PAY-001" },
  { id: "3", date: "2024-05-31", type: "Credit", description: "Refund reversed", amount: 89, balance: 12270 },
];

const MOCK_RECONCILIATION_CHART: SourceChartPoint[] = [
  { period: "Jan", value: 10200 },
  { period: "Feb", value: 11500 },
  { period: "Mar", value: 10800 },
  { period: "Apr", value: 12100 },
  { period: "May", value: 11900 },
  { period: "Jun", value: 12770 },
];

const MOCK_STATEMENT: PaypalStatementRow[] = [
  { id: "1", period: "May 2024", openingBalance: 11900, closingBalance: 12200, totalIn: 4500, totalOut: 4200, transactionCount: 156 },
  { id: "2", period: "Apr 2024", openingBalance: 12100, closingBalance: 11900, totalIn: 5200, totalOut: 5400, transactionCount: 142 },
  { id: "3", period: "Mar 2024", openingBalance: 10800, closingBalance: 12100, totalIn: 6100, totalOut: 4800, transactionCount: 138 },
];

const MOCK_STATEMENT_CHART: SourceChartPoint[] = [
  { period: "Mar", value: 12100 },
  { period: "Apr", value: 11900 },
  { period: "May", value: 12200 },
];

const MOCK_STRIPE_TABLE: StripeRow[] = [
  { id: "1", date: "2024-06-01", description: "Subscription - Pro", amount: 29.99, currency: "USD", status: "Succeeded", type: "Charge" },
  { id: "2", date: "2024-06-01", description: "One-time payment", amount: 150, currency: "USD", status: "Succeeded", type: "Payment" },
  { id: "3", date: "2024-05-31", description: "Refund", amount: -45, currency: "USD", status: "Succeeded", type: "Refund" },
];

const MOCK_STRIPE_CHART: SourceChartPoint[] = [
  { period: "Jan", value: 4200 },
  { period: "Feb", value: 5100 },
  { period: "Mar", value: 4800 },
  { period: "Apr", value: 5500 },
  { period: "May", value: 6200 },
  { period: "Jun", value: 5900 },
];

// --- Extended section data for full dashboard UI ---

const PERIODS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function disputeChart(values: number[]): DisputeChartPoint[] {
  return PERIODS.map((p, i) => ({ period: p, value: values[i] ?? 0 }));
}

const MOCK_BALANCE_SUMMARY: PaypalBalanceSummaryRow[] = [
  { id: "1", account: "Primary", currency: "USD", available: 12450, pending: 320.5, total: 12770.5, asOf: "2024-06-01" },
  { id: "2", account: "Secondary", currency: "EUR", available: 850, pending: 0, total: 850, asOf: "2024-06-01" },
];

const MOCK_MERCHANT_PAYPAL: MerchantPaypalRow[] = [
  { id: "1", merchantId: "MCH-001", balance: 12770.5, currency: "USD", pending: 320.5, available: 12450, asOf: "2024-06-01" },
  { id: "2", merchantId: "MCH-002", balance: 4200, currency: "USD", pending: 100, available: 4100, asOf: "2024-06-01" },
];

const MOCK_MERCHANT_MASTER: MerchantPaypalMasterRow[] = [
  { id: "1", accountName: "Master A", totalBalance: 16970.5, holdBalance: 420.5, currency: "USD", lastUpdated: "2024-06-01" },
  { id: "2", accountName: "Master B", totalBalance: 850, holdBalance: 0, currency: "EUR", lastUpdated: "2024-06-01" },
];

const MOCK_VOLUME_AT_RISK: SourceChartPoint[] = [
  { period: "Jan", value: 1200 }, { period: "Feb", value: 980 }, { period: "Mar", value: 1100 },
  { period: "Apr", value: 850 }, { period: "May", value: 720 }, { period: "Jun", value: 650 },
];

const MOCK_ROLLING_RESERVE: SourceChartPoint[] = [
  { period: "Jan", value: 18 }, { period: "Feb", value: 16 }, { period: "Mar", value: 17 },
  { period: "Apr", value: 15 }, { period: "May", value: 14 }, { period: "Jun", value: 13 },
];

const MOCK_DISPUTE_DELAY: SourceChartPoint[] = [
  { period: "Jan", value: 5.2 }, { period: "Feb", value: 4.8 }, { period: "Mar", value: 5.5 },
  { period: "Apr", value: 4.2 }, { period: "May", value: 3.9 }, { period: "Jun", value: 3.5 },
];

const MOCK_DISPUTE_DELAY_BY_CURRENCY: DisputeChartPoint[] = PERIODS.map((period, i) => ({
  period,
  USD: 4.2 + (i % 3) * 0.3,
  EUR: 5.1 + (i % 2) * 0.2,
  GBP: 3.8 + (i % 3) * 0.25,
}));

const MOCK_DISPUTE_DELAY_BY_REASON: DisputeChartPoint[] = PERIODS.map((period, i) => ({
  period,
  "Item not received": 5.5 + i * 0.1,
  Unauthorized: 4.2 + (i % 2) * 0.3,
  Duplicate: 3 + (i % 3) * 0.2,
}));

const MOCK_DISPUTE_DELAY_BY_TYPE: DisputeChartPoint[] = PERIODS.map((period, i) => ({
  period,
  Chargeback: 6 + (i % 2) * 0.2,
  Claim: 4.5 + (i % 3) * 0.15,
  Inquiry: 2.5 + i * 0.1,
}));

const MOCK_STRIPE_SUMMARY: StripeSummaryRow[] = [
  { id: "1", period: "Jun 2024", totalVolume: 18500, totalFees: 556, netBalance: 17944, transactionCount: 142, currency: "USD" },
  { id: "2", period: "May 2024", totalVolume: 16200, totalFees: 486, netBalance: 15714, transactionCount: 128, currency: "USD" },
];

export async function getDashboardSourceData(): Promise<DashboardSourceData> {
  return mockGet({
    source: "all",
    paypalBalance: { table: MOCK_BALANCE, chart: MOCK_BALANCE_CHART },
    paypalDispute: { table: MOCK_DISPUTE_TABLE, chart: MOCK_DISPUTE_CHART },
    paypalReconciliation: { table: MOCK_RECONCILIATION, chart: MOCK_RECONCILIATION_CHART },
    paypalStatement: { table: MOCK_STATEMENT, chart: MOCK_STATEMENT_CHART },
    stripe: { table: MOCK_STRIPE_TABLE, chart: MOCK_STRIPE_CHART },
    paypalBalanceSummary: {
      balanceSummaryTable: MOCK_BALANCE_SUMMARY,
      merchantPaypalTable: MOCK_MERCHANT_PAYPAL,
      merchantPaypalMasterTable: MOCK_MERCHANT_MASTER,
      paypalBalanceChart: MOCK_BALANCE_CHART,
      volumeAtRiskChart: MOCK_VOLUME_AT_RISK,
      rollingReserveVsRiskChart: MOCK_ROLLING_RESERVE,
      paypalDisputeDelayChart: MOCK_DISPUTE_DELAY,
    },
    paypalDisputeSection: {
      disputeReason: disputeChart([22, 18, 25, 20, 19, 24]),
      disputeReasonOverTime: disputeChart([22, 20, 18, 21, 19, 17]),
      disputeType: disputeChart([12, 15, 10, 14, 16, 13]),
      disputeTypeOverTime: disputeChart([12, 13, 11, 14, 12, 10]),
      disputeOutcome: disputeChart([8, 10, 7, 9, 11, 8]),
      disputeOutcomeOverTime: disputeChart([8, 9, 8, 7, 9, 6]),
      disputeDelayByCurrency: MOCK_DISPUTE_DELAY_BY_CURRENCY,
      disputeDelayByCaseReason: MOCK_DISPUTE_DELAY_BY_REASON,
      disputeDelayByCaseType: MOCK_DISPUTE_DELAY_BY_TYPE,
    },
    paypalReconciliationSection: {
      reconciliationTable: MOCK_RECONCILIATION,
      merchantPaypalTable: MOCK_MERCHANT_PAYPAL,
      merchantPaypalMasterTable: MOCK_MERCHANT_MASTER,
      reconciliationBalanceChart: MOCK_RECONCILIATION_CHART,
      volumeAtRiskChart: MOCK_VOLUME_AT_RISK,
      rollingReserveVsRiskChart: MOCK_ROLLING_RESERVE,
    },
    stripeSection: {
      stripeTable: MOCK_STRIPE_TABLE,
      stripeSummaryTable: MOCK_STRIPE_SUMMARY,
      stripeBalanceChart: MOCK_STRIPE_CHART,
      rollingReserveVsRiskChart: MOCK_ROLLING_RESERVE,
    },
  });
}
