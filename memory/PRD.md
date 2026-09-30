# LedgerFlow Practice Management — PRD

## Original problem statement
Generate a task management web application for an accountant using the attached
project brief (`Accountant_Work_Management_System.md`). Keep it needful, not heavy.

## Architecture
- **Backend**: FastAPI + Motor + MongoDB. All routes under `/api`. UUID string ids.
- **Frontend**: React 19 + React Router + Tailwind + shadcn/ui, `sonner` for toasts.
- **Auth**: None (single-practice single-user).
- **Env**: `MONGO_URL`, `DB_NAME` (backend), `REACT_APP_BACKEND_URL` (frontend).

## Data model
- `staff` (id, name, role, initials, email, active)
- `clients` (id, code, name, category, main_staff_id, backup_staff_id, notes, active)
- `recurring_rules` (id, client_id, task_name, category, frequency
  [daily|weekly|monthly|quarterly], day_of_period, assigned_staff_id, priority, active)
- `tasks` (id, client_id, assigned_staff_id, task_name, category, priority,
  status [pending|in_progress|completed|hold], due_date, remarks, hold_reason,
  completed_at, rule_id)

## Core endpoints
- `/api/staff|clients|rules|tasks` — full CRUD
- `POST /api/tasks/generate_today` — spawn today's task instances from active
  matching recurring rules (dedup by rule_id + due_date)
- `GET /api/dashboard/stats` — today's/overdue/hold counters
- `GET /api/tasks?overdue=true|status=..|staff_id=..|client_id=..|due_date=..`

## Screens implemented
1. **Morning Cockpit** (`/`) — 5 KPI cards, Overdue table, On Hold table, empty
   state with quick links to onboarding.
2. **Today's Work** (`/today`) — filter by scope/staff/status/priority + search,
   inline start/complete/hold/reopen/delete actions, hold-reason prompt.
3. **Client Master** (`/clients`) — client CRUD with main + backup staff
   assignment, active toggle, recurring-rule counter, embedded Staff Manager
   dialog.
4. **Recurring Task Rules** (`/rules`) — cadence summary cards + CRUD table with
   client / task / cadence / staff / priority / active toggle.

## What has been implemented (2026-09-30)
- All 4 core screens fully wired end-to-end
- Backend CRUD + dashboard + generate-today engine (daily / weekly / monthly /
  quarterly matchers)
- LedgerFlow navy (#0B1E3F) sidebar and primary buttons, red accent used only for
  overdue / critical states
- Instrument Sans typography, dense micro-caps tables, status pills, priority
  badges, staff avatar chips
- Full `data-testid` coverage on nav, KPIs, dialogs, filters, row actions
- Testing agent: **100% backend / 100% frontend pass**, no failures

## Backlog / Next up
- P1 One-click "Load sample practice data" button on empty state
- P1 Compliance calendar (7-day statutory deadline radar)
- P1 Staff Workload & Roster page (capacity balancer)
- P2 CSV export of pending list + morning briefing
- P2 Weekly digest email (Resend integration)
- P2 Recurring-rule advanced cron (e.g. every 2nd Monday)
