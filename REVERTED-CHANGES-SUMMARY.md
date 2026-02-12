# Summary of Changes (from conversation – restore if reverted)

This list reflects everything that was implemented during the session. Use it to verify or re-apply after a revert.

---

## 1. Dark / light mode

- **`src/store/theme-store.ts`**  
  - `theme: 'light' | 'dark'`, `toggleTheme()`, `setTheme()`, persisted via Zustand.

- **`src/app/globals.css`**  
  - `:root` / `.light`: light theme variables.  
  - `.dark`: dark theme with `#151228`, `#101D41`, `#073679`.  
  - `@theme inline` so Tailwind can use `theme-bg`, `theme-surface`, `theme-accent`, `theme-text`, etc.

- **`src/components/theme-provider.tsx`**  
  - Client component that applies `light` or `dark` class to `document.documentElement` based on theme store (after mount).

- **`src/app/layout.tsx`**  
  - Root wrapped in `ThemeProvider`.  
  - `<html lang="en" suppressHydrationWarning>`.  
  - `<body className="... bg-theme-bg text-theme-text" suppressHydrationWarning>`.

- **`src/components/theme-toggle.tsx`**  
  - Sun/Moon button; defers theme-dependent output until `mounted` to avoid hydration mismatch.

- **Auth layout**  
  - **`src/app/(auth)/layout.tsx`**: Theme toggle in top-right, `bg-theme-bg-muted`.

- **Dashboard shell**  
  - **`src/components/layout/dashboard-shell.tsx`**: Theme toggle in header; theme-aware classes (`theme-bg-muted`, `theme-surface`, `theme-border`, `theme-text`, etc.); theme icon deferred until mounted.

- **UI components**  
  - Modal, Source tabs, Button, Input, Card, Loading, Empty, Tabs, Select, DataTable, Badge, etc. use `theme-*` classes instead of hardcoded slate/white.

---

## 2. Section KPI bar

- **`src/components/dashboard/section-kpi-bar.tsx`**  
  - Reusable KPI bar: `metrics[]` with `icon`, `value`, `label`, `trendText`, `trend` (up/down/neutral).  
  - Theme-aware styling; vertical dividers; responsive grid.

- **Dashboard page**  
  - When source is **“All”**: single KPI bar at top (e.g. Total Sales, Risk Volume, Refund Rate, Dispute Rate).  
  - When a single source is selected: that section can show its own KPI bar (current dashboard page uses one overview KPI bar for “All” only).

---

## 3. Section filters (date range + currency)

- **`src/components/dashboard/section-filters.tsx`**  
  - Exports: `SectionFilters`, `SectionFiltersValue`, `getDefaultSectionFilters()`, `CURRENCY_OPTIONS`.  
  - UI: “Filters” label, From/To date inputs, Currency dropdown (USD, EUR, GBP).  
  - Controlled: `value` + `onChange`.  
  - Theme-aware; compact layout.

- **Usage**  
  - Each dashboard section can render `<SectionFilters value={filters} onChange={setFilters} />` with local state.  
  - Dashboard page can show one filter bar at top and/or per-section filters.

---

## 4. Dashboard route (fix 404)

- **`src/app/(dashboard)/dashboard/page.tsx`**  
  - Fetches data with `getDashboardSourceData()`.  
  - Loading and error states.  
  - `SourceTabs` for source selection (All, PayPal Balance, Dispute, Reconciliation, Statement, Stripe).  
  - For “All”: one `SectionKpiBar` at top, then all sections (tables + line charts).  
  - For each single source: that section’s table + chart.  
  - Uses `BalanceTable`, `DisputeTable`, `ReconciliationTable`, `StatementTable`, `StripeTable` and `SourceLineChart`.

---

## 5. Hydration fixes

- **Theme toggle**  
  - Don’t render theme-dependent icon/title until `mounted` (useState + useEffect).  
  - Before mount: render a neutral placeholder (e.g. Moon icon, no theme-based `title`).

- **Dashboard shell**  
  - Theme button: same idea – placeholder until mounted, then real icon/title.

- **Layout**  
  - `<body suppressHydrationWarning>` so extension-injected attributes (e.g. `cz-shortcut-listen="true"`) don’t cause hydration warnings.

---

## 6. Theme-aware component styling (no slate/white)

- **Modal**: `bg-theme-surface`, `border-theme-border`, `text-theme-text` for panel, header, footer.  
- **Source tabs**: `border-theme-border`, `bg-theme-surface-elevated`, selected/unselected use `theme-text`, `theme-surface`, focus `theme-accent`.  
- **Dashboard page**: headings and error block use `text-theme-text`, `text-theme-text-muted`, `border-theme-border`, `bg-theme-surface`.  
- **Line graph card**: `border-theme-border`, header `bg-theme-surface-elevated`, chart area `bg-theme-surface`, buttons and tooltip text theme-aware.  
- **Table with CSV**: headers, borders, rows, empty state use `theme-*`.  
- **Loading**: spinner and text use theme border/color.  
- **Empty, Tabs, Select, DataTable, Badge**: use `theme-*` instead of slate.

---

## 7. “All” view – single KPI bar only

- In “All” view, only one KPI bar at the top.  
- Individual sections do not show their own KPI bar in “All” (they can when viewed as a single source).  
- Implemented by having the dashboard page render one `SectionKpiBar` when `source === 'all'` and not rendering per-section KPI bars in that view.

---

## Files to create if missing

- `src/components/dashboard/section-filters.tsx` (SectionFilters + defaults + currency options)

## Files to check / restore

- `src/app/globals.css` – dark/light variables and `@theme inline`
- `src/app/layout.tsx` – ThemeProvider, suppressHydrationWarning on html/body
- `src/components/theme-provider.tsx` – apply theme class after mount
- `src/components/theme-toggle.tsx` – mounted guard + theme icon
- `src/app/(auth)/layout.tsx` – ThemeToggle in top-right
- `src/components/layout/dashboard-shell.tsx` – theme toggle (with mounted guard), theme-* classes
- `src/components/ui/modal.tsx` – theme-* for panel, header, footer
- `src/components/dashboard/source-tabs.tsx` – theme-* for list and tabs
- `src/app/(dashboard)/dashboard/page.tsx` – full dashboard with KPI bar, tabs, sections, tables, charts
