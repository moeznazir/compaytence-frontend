"use client";

import { useState, useEffect } from "react";
import type {
  RiskAssessment,
  PSP,
  ModuleType,
  AssessmentStatus,
} from "@/lib/types";
import {
  getRiskAssessment,
  getPSP,
  updateAssessmentStep,
  submitAssessment,
  approveAssessment,
  rejectAssessment,
  overrideAssessment,
  requestEdit,
} from "@/lib/api/assessments";
import { useAuthStore } from "@/store/auth-store";
import { hasPermission } from "@/lib/rbac";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { toast } from "sonner";

const SUBMITTED_STATUSES: AssessmentStatus[] = [
  "submitted",
  "approved",
  "approval_pending",
  "edit_requested",
  "initial_submission",
  "proposal_submitted",
  "proposal_accepted",
];

const SHOW_SECTIONS_AFTER_SUBMIT: AssessmentStatus[] = [
  "submitted",
  "approved",
  "approval_pending",
  "edit_requested",
  "proposal_accepted",
];

const FIRST_TIME_ONLY_SECTIONS = ["section1", "section2"];
const REMAINING_SECTIONS = ["section3", "section4", "section5", "section6"];
const TOTAL_STEPS = 6;

interface AssessmentModalProps {
  id: string | null;
  moduleType: ModuleType;
  open: boolean;
  onClose: () => void;
  defaultTab?: "assessments" | "approval" | "rejected";
  onSaved?: () => void;
}

export function AssessmentModal({
  id,
  moduleType,
  open,
  onClose,
  onSaved,
}: AssessmentModalProps) {
  const user = useAuthStore((s) => s.user);
  const [item, setItem] = useState<RiskAssessment | PSP | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [stepData, setStepData] = useState<Record<string, string>>({});
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [proposalDecision, setProposalDecision] = useState<"accept" | "reject" | null>(null);

  const isSubmitted = item ? SUBMITTED_STATUSES.includes(item.status) : false;
  const showCommentsAndReports = item
    ? SHOW_SECTIONS_AFTER_SUBMIT.includes(item.status)
    : false;
  const isFirstTime = item?.isFirstTimeSubmission ?? false;
  const proposalSubmitted = item?.status === "proposal_submitted";
  const canShowRemainingSections =
    item?.status === "proposal_accepted" ||
    (item && !isFirstTime && isSubmitted);

  const canSubmit =
    user &&
    item &&
    item.status === "in_progress" &&
    (item.currentStep ?? 0) >= 1 &&
    item.createdBy === user.id;

  const canApproveReject = user && hasPermission(user.role, "approve_reject");
  const canOverride = user && hasPermission(user.role, "override_submission");
  const canAddPublicReport = user && hasPermission(user.role, "add_public_report");

  useEffect(() => {
    if (!open || !id) {
      setItem(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const api = moduleType === "risk_assessment" ? getRiskAssessment : getPSP;
    api(id)
      .then((data) => {
        setItem(data ?? null);
        setStep((data?.currentStep ?? 1) as number);
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [open, id, moduleType]);

  const handleSaveStep = async () => {
    if (!id || !item) return;
    setSaving(true);
    try {
      await updateAssessmentStep(id, moduleType, step, stepData);
      setItem((prev) =>
        prev
          ? {
              ...prev,
              currentStep: step,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
      if (step < TOTAL_STEPS) setStep(step + 1);
      toast.success("Step saved");
      onSaved?.();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await submitAssessment(id, moduleType);
      setItem((prev) =>
        prev
          ? { ...prev, status: "approval_pending", submittedAt: new Date().toISOString() }
          : null
      );
      toast.success("Submitted for approval");
      onSaved?.();
    } catch {
      toast.error("Submit failed");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await approveAssessment(id, moduleType);
      setItem((prev) =>
        prev ? { ...prev, status: "approved" } : null
      );
      toast.success("Approved");
      onSaved?.();
    } catch {
      toast.error("Failed to approve");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await rejectAssessment(id, moduleType, rejectReason);
      setItem((prev) =>
        prev ? { ...prev, status: "rejected" } : null
      );
      setShowRejectModal(false);
      setRejectReason("");
      toast.success("Rejected");
      onSaved?.();
    } catch {
      toast.error("Failed to reject");
    } finally {
      setSaving(false);
    }
  };

  const handleProposalAccept = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await approveAssessment(id, moduleType);
      setItem((prev) =>
        prev ? { ...prev, status: "proposal_accepted" } : null
      );
      setProposalDecision(null);
      toast.success("Proposal accepted");
      onSaved?.();
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleProposalReject = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await rejectAssessment(id, moduleType, rejectReason);
      setItem((prev) =>
        prev ? { ...prev, status: "proposal_rejected" } : null
      );
      setProposalDecision(null);
      setShowRejectModal(false);
      setRejectReason("");
      toast.success("Proposal rejected");
      onSaved?.();
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item?.title ?? "Assessment"}
      size="xl"
      footer={null}
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      ) : !item ? (
        <p className="text-slate-500 py-8">Assessment not found.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge status={item.status} />
            {item.submittedAt && (
              <span className="text-xs text-slate-500">
                Submitted {new Date(item.submittedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {!isSubmitted && item.status === "in_progress" && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-slate-900">
                Step {step} of {TOTAL_STEPS}
              </h3>
              <div>
                <Input
                  label="Step data (placeholder)"
                  value={stepData[`step${step}`] ?? ""}
                  onChange={(e) =>
                    setStepData((s) => ({ ...s, [`step${step}`]: e.target.value }))
                  }
                />
                {item.editRequestedFields?.includes(`step${step}`) && (
                  <p className="mt-1 text-xs text-amber-700">Requested for change</p>
                )}
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Refunds table</h4>
                <p className="text-xs text-slate-500">Editable during form filling. Rows: date, amount, reason.</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <h4 className="text-sm font-medium text-slate-700 mb-2">12-month forecast table</h4>
                <p className="text-xs text-slate-500">Editable during form filling. Month and value columns.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveStep}
                  isLoading={saving}
                >
                  Next (Save)
                </Button>
                {step > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                  >
                    Previous
                  </Button>
                )}
                {canSubmit && step >= 1 && (
                  <Button onClick={handleSubmit} isLoading={saving}>
                    Submit
                  </Button>
                )}
              </div>
            </div>
          )}

          {proposalSubmitted && user?.id === item.createdBy && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <h3 className="font-medium text-amber-900">Proposal ready for your decision</h3>
              <p className="text-sm text-amber-800 mt-1">
                Admin has submitted a proposal. Accept to reveal remaining sections or reject with a reason.
              </p>
              {proposalDecision === null ? (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => setProposalDecision("accept")}>
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setProposalDecision("reject");
                      setShowRejectModal(true);
                    }}
                  >
                    Reject
                  </Button>
                </div>
              ) : proposalDecision === "accept" ? (
                <Button size="sm" onClick={handleProposalAccept} isLoading={saving}>
                  Confirm accept
                </Button>
              ) : (
                <div className="mt-3 space-y-2">
                  <Input
                    label="Rejection reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <Button size="sm" onClick={handleProposalReject} isLoading={saving}>
                    Submit rejection
                  </Button>
                </div>
              )}
            </div>
          )}

          {item.status === "submitted" && item.createdBy === user?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              title="Request for Edit: opens flow to request field changes (wire to requestEdit API)"
            >
              Request for Edit
            </Button>
          )}

          {(item.status === "approval_pending" || item.status === "edit_requested") &&
            canApproveReject && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleApprove} isLoading={saving}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowRejectModal(true)}
                  isLoading={saving}
                >
                  Reject
                </Button>
                {canOverride && (
                  <Button size="sm" variant="secondary" isLoading={saving}>
                    Override
                  </Button>
                )}
              </div>
            )}

          {showRejectModal && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-2">
              <Input
                label="Rejection reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReject} isLoading={saving}>
                  Confirm reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showCommentsAndReports && (
            <>
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-medium text-slate-900 mb-2">Comments</h3>
                <p className="text-sm text-slate-500">
                  Comments section (add/delete when backend wired).
                </p>
              </div>
              {canAddPublicReport && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-medium text-slate-900 mb-2">Public report</h3>
                  <p className="text-sm text-slate-500">
                    Super Admin can add/edit. Users view only.
                  </p>
                </div>
              )}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-medium text-slate-900 mb-2">Improvements</h3>
                <p className="text-sm text-slate-500">
                  Super Admin: CRUD tasks. Users: mark completed/incomplete.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
