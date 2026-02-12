"use client";

import { cn } from "@/lib/utils/cn";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ className, size = "md" }: LoadingProps) {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-theme-border-muted border-t-theme-accent",
        sizes[size],
        className
      )}
    />
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loading size="lg" />
      <p className="text-sm text-theme-text-muted">Loading...</p>
    </div>
  );
}
