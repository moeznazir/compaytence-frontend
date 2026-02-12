"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AssessmentList } from "@/components/assessments/assessment-list";
import { AssessmentModal } from "@/components/assessments/assessment-modal";
import { CreateAssessmentModal } from "@/components/assessments/create-assessment-modal";
import { useAuthStore } from "@/store/auth-store";
import { hasPermission } from "@/lib/rbac";

export default function RiskAssessmentsPage() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");
  const tabFromUrl = searchParams.get("tab") as "assessments" | "approval" | "rejected" | null;

  const [selectedId, setSelectedId] = useState<string | null>(idFromUrl);
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const user = useAuthStore((s) => s.user);
  const canCreate = user ? hasPermission(user.role, "create_assessment") : false;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleCreated = useCallback(() => {
    setCreateOpen(false);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Risk Assessments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create, submit, and manage risk assessments. Use tabs to filter by status.
        </p>
      </div>

      <AssessmentList
        moduleType="risk_assessment"
        onSelect={handleSelect}
        onCreateNew={() => setCreateOpen(true)}
        canCreate={canCreate}
        refreshKey={refreshKey}
      />

      <AssessmentModal
        id={selectedId ?? idFromUrl}
        moduleType="risk_assessment"
        open={!!(selectedId || idFromUrl)}
        onClose={handleClose}
        defaultTab={tabFromUrl ?? undefined}
        onSaved={handleSaved}
      />

      <CreateAssessmentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        moduleType="risk_assessment"
        onCreated={handleCreated}
      />
    </div>
  );
}
