"use client";

import { type ReactNode } from "react";
import { FileQuestion, Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EmptyProps {
  icon?: "default" | "document";
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function Empty({
  icon = "default",
  title,
  description,
  action,
  className,
}: EmptyProps) {
  const Icon = icon === "document" ? FileQuestion : Inbox;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-theme-border bg-theme-surface-elevated/50 py-12 px-6 text-center",
        className
      )}
    >
      <Icon className="h-12 w-12 text-theme-text-muted mb-4" />
      <h3 className="text-sm font-medium text-theme-text">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-theme-text-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
