import type { AssessmentStatus } from "@/lib/types";

export const ASSESSMENTS_TAB_STATUSES: AssessmentStatus[] = [
  "in_progress",
  "submitted",
  "approved",
  "initial_submission",
  "proposal_submitted",
  "proposal_accepted",
];

export const APPROVAL_PENDING_STATUSES: AssessmentStatus[] = [
  "approval_pending",
  "edit_requested",
];

export const REJECTED_STATUSES: AssessmentStatus[] = [
  "rejected",
  "proposal_rejected",
];
