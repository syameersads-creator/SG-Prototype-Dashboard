-- =====================================================================
-- 0001_schema.sql — core tables for the 3D printer production dashboard
-- =====================================================================
-- Design note: printer state is stored exactly as a real shop-floor
-- bridge would write it. The simulator in 0004 and a future real bridge
-- both go through ingest_printer_status() in 0003, so the UI never has
-- to know which one is feeding it.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- shared helpers
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles — one row per auth user, carries the role used by RLS
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'viewer'
              check (role in ('admin', 'operator', 'viewer')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- New signups get a profile automatically so the app never hits a
-- logged-in user with no role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'viewer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- printers — the 8 machines on the floor
-- ---------------------------------------------------------------------
create table if not exists public.printers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  serial        text not null unique,
  model         text not null,
  manufacturer  text not null,
  location      text,
  status        text not null default 'idle'
                check (status in ('idle','printing','paused','error','offline','maintenance')),
  status_note   text,
  last_seen_at  timestamptz not null default now(),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger printers_touch
  before update on public.printers
  for each row execute function public.touch_updated_at();

create index if not exists printers_sort_order_idx on public.printers (sort_order);

-- ---------------------------------------------------------------------
-- lot_imports — audit row per uploaded spreadsheet
-- ---------------------------------------------------------------------
create table if not exists public.lot_imports (
  id             uuid primary key default gen_random_uuid(),
  filename       text not null,
  uploaded_by    uuid references auth.users(id) on delete set null,
  row_count      int not null default 0,
  inserted_count int not null default 0,
  updated_count  int not null default 0,
  error_count    int not null default 0,
  errors         jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists lot_imports_created_at_idx
  on public.lot_imports (created_at desc);

-- ---------------------------------------------------------------------
-- lots — production lot numbers, phase 1 source is an Excel upload
-- ---------------------------------------------------------------------
create table if not exists public.lots (
  id               uuid primary key default gen_random_uuid(),
  lot_number       text not null unique,
  product_code     text,
  description      text,
  quantity_target  int not null default 1 check (quantity_target > 0),
  quantity_done    int not null default 0 check (quantity_done >= 0),
  due_date         date,
  priority         int not null default 100,
  status           text not null default 'pending'
                   check (status in ('pending','in_progress','completed','cancelled')),
  import_id        uuid references public.lot_imports(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger lots_touch
  before update on public.lots
  for each row execute function public.touch_updated_at();

create index if not exists lots_status_due_idx on public.lots (status, due_date nulls last, priority);
create index if not exists lots_lot_number_idx on public.lots (lot_number text_pattern_ops);

-- ---------------------------------------------------------------------
-- print_jobs — one row per print, the join between a printer and a lot
-- ---------------------------------------------------------------------
create table if not exists public.print_jobs (
  id                uuid primary key default gen_random_uuid(),
  printer_id        uuid not null references public.printers(id) on delete cascade,
  lot_id            uuid references public.lots(id) on delete set null,
  job_name          text not null,
  status            text not null default 'printing'
                    check (status in ('queued','printing','paused','completed','failed','cancelled')),
  progress_pct      numeric(5,2) not null default 0
                    check (progress_pct >= 0 and progress_pct <= 100),
  layer_current     int not null default 0,
  layer_total       int not null default 0,
  nozzle_temp       numeric(5,1),
  bed_temp          numeric(5,1),
  filament_used_g   numeric(8,2) not null default 0,
  started_at        timestamptz not null default now(),
  estimated_end_at  timestamptz,
  ended_at          timestamptz,
  failure_reason    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger print_jobs_touch
  before update on public.print_jobs
  for each row execute function public.touch_updated_at();

-- At most one live job per printer. This is the invariant the dashboard
-- relies on to show "the" current lot on each card.
create unique index if not exists print_jobs_one_active_per_printer
  on public.print_jobs (printer_id)
  where status in ('queued','printing','paused');

create index if not exists print_jobs_printer_started_idx
  on public.print_jobs (printer_id, started_at desc);
create index if not exists print_jobs_lot_idx on public.print_jobs (lot_id);
create index if not exists print_jobs_status_idx on public.print_jobs (status);

-- ---------------------------------------------------------------------
-- printer_telemetry — time series behind the detail-page charts
-- ---------------------------------------------------------------------
create table if not exists public.printer_telemetry (
  id            bigint generated always as identity primary key,
  printer_id    uuid not null references public.printers(id) on delete cascade,
  job_id        uuid references public.print_jobs(id) on delete cascade,
  recorded_at   timestamptz not null default now(),
  progress_pct  numeric(5,2),
  nozzle_temp   numeric(5,1),
  bed_temp      numeric(5,1)
);

create index if not exists printer_telemetry_printer_time_idx
  on public.printer_telemetry (printer_id, recorded_at desc);

-- ---------------------------------------------------------------------
-- dashboard read model — one row per printer with its live job and lot
-- ---------------------------------------------------------------------
create or replace view public.printer_overview
with (security_invoker = true) as
select
  p.id                as printer_id,
  p.name              as printer_name,
  p.serial,
  p.model,
  p.manufacturer,
  p.location,
  p.status            as printer_status,
  p.status_note,
  p.last_seen_at,
  p.sort_order,
  j.id                as job_id,
  j.job_name,
  j.status            as job_status,
  j.progress_pct,
  j.layer_current,
  j.layer_total,
  j.nozzle_temp,
  j.bed_temp,
  j.filament_used_g,
  j.started_at,
  j.estimated_end_at,
  l.id                as lot_id,
  l.lot_number,
  l.product_code,
  l.description       as lot_description,
  l.quantity_target,
  l.quantity_done,
  l.due_date
from public.printers p
left join public.print_jobs j
  on j.printer_id = p.id
 and j.status in ('queued','printing','paused')
left join public.lots l on l.id = j.lot_id;

-- Realtime: the dashboard listens to these two tables only. Telemetry
-- changes every few seconds and is fetched on demand instead.
alter publication supabase_realtime add table public.printers;
alter publication supabase_realtime add table public.print_jobs;
