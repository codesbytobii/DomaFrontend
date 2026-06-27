# Sembly Web (Next.js 15)

Frontend for Sembly — a multi-tenant school-management SaaS for Nigerian private schools.
**Now wired to the Laravel 13 API** — all data comes from the real backend; no mock data
is used for live features. Mock data is kept only as fallback demo-login quick-fill on the
login page (those credentials match the seeded database).

## Setup

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your Laravel API URL (default: http://localhost:8000/api)
npm run dev          # http://localhost:3000
```

Make sure the Laravel API is running first (see sembly-api/README.md).

## Demo accounts (seeded in the backend)

| Role         | Email                         | Password    |
|--------------|-------------------------------|-------------|
| Super Admin  | admin@sembly.com              | sembly2025  |
| School Admin | adunola@greenfield.edu.ng     | password    |
| Teacher      | b.ojo@greenfield.edu.ng       | password    |
| Parent       | james.okafor@gmail.com        | password    |

Log in as any role and the UI adapts: school admin sees full management tools, the teacher
sees only their assigned classes/subjects, the parent sees only their children's data.

## Architecture

- **Auth** — `lib/auth.js`: `login()` / `logout()` / `bootstrapSession()` against Sanctum.
  Token stored in a cookie; `axios.js` attaches it as `Authorization: Bearer …`.
- **Data** — `lib/api.js`: SWR hooks for every endpoint + mutation helpers. Pages import
  hooks, render loading/error states, and call mutations for writes.
- **Session gate** — `AppShell.js` rehydrates on reload via `GET /auth/me`, redirects to
  `/login` if no valid session.
- **Tenancy** — path-based (`/greenfield/students`). The API derives tenant from the token;
  the URL slug is for routing/UX only and is never trusted for data access.
- **Report cards** — `ReportCard.js` renders a print-ready HTML document from the API's
  `/students/{id}/report-card` data. Browser print dialog → Save as PDF.

## Modules

| Module          | Backend endpoint           | Notes                      |
|-----------------|----------------------------|----------------------------|
| Students        | /students                  | CRUD, server-side filter   |
| Classes         | /classes                   | Admin CRUD; teacher read   |
| Results         | /results, /results/submit  | Score entry + approval     |
| Report card     | /students/{id}/report-card | Parent & admin view        |
| Fees (admin)    | /invoices, /invoices/{id}  | Record manual payments     |
| Fees (parent)   | /students/{id}/invoices    | Paystack online payment    |
| Attendance      | /attendance                | Mark + parent history      |
| Communication   | /announcements             | SMS + in-app via Termii    |
| Staff           | /staff                     | Create, list teachers      |
| Settings        | /settings/*                | Profile, grading, templates|
| Promotions      | /promotions/{class}/run    | End-of-session bulk move   |
| Platform        | /platform/*                | Super admin console        |
| Timetable       | —                          | Coming soon (Phase 8)      |
