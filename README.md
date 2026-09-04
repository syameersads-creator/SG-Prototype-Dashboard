# Printer Floor — production monitoring POC

A cloud dashboard, behind a login, showing the **production lot number
being printed on each of 8 printers and how far along it is** — on a
desktop, a shop-floor tablet, or a phone.

Built as a client-facing proof of concept. The printer hardware is not
confirmed yet, so the machines are driven by a simulator behind a fixed
ingest contract: when the real printers are connected, no UI code
changes. See [`bridge/README.md`](bridge/README.md).

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), TypeScript, Tailwind v4 |
| Data | Supabase — Postgres, Auth, Realtime, RLS |
| Charts | Recharts |
| Spreadsheets | `read-excel-file` (.xlsx) + `papaparse` (.csv) |
| Hosting | Vercel |

## What it does

- **Floor view** — 8 live cards: lot number, progress, layer count, ETA,
  temperatures, machine state. Updates over Supabase Realtime, no refresh.
- **Printer detail** — progress and temperature charts from a rolling
  6-hour telemetry series, plus that machine's job history.
- **Production lots** — searchable, filterable, showing units completed
  against target and which machine is running each lot right now.
- **Excel import** — drag in the lot spreadsheet, see a validated preview
  with per-row errors, then confirm. Re-uploading a corrected file
  updates lots instead of duplicating them.
- **Job history** — every run across the floor, filterable, CSV export.
- **Roles** — `admin`, `operator`, `viewer`, enforced by Postgres RLS
  rather than by the UI.

## Running locally

```bash
npm install
cp .env.example .env.local     # fill in your Supabase URL + publishable key
npm run dev
```

## Setting up a fresh Supabase project

Apply the migrations in order, then seed:

```bash
supabase link --project-ref <your-ref>
supabase db push                       # supabase/migrations/0001 … 0007
psql "$DATABASE_URL" -f supabase/seed.sql
```

Then schedule the simulator (pg_cron 1.5+ is needed for the sub-minute
interval):

```sql
create extension if not exists pg_cron;
select cron.schedule('sim-tick', '10 seconds', 'select public.sim_tick();');
```

If `pg_cron` is unavailable, an admin can drive it by hand with
`select public.sim_manual_tick();`.

### Environment variables

| Name | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | app | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | app | publishable key — safe in the browser, RLS does the work |
| `SUPABASE_SERVICE_ROLE_KEY` | bridge only | **never** in the web app |

The web app deliberately runs on the publishable key alone. The demo
controls call `SECURITY DEFINER` functions that re-check the caller's
role in Postgres, so no elevated credential is ever shipped to a browser.

## Demo accounts

| Role | Email | Password | Can |
|---|---|---|---|
| Admin | `admin@demo.sg` | `PrinterFloor#2026` | everything, plus the demo controls |
| Operator | `operator@demo.sg` | `PrinterFloor#2026` | view + import lots |
| Viewer | `viewer@demo.sg` | `PrinterFloor#2026` | view only |

> Prototype credentials for a walkthrough — rotate them before this goes
> anywhere real.

## Demo script

1. Sign in as **admin**. The floor is already running.
2. Point out a card: the **lot number** is the headline, progress and ETA
   move on their own.
3. Open a printer → live progress and temperature charts, job history.
4. **Force complete (demo)** on a running printer → it finishes, the lot
   count increments, the machine picks up the next lot within seconds.
5. **Lots** → the lot just completed has moved on.
6. **Import lots** → drop a spreadsheet, show the validated preview
   (including the deliberately broken rows), confirm.
7. Open the same URL on a phone — same live data, laid out for the hand.

`Reset demo data` on the floor view puts everything back.

## How the simulator works

`sim_tick()` runs inside Postgres every 10 seconds and writes through
`ingest_printer_status()` — the same function a real bridge will call. It
advances jobs against their estimated duration, starts new ones on idle
machines from the lot backlog, occasionally throws a fault or drops a
machine offline, and trims telemetry past 6 hours.

Running it in the database rather than in a cron job or the browser means
it keeps going with nobody watching, and every viewer sees identical
state.

## Layout

```
app/(auth)/login          sign in
app/(app)/                floor, printers/[id], lots, lots/import, jobs
app/api/lots/import/      preview + commit endpoints
components/               cards, tables, charts, filters
lib/excel/                header mapping, validation, file reading
lib/supabase/             browser / server / middleware clients
supabase/migrations/      schema, RLS, ingest contract, simulator
bridge/                   how to connect real printers
```

## Not in this phase

In-app lot entry (phase 2 — the import path and schema already support
it), a working printer bridge, alerting, an admin UI for user roles, ERP
integration.
