# Compaytence Frontend

Production-ready Next.js (App Router) web application for the internal platform: risk assessments, PSPs, companies, documents, and RBAC.

## Tech Stack

- **Framework:** Next.js (App Router), TypeScript
- **Styling:** Tailwind CSS
- **UI:** Headless UI, Radix primitives (Dialog, Tabs, Select), custom components
- **State:** Zustand (auth, notifications)
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **Charts:** Recharts
- **Auth:** Token-based (assume backend exists); RBAC at route, component, and action level

## Folder Structure

```
src/
├── app/
│   ├── (auth)/                 # Auth layout (centered card)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/            # Dashboard layout (shell + RequireAuth)
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx   # Dashboard + cards, PayPal Dispute chart, CSV upload
│   │   ├── documents/page.tsx
│   │   ├── risk-assessments/page.tsx
│   │   ├── psps/page.tsx
│   │   ├── companies/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx   # Company detail, employees, website sections
│   │   └── profile/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                # Redirects to /dashboard
│   └── globals.css
├── components/
│   ├── layout/
│   │   └── dashboard-shell.tsx  # Header, nav, notifications, user menu
│   ├── ui/                     # Reusable UI
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── modal.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   ├── data-table.tsx
│   │   ├── loading.tsx
│   │   └── empty.tsx
│   ├── assessments/
│   │   ├── assessment-list.tsx   # Tabs: Assessments, Approval Pending, Rejected
│   │   ├── assessment-modal.tsx  # Step form, submit, approve/reject, comments/reports/improvements
│   │   └── create-assessment-modal.tsx
│   └── csv-upload/
│       └── csv-upload.tsx       # Role-restricted CSV upload
├── lib/
│   ├── api/                    # Mock API layer
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── documents.ts
│   │   ├── assessments.ts
│   │   ├── companies.ts
│   │   ├── employees.ts
│   │   ├── notifications.ts
│   │   └── csv.ts
│   ├── rbac/
│   │   ├── permissions.ts       # Role → permissions map
│   │   ├── guards.tsx           # RequireAuth, RequirePermission, RequireRole
│   │   └── index.ts
│   ├── constants/
│   │   └── assessment-status.ts
│   ├── types/
│   │   └── index.ts             # User, Company, Assessment, PSP, Document, etc.
│   └── utils/
│       ├── cn.ts
│       └── format.ts
└── store/
    ├── auth-store.ts            # Zustand + persist
    └── notifications-store.ts
```

## Routes (9 main pages)

| Route | Description |
|-------|-------------|
| `/login` | Email + password, Forgot password link |
| `/signup` | Registration |
| `/reset-password` | Forgot password flow |
| `/dashboard` | Cards, PayPal Dispute chart (integrated), mock charts, CSV upload |
| `/documents` | List, filters (type, date), modal (no content render) |
| `/risk-assessments` | Tabs: Assessments, Approval Pending, Rejected; create, modal workflow |
| `/psps` | Same structure as risk-assessments |
| `/companies` | List; Super Admin sees all, others see own company |
| `/companies/[id]` | Details, employees (manage for Admin/Super Admin), website sections |
| `/profile` | View/edit profile, role badge |

## User Roles & RBAC

- **Super Admin:** Full access; approve/reject/override; public reports; CRUD improvements.
- **Super Editor:** Edit other companies (not own); website sections visible/editable.
- **Company Admin:** Own company, invite employees, submit assessments/PSPs.
- **Company Employee:** Fill assessments/PSPs, view approved data, tasks.

Permissions control: page visibility, buttons, tabs, editable fields (via `RequirePermission` and `hasPermission`).

## Running the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use any email/password to log in (mock auth). Default mock user is Super Admin.

## Build

```bash
npm run build
npm start
```

## Notes

- **Mock API:** All `lib/api/*` functions use in-memory or delayed mocks. Replace with `apiClient()` or real endpoints when backend is ready.
- **Assessment/PSP workflow:** First save → `in_progress`; Submit → status changes, button disappears; Approval Pending / Rejected tabs; first-time flow: Section 1 & 2 only → admin proposal → accept/reject → remaining sections revealed on accept.
- **Documents:** List and filters only; modal does not render document content (privacy).
- **Notifications:** Shown in header; click navigates to related assessment/PSP (and rejected tab when status is rejected).
