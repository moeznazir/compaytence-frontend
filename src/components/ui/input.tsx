"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-theme-text mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-10 px-3 rounded-lg border bg-theme-surface text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent",
            error ? "border-red-500" : "border-theme-border",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1 text-xs text-theme-text-muted">{hint}</p>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export { Input };
