# Sembly — Project Context for Claude Code

This file is read automatically by Claude Code on startup. It carries the
decisions and working style from the chat session where this frontend was built,
so we can continue seamlessly.

## What Sembly is

A premium, multi-tenant **school-management SaaS for Nigerian private schools**.
It replaces paper, WhatsApp and Excel with results, fees, attendance, timetables
and parent communication. Aesthetic: premium, editorial, trustworthy.

## Current state of this repo

This is the **frontend only**, running entirely on **mock data** — every screen
is clickable with no backend. The Laravel API does not exist yet.

- Framework: **Next.js 15 (App Router, JavaScript — NOT TypeScript)**
- Styling: **Tailwind CSS** with a custom design system (see below)
- State: **Zustand** (`lib/store.js`)
- HTTP: **Axios** (`lib/axios.js`) — configured but dormant until the API lands
- Toasts: **react-hot-toast**
- Icons: **lucide-react** · Charts: **recharts**

All dummy data lives in ONE place: `lib/mockData.js`. Shapes mirror the planned
MySQL schema so swapping to real API responses is a no-op for components.

## Planned backend (not built yet)

Laravel 11 + MySQL, decoupled REST API. Multi-tenancy = shared DB with row-level
isolation via `school_id` + a global `TenantScope`. Auth = **Laravel Sanctum**
tokens in httpOnly cookies. Payments = Paystack. SMS = Africa's Talking / Termii.
Storage = Cloudflare R2. PDFs = Browsershot. Deploy: frontend → Vercel,
backend → Railway.

## Design system (do not drift from this)

- Primary: **forest green `#1B6B3A`** (`forest-500`)
- Accent: **gold `#E8A020`** (`gold-400`)
- Headings: **Playfair Display** (`font-display`) · Body: **DM Sans** (`font-sans`)
- Money: whole-Naira integers, always formatted via `formatNaira()` (the `₦` glyph)
- Tokens live in `tailwind.config.js` (forest/gold/ink/paper/line); base styles in `app/globals.css`

## Working style (please follow)

- **Send only the files you change.** Do not rewrite whole files or the whole
  project when fixing a bug — surgical edits only.
- **Comments explain *why*, not what.**
- Keep using mock data until the corresponding backend endpoint exists.
- When you build a backend endpoint later, also wire up the matching frontend hook.

## Architecture map

```
app/
  layout.js              root: next/font (Playfair + DM Sans), <Toaster/>
  page.js                redirect → /dashboard
  login/page.js          split-panel login + demo quick-fill
  (app)/                 route group — everything here gets the AppShell
    layout.js
    dashboard/ students/ results/ fees/ attendance/
    timetable/ communication/ settings/
    payroll/ lms/ library/        ← ComingSoon stubs (Phases 9–11)
components/
  shared/                Button, Card, StatCard, Table, Pagination, Badge,
                         Avatar, Input, Select, Modal, PageHeader, ComingSoon
                         (+ index.js barrel)
  layout/                Sidebar (role-aware), Topbar, AppShell
lib/
  utils.js  store.js  mockData.js  axios.js  auth.js
```

## How to swap mock data → real API (the eventual plan)

1. Add a `hooks/` folder: `useStudents`, `useResults`, `useFees`, `useAttendance`
   — each calls `api.<verb>(...)` from `lib/axios.js`.
2. Per page, replace the `MOCK_*` import with the hook. Components don't change.
3. In `lib/auth.js`, delete the mock branch and uncomment the real Sanctum calls.
   `axios.js` already injects the token and auto-logs-out on 401.

## Demo-only code to REMOVE before production

- The "Demo logins" panel in `app/login/page.js`
- The "Preview as" role switcher in `components/layout/Topbar.js`
- The seeded default user in `lib/store.js`

## Good next tasks

- Build the `hooks/` layer (above) so the API swap is one line per page.
- Student & parent **detail views** (drill-down from the tables).
- Start the **Laravel backend** (auth + tenancy scaffold first), then replace
  mock data module by module.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000  (demo login chips on /login)
```

---

## UPDATE — Phase 4: full multi-role app implemented (mock data)

The app is now role-aware end to end. `lib/store.js` holds `user.role`, and the
shell + pages render per role. Switch roles live via Topbar → "Preview as", or
log in with the demo accounts (Super Admin lands on `/platform`, everyone else
on `/dashboard`).

### Roles & surfaces
- **super_admin** → platform console under `/platform`: overview, `/platform/schools`
  (search + detail modal + impersonate/change-plan/suspend), `/platform/onboarding`
  (create-school form), `/platform/subscriptions`, `/platform/templates`
  (template library: assign templates to packages, create, preview, download).
- **school_admin** → `/dashboard` (KPIs/charts), `/students`, `/classes` (add/edit
  arms + form teachers), `/promotions` (per-student promote/repeat/graduate),
  `/results`, `/fees`, `/attendance`, `/timetable`, `/communication`, `/staff`,
  `/settings` (now includes a **Report Card** tab to pick the school's default
  template from those the plan unlocks).
- **teacher** → scoped `/dashboard`, `/classes` ("my classes"), `/attendance`
  (mark present/late/absent), `/results` (subject-locked entry), `/timetable`.
- **parent** → `/dashboard` (child overview), `/results` (report card + download),
  `/attendance`, `/fees` (Paystack pay + download invoice/receipt), `/announcements`.
  Child switching is global via `components/parent/ChildSwitcher.js` (store.currentChildId).

### Report card templates (two-tier)
- Super Admin owns templates and assigns each to subscription packages
  (`REPORT_TEMPLATES[].packages`). School Admin only sees/sets templates their
  plan unlocks. Logic in `lib/templates.js` (`templatesForPlan`,
  `isTemplateAvailable`, `lowestPlanFor`, `resolveTemplate`). Renderer:
  `components/results/ReportCard.js` (classic / modern / minimal / branded).
- **Decision:** if a saved default is no longer in the plan (e.g. downgrade),
  `resolveTemplate()` silently falls back to the first available template so
  report cards never break.
- **Decision:** templates are built from fixed base layouts for now; a visual
  editor is a later enhancement.

### Downloads
`lib/print.js > downloadNode(node, title)` opens a clean print window (Save as
PDF) for report cards / invoices / receipts. Production swaps this for
server-side Browsershot PDFs.

### Promotions
**Decision:** default decision is Promote (Graduate for the exit class SS3A);
`MOCK_CLASS_ARMS[].next` defines the progression. The real endpoint should also
auto-create the next session's classes.

### New/!changed files this phase
mockData.js, store.js, templates.js (new), print.js (new), Sidebar.js, Topbar.js,
ChildSwitcher.js (new), ReportCard.js (new), dashboards/{Admin,Teacher,ParentOverview}.js,
dashboard/page.js (role router), platform/* (new), classes/page.js (new),
promotions/page.js (new), staff/page.js (new), announcements/page.js (new),
results/page.js, fees/page.js, attendance/page.js, settings/page.js, login/page.js.

---

## UPDATE — Phase 5: path-based multi-tenancy + class/teacher tweaks

### Tenant-scoped URLs
School/teacher/parent pages now live under a `[tenant]` slug:
`app/(app)/[tenant]/<page>` → `/<slug>/<page>` (e.g. `/greenfield/dashboard`,
`/greenfield/results`). The Super Admin console stays at `/platform` (a reserved
slug; Next.js matches the static segment before the dynamic `[tenant]`).
- Slug source: `lib/tenant.js` — `useTenantSlug()` reads the `[tenant]` route
  param, falling back to `school.subdomain`. `useTenantPath()` returns a builder
  `(page) => /<slug><page>` used by the Sidebar and any in-app `router.push`.
- Login and "Preview as" route to `/<subdomain>/dashboard`; root `/` redirects to
  the seeded tenant; `/<slug>` redirects to `/<slug>/dashboard`.
- Platform → Schools → **Open as school** impersonates by setting the session to
  that school and navigating into its tenant URL; the Sidebar context now shows
  the active school's name/plan from the store (so impersonation reflects).
- Onboarding success surfaces the new workspace URL (`sembly.com/<slug>`).
- Production mapping: the slug also corresponds to a subdomain
  (`greenfield.sembly.com`); the path form keeps dev on one domain. The Laravel
  `TenantScope` resolves the tenant from the slug/subdomain on each request.

### Classes are free-text
`ClassFormModal` now takes a free-text **Class name** + optional **Arm** (no more
fixed dropdowns) so schools can use any naming (JSS1, Grade 4, Nursery 2, arms
like A / Gold / Blue). Label = `class_name + arm`.

### Staff roles
Roles now include **Class Teacher** and **Subject Teacher** (plus School Admin,
Accountant). `MOCK_STAFF` reflects the split; the form-teacher picker in Classes
lists anyone whose role includes "Teacher".
