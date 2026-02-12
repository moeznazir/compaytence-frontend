import type {
  RiskAssessment,
  PSP,
  AssessmentStatus,
  ModuleType,
} from "@/lib/types";
import { mockGet, mockPost } from "./client";

const MOCK_ASSESSMENTS: RiskAssessment[] = [
  {
    id: "ra1",
    title: "Q1 2024 Risk Assessment",
    status: "submitted",
    moduleType: "risk_assessment",
    companyId: "c1",
    createdBy: "u1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    submittedAt: "2024-01-15T00:00:00Z",
    isFirstTimeSubmission: false,
    currentStep: 6,
    totalSteps: 6,
  },
  {
    id: "ra2",
    title: "In Progress Assessment",
    status: "in_progress",
    moduleType: "risk_assessment",
    companyId: "c1",
    createdBy: "u1",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-05T00:00:00Z",
    currentStep: 2,
    totalSteps: 6,
  },
  {
    id: "ra3",
    title: "Pending Approval",
    status: "approval_pending",
    moduleType: "risk_assessment",
    companyId: "c1",
    createdBy: "u2",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-04T00:00:00Z",
    submittedAt: "2024-02-04T00:00:00Z",
    currentStep: 6,
    totalSteps: 6,
  },
  {
    id: "ra4",
    title: "Rejected Assessment",
    status: "rejected",
    moduleType: "risk_assessment",
    companyId: "c1",
    createdBy: "u1",
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-01-25T00:00:00Z",
    submittedAt: "2024-01-22T00:00:00Z",
    currentStep: 6,
    totalSteps: 6,
  },
];

const MOCK_PSPS: PSP[] = [
  {
    id: "psp1",
    title: "PSP Q1 2024",
    status: "submitted",
    moduleType: "psp",
    companyId: "c1",
    createdBy: "u1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    submittedAt: "2024-01-15T00:00:00Z",
    currentStep: 6,
    totalSteps: 6,
  },
  {
    id: "psp2",
    title: "PSP In Progress",
    status: "in_progress",
    moduleType: "psp",
    companyId: "c1",
    createdBy: "u1",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-05T00:00:00Z",
    currentStep: 1,
    totalSteps: 6,
  },
];

function filterByStatus<T extends { status: AssessmentStatus }>(
  items: T[],
  statuses: AssessmentStatus[]
): T[] {
  return items.filter((i) => statuses.includes(i.status));
}

export async function getRiskAssessments(params?: {
  status?: AssessmentStatus;
  companyId?: string;
}): Promise<RiskAssessment[]> {
  let list = [...MOCK_ASSESSMENTS];
  if (params?.companyId) {
    list = list.filter((a) => a.companyId === params.companyId);
  }
  if (params?.status) {
    list = list.filter((a) => a.status === params.status);
  }
  return mockGet(list);
}

export async function getPSPs(params?: {
  status?: AssessmentStatus;
  companyId?: string;
}): Promise<PSP[]> {
  let list = [...MOCK_PSPS];
  if (params?.companyId) {
    list = list.filter((a) => a.companyId === params.companyId);
  }
  if (params?.status) {
    list = list.filter((a) => a.status === params.status);
  }
  return mockGet(list);
}

export async function getRiskAssessment(id: string): Promise<RiskAssessment | null> {
  const found = MOCK_ASSESSMENTS.find((a) => a.id === id);
  return mockGet(found ?? null);
}

export async function getPSP(id: string): Promise<PSP | null> {
  const found = MOCK_PSPS.find((a) => a.id === id);
  return mockGet(found ?? null);
}

export async function createAssessment(payload: {
  title: string;
  moduleType: ModuleType;
}): Promise<RiskAssessment | PSP> {
  const base = {
    id: "new-" + Date.now(),
    title: payload.title,
    status: "in_progress" as const,
    moduleType: payload.moduleType,
    companyId: "c1",
    createdBy: "u1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentStep: 1,
    totalSteps: 6,
  };
  if (payload.moduleType === "psp") {
    return mockPost({ ...base } as PSP);
  }
  return mockPost({ ...base } as RiskAssessment);
}

export async function updateAssessmentStep(
  id: string,
  moduleType: ModuleType,
  step: number,
  data: Record<string, unknown>
): Promise<{ success: boolean }> {
  return mockPost({ success: true });
}

export async function submitAssessment(
  id: string,
  moduleType: ModuleType
): Promise<{ success: boolean }> {
  return mockPost({ success: true });
}

export async function approveAssessment(
  id: string,
  moduleType: ModuleType
): Promise<{ success: boolean }> {
  return mockPost({ success: true });
}

export async function rejectAssessment(
  id: string,
  moduleType: ModuleType,
  reason?: string
): Promise<{ success: boolean }> {
  return mockPost({ success: true });
}

export async function overrideAssessment(
  id: string,
  moduleType: ModuleType,
  data: Record<string, unknown>
): Promise<{ success: boolean }> {
  return mockPost({ success: true });
}

export async function requestEdit(
  id: string,
  moduleType: ModuleType,
  fields: string[]
): Promise<{ success: boolean }> {
  return mockPost({ success: true });
}

export function getAssessmentsTabStatuses(): AssessmentStatus[] {
  return ["in_progress", "submitted", "approved", "initial_submission", "proposal_submitted", "proposal_accepted"];
}

export function getApprovalPendingStatuses(): AssessmentStatus[] {
  return ["approval_pending", "edit_requested"];
}

export function getRejectedStatuses(): AssessmentStatus[] {
  return ["rejected", "proposal_rejected"];
}
