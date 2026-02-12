"use client";

import { RequireAuth } from "@/lib/rbac";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
