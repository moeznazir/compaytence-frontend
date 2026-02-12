// User & Auth
export type UserRole =
  | "super_admin"
  | "super_editor"
  | "company_admin"
  | "company_employee";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string | null;
  /** From auth/me: used as merchant_id for merchant_data API */
  companyProfileId: string | null;
  enabled: boolean;
  createdAt: string;
}

// Company
export interface WebsiteSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  websiteSections?: WebsiteSection[];
  createdAt: string;
  updatedAt: string;
}

// Assessment / PSP
export type AssessmentStatus =
  | "in_progress"
  | "initial_submission"
  | "proposal_submitted"
  | "proposal_accepted"
  | "proposal_rejected"
  | "submitted"
  | "approval_pending"
  | "approved"
  | "rejected"
  | "edit_requested";

export type ModuleType = "risk_assessment" | "psp";

export interface BaseAssessment {
  id: string;
  title: string;
  status: AssessmentStatus;
  moduleType: ModuleType;
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  isFirstTimeSubmission?: boolean;
  currentStep?: number;
  totalSteps?: number;
  proposalRejectionReason?: string;
  editRequestedFields?: string[];
}

export interface RiskAssessment extends BaseAssessment {
  moduleType: "risk_assessment";
  section1?: Record<string, unknown>;
  section2?: Record<string, unknown>;
  section3?: Record<string, unknown>;
  section4?: Record<string, unknown>;
  section5?: Record<string, unknown>;
  section6?: Record<string, unknown>;
  proposalSection?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PSP extends BaseAssessment {
  moduleType: "psp";
  section1?: Record<string, unknown>;
  section2?: Record<string, unknown>;
  section3?: Record<string, unknown>;
  section4?: Record<string, unknown>;
  section5?: Record<string, unknown>;
  section6?: Record<string, unknown>;
  proposalSection?: Record<string, unknown>;
  [key: string]: unknown;
}

// Notifications
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityId: string;
  entityType: "risk_assessment" | "psp";
  status: string;
  createdAt: string;
  read: boolean;
}

// Documents
export interface Document {
  id: string;
  name: string;
  type: string;
  modifiedAt: string;
  companyId: string;
}

// CSV Upload
export interface CsvUploadStatus {
  id: string;
  fileName: string;
  status: string;
  progress: number;
  message?: string;
  createdAt: string;
}

// Dashboard stats (getDashboardStats)
export interface PaypalDisputeDataPoint {
  month: string;
  count: number;
  resolved: number;
}

export interface DashboardStats {
  totalAssessments: number;
  pendingApprovals: number;
  paypalDisputes: PaypalDisputeDataPoint[];
  [key: string]: unknown;
}

// Dashboard source types and row types
export type DashboardSourceType =
  | "all"
  | "paypal_balance"
  | "paypal_dispute"
  | "paypal_reconciliation"
  | "paypal_statement"
  | "stripe";

export interface SourceChartPoint {
  period: string;
  value: number;
  label?: string;
  [key: string]: string | number | undefined;
}

export interface PaypalBalanceRow {
  id: string;
  currency: string;
  available: number;
  pending: number;
  total: number;
  asOf: string;
}

export interface PaypalDisputeRow {
  id: string;
  disputeId: string;
  status: string;
  amount: number;
  currency: string;
  reason: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface PaypalReconciliationRow {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  balance: number;
  reference?: string;
}

export interface PaypalStatementRow {
  id: string;
  period: string;
  openingBalance: number;
  closingBalance: number;
  totalIn: number;
  totalOut: number;
  transactionCount: number;
}

export interface StripeRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
}

export interface StripeSummaryRow {
  id: string;
  period: string;
  totalVolume: number;
  totalFees: number;
  netBalance: number;
  transactionCount: number;
  currency: string;
}

export interface PaypalBalanceSummaryRow {
  id: string;
  [key: string]: string | number | undefined;
}

export interface MerchantPaypalRow {
  id: string;
  merchantId: string;
  balance: number;
  currency: string;
  pending: number;
  available: number;
  asOf: string;
}

export interface MerchantPaypalMasterRow {
  id: string;
  accountName: string;
  totalBalance: number;
  holdBalance: number;
  currency: string;
  lastUpdated: string;
}

export interface PaypalBalanceSummarySectionData {
  balanceSummaryTable: PaypalBalanceSummaryRow[];
  merchantPaypalTable: MerchantPaypalRow[];
  merchantPaypalMasterTable: MerchantPaypalMasterRow[];
  paypalBalanceChart: SourceChartPoint[];
  volumeAtRiskChart: SourceChartPoint[];
  rollingReserveVsRiskChart: SourceChartPoint[];
  paypalDisputeDelayChart: SourceChartPoint[];
}

export interface DisputeChartPoint {
  period: string;
  value?: number;
  [key: string]: string | number | undefined;
}

export interface PaypalDisputeSectionData {
  disputeReason: DisputeChartPoint[];
  disputeReasonOverTime: DisputeChartPoint[];
  disputeType: DisputeChartPoint[];
  disputeTypeOverTime: DisputeChartPoint[];
  disputeOutcome: DisputeChartPoint[];
  disputeOutcomeOverTime: DisputeChartPoint[];
  disputeDelayByCurrency: DisputeChartPoint[];
  disputeDelayByCaseReason: DisputeChartPoint[];
  disputeDelayByCaseType: DisputeChartPoint[];
}

export interface PaypalReconciliationSectionData {
  reconciliationTable: PaypalReconciliationRow[];
  merchantPaypalTable: MerchantPaypalRow[];
  merchantPaypalMasterTable: MerchantPaypalMasterRow[];
  reconciliationBalanceChart: SourceChartPoint[];
  volumeAtRiskChart: SourceChartPoint[];
  rollingReserveVsRiskChart: SourceChartPoint[];
}

export interface StripeSectionData {
  stripeTable: StripeRow[];
  stripeSummaryTable: StripeSummaryRow[];
  stripeBalanceChart: SourceChartPoint[];
  rollingReserveVsRiskChart: SourceChartPoint[];
}

export interface DashboardSourceData {
  source: DashboardSourceType;
  paypalBalance: { table: PaypalBalanceRow[]; chart?: SourceChartPoint[] };
  paypalDispute: { table: PaypalDisputeRow[]; chart?: SourceChartPoint[] };
  paypalReconciliation: { table: PaypalReconciliationRow[]; chart?: SourceChartPoint[] };
  paypalStatement: { table: PaypalStatementRow[]; chart?: SourceChartPoint[] };
  stripe: { table: StripeRow[]; chart?: SourceChartPoint[] };
  paypalBalanceSummary?: PaypalBalanceSummarySectionData;
  paypalDisputeSection?: PaypalDisputeSectionData;
  paypalReconciliationSection?: PaypalReconciliationSectionData;
  stripeSection?: StripeSectionData;
}
