"use client";

import { Tab } from "@headlessui/react";
import { cn } from "@/lib/utils/cn";

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  children: React.ReactNode;
  defaultIndex?: number;
  onChange?: (index: number) => void;
}

export function Tabs({ tabs, children, defaultIndex = 0, onChange }: TabsProps) {
  return (
    <Tab.Group defaultIndex={defaultIndex} onChange={onChange}>
      <Tab.List className="flex gap-1 border-b border-theme-border">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            className={({ selected }) =>
              cn(
                "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors focus:outline-none",
                selected
                  ? "bg-theme-surface text-theme-text border border-theme-border border-b-0 -mb-px"
                  : "text-theme-text-muted hover:text-theme-text"
              )
            }
          >
            <span>{tab.label}</span>
            {tab.count != null && (
              <span className="ml-1.5 rounded-full bg-theme-surface-elevated px-1.5 text-xs">
                {tab.count}
              </span>
            )}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-4">{children}</Tab.Panels>
    </Tab.Group>
  );
}

export function TabPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <Tab.Panel className={cn(className)}>{children}</Tab.Panel>;
}
