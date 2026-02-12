"use client";

import type {
  PaypalBalanceRow,
  PaypalDisputeRow,
  PaypalReconciliationRow,
  PaypalStatementRow,
  StripeRow,
} from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TableWithCsvDownload, type TableColumn } from "./table-with-csv-download";

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function BalanceTable({ rows }: { rows: PaypalBalanceRow[] }) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-theme-text">Balance summary</h3>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-left text-theme-text-muted">
              <th className="pb-2 pr-4 font-medium">Currency</th>
              <th className="pb-2 pr-4 font-medium">Available</th>
              <th className="pb-2 pr-4 font-medium">Pending</th>
              <th className="pb-2 pr-4 font-medium">Total</th>
              <th className="pb-2 font-medium">As of</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-theme-border-muted">
                <td className="py-3 pr-4 font-medium text-theme-text">{r.currency}</td>
                <td className="py-3 pr-4 text-theme-text">{formatCurrency(r.available, r.currency)}</td>
                <td className="py-3 pr-4 text-theme-text">{formatCurrency(r.pending, r.currency)}</td>
                <td className="py-3 pr-4 font-medium text-theme-text">{formatCurrency(r.total, r.currency)}</td>
                <td className="py-3 text-theme-text-muted">{r.asOf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function DisputeTable({ rows }: { rows: PaypalDisputeRow[] }) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-theme-text">Disputes</h3>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-left text-theme-text-muted">
              <th className="pb-2 pr-4 font-medium">ID</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Amount</th>
              <th className="pb-2 pr-4 font-medium">Reason</th>
              <th className="pb-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-theme-border-muted">
                <td className="py-3 pr-4 font-medium text-theme-text">{r.disputeId}</td>
                <td className="py-3 pr-4">
                  <span
                    className={r.status === "Resolved" ? "text-green-600" : "text-amber-600"}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-theme-text">{formatCurrency(r.amount, r.currency)}</td>
                <td className="py-3 pr-4 text-theme-text-muted">{r.reason}</td>
                <td className="py-3 text-theme-text-muted">{r.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function ReconciliationTable({ rows }: { rows: PaypalReconciliationRow[] }) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-theme-text">Reconciliation</h3>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-left text-theme-text-muted">
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Description</th>
              <th className="pb-2 pr-4 font-medium">Amount</th>
              <th className="pb-2 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-theme-border-muted">
                <td className="py-3 pr-4 text-theme-text">{r.date}</td>
                <td className="py-3 pr-4">
                  <span className={r.type === "Credit" ? "text-green-600" : "text-red-600"}>
                    {r.type}
                  </span>
                </td>
                <td className="py-3 pr-4 text-theme-text-muted">{r.description}</td>
                <td className="py-3 pr-4 font-medium">{formatCurrency(r.amount)}</td>
                <td className="py-3 text-theme-text">{formatCurrency(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

const STATEMENT_COLUMNS: TableColumn<PaypalStatementRow>[] = [
  { key: "period", header: "Period" },
  { key: "openingBalance", header: "Opening", render: (v) => formatCurrency(Number(v)) },
  { key: "closingBalance", header: "Closing", render: (v) => formatCurrency(Number(v)) },
  { key: "totalIn", header: "Total In", render: (v) => formatCurrency(Number(v)) },
  { key: "totalOut", header: "Total Out", render: (v) => formatCurrency(Number(v)) },
  { key: "transactionCount", header: "Txns" },
];

export function StatementTable({ rows }: { rows: PaypalStatementRow[] }) {
  return (
    <TableWithCsvDownload
      title="Merchant PayPal Statement"
      columns={STATEMENT_COLUMNS as unknown as TableColumn<Record<string, unknown>>[]}
      rows={rows as unknown as Record<string, unknown>[]}
      filename="merchant-paypal-statement.csv"
    />
  );
}

export function StripeTable({ rows }: { rows: StripeRow[] }) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-theme-text">Stripe activity</h3>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-left text-theme-text-muted">
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Description</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Amount</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-theme-border-muted">
                <td className="py-3 pr-4 text-theme-text">{r.date}</td>
                <td className="py-3 pr-4 text-theme-text">{r.description}</td>
                <td className="py-3 pr-4 text-theme-text-muted">{r.type}</td>
                <td className="py-3 pr-4 font-medium">{formatCurrency(r.amount, r.currency)}</td>
                <td className="py-3">
                  <span className={r.status === "Succeeded" ? "text-green-600" : "text-theme-text-muted"}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
