"use client";

import { useEffect, useState } from "react";
import type { BaseAssessment, ModuleType } from "@/lib/types";
import { getRiskAssessments } from "@/lib/api/assessments";
import { getPSPs } from "@/lib/api/assessments";
import {
  ASSESSMENTS_TAB_STATUSES,
  APPROVAL_PENDING_STATUSES,
  REJECTED_STATUSES,
} from "@/lib/constants/assessment-status";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";
import { formatDate } from "@/lib/utils/format";
import { useAuthStore } from "@/store/auth-store";
import { hasPermission } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function filterByStatuses<T extends BaseAssessment>(
  items: T[],
  statuses: string[]
): T[] {
  return items.filter((i) => statuses.includes(i.status));
}

interface AssessmentListProps {
  moduleType: ModuleType;
  onSelect: (id: string, tab?: "assessments" | "approval" | "rejected") => void;
  onCreateNew: () => void;
  canCreate: boolean;
  refreshKey?: number;
}

export function AssessmentList({
  moduleType,
  onSelect,
  onCreateNew,
  canCreate,
  refreshKey = 0,
}: AssessmentListProps) {
  const user = useAuthStore((s) => s.user);
  const [assessments, setAssessments] = useState<BaseAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = () => {
    setLoading(true);
    const api = moduleType === "risk_assessment" ? getRiskAssessments : getPSPs;
    api(user?.companyId ? { companyId: user.companyId } : {})
      .then(setAssessments)
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [moduleType, user?.companyId, refreshKey]);

  const main = filterByStatuses(assessments, ASSESSMENTS_TAB_STATUSES);
  const pending = filterByStatuses(assessments, APPROVAL_PENDING_STATUSES);
  const rejected = filterByStatuses(assessments, REJECTED_STATUSES);

  const tabs = [
    { id: "assessments", label: moduleType === "risk_assessment" ? "Assessments" : "PSPs", count: main.length },
    { id: "approval", label: "Approval Pending", count: pending.length },
    { id: "rejected", label: "Rejected", count: rejected.length },
  ];

  const renderList = (list: BaseAssessment[], tabId: string) => {
    if (loading) return <Loading />;
    if (list.length === 0)
      return (
        <Empty
          title={`No ${tabId === "rejected" ? "rejected" : tabId === "approval" ? "pending" : ""} items`}
          description="Items will appear here based on status."
        />
      );
    return (
      <ul className="divide-y divide-slate-200">
        {list.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between py-3 first:pt-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg"
            onClick={() =>
              onSelect(item.id, tabId as "assessments" | "approval" | "rejected")
            }
          >
            <div>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">
                Updated {formatDate(item.updatedAt)} · <Badge status={item.status} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">
          {moduleType === "risk_assessment" ? "Risk Assessments" : "PSPs"}
        </h2>
        {canCreate && (
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs tabs={tabs}>
          <TabPanel>{renderList(main, "assessments")}</TabPanel>
          <TabPanel>{renderList(pending, "approval")}</TabPanel>
          <TabPanel>{renderList(rejected, "rejected")}</TabPanel>
        </Tabs>
      </CardContent>
    </Card>
  );
}
