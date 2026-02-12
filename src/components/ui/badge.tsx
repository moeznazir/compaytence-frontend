"use client";

import { cn } from "@/lib/utils/cn";

const statusColors: Record<string, string> = {
  in_progress: "bg-amber-100 text-amber-800",
  initial_submission: "bg-blue-100 text-blue-800",
  proposal_submitted: "bg-violet-100 text-violet-800",
  proposal_accepted: "bg-emerald-100 text-emerald-800",
  proposal_rejected: "bg-red-100 text-red-800",
  submitted: "bg-theme-surface-elevated text-theme-text",
  approval_pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  edit_requested: "bg-orange-100 text-orange-800",
};

function formatStatus(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface BadgeProps {
  status: string;
  className?: string;
  showLabel?: boolean;
}

export function Badge({ status, className, showLabel = true }: BadgeProps) {
  const color = statusColors[status] ?? "bg-theme-surface-elevated text-theme-text";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        color,
        className
      )}
    >
      {showLabel ? formatStatus(status) : status}
    </span>
  );
}
