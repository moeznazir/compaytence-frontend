"use client";

import { Tab } from "@headlessui/react";
import { cn } from "@/lib/utils/cn";
import type { DashboardSourceType } from "@/lib/types";

const SOURCE_TABS: { value: DashboardSourceType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paypal_balance", label: "PayPal Balance Summary" },
  { value: "paypal_dispute", label: "PayPal Dispute" },
  { value: "paypal_reconciliation", label: "PayPal Reconciliation" },
  { value: "paypal_statement", label: "PayPal Statement" },
  { value: "stripe", label: "Stripe" },
];

interface SourceTabsProps {
  selected: DashboardSourceType;
  onSelect: (source: DashboardSourceType) => void;
}

export function SourceTabs({ selected, onSelect }: SourceTabsProps) {
  return (
    <Tab.Group
      selectedIndex={SOURCE_TABS.findIndex((t) => t.value === selected)}
      onChange={(i) => onSelect(SOURCE_TABS[i].value)}
    >
      <Tab.List className="flex flex-wrap gap-1 rounded-xl border border-theme-border bg-theme-surface-elevated p-1">
        {SOURCE_TABS.map((tab) => (
          <Tab
            key={tab.value}
            className={({ selected: isSelected }) =>
              cn(
                "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-1",
                isSelected
                  ? "bg-theme-surface text-theme-text shadow-sm"
                  : "text-theme-text-muted hover:text-theme-text hover:bg-theme-surface/80"
              )
            }
          >
            {tab.label}
          </Tab>
        ))}
      </Tab.List>
    </Tab.Group>
  );
}

export { SOURCE_TABS };
