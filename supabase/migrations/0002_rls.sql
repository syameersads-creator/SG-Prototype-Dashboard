-- =====================================================================
-- 0002_rls.sql — row level security
-- =====================================================================
-- Nothing in this schema is readable anonymously. Every table is
-- locked down and re-opened only to authenticated sessions.

alter table public.profiles          enable row level security;
alter table public.printers          enable row level security;
alter table public.lots              enable row level security;
alter table public.lot_imports       enable row level security;
alter table public.print_jobs        enable row level security;
alter table public.printer_telemetry enable row level security;

-- Reading the caller's role from inside a policy on profiles would
-- recurse, so it is read through a security definer function instead.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'viewer'
  );
$$;

create or replace function public.can_write_lots()
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
     and public.current_user_role() in ('admin', 'operator');
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "profiles readable by authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles updatable by owner"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_user_role());

-- ---------------------------------------------------------------------
-- read access — any signed-in user can watch the floor
-- ---------------------------------------------------------------------
create policy "printers readable by authenticated"
  on public.printers for select to authenticated using (true);

create policy "print_jobs readable by authenticated"
  on public.print_jobs for select to authenticated using (true);

create policy "telemetry readable by authenticated"
  on public.printer_telemetry for select to authenticated using (true);

create policy "lots readable by authenticated"
  on public.lots for select to authenticated using (true);

create policy "lot_imports readable by authenticated"
  on public.lot_imports for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- write access — admins and operators only
-- ---------------------------------------------------------------------
create policy "lots writable by operators"
  on public.lots for insert to authenticated
  with check (public.can_write_lots());

create policy "lots updatable by operators"
  on public.lots for update to authenticated
  using (public.can_write_lots())
  with check (public.can_write_lots());

create policy "lot_imports writable by operators"
  on public.lot_imports for insert to authenticated
  with check (public.can_write_lots());

-- Operators may flag a machine down for maintenance from the UI.
-- Live status fields are written by the ingest RPC, not by clients.
create policy "printers updatable by operators"
  on public.printers for update to authenticated
  using (public.can_write_lots())
  with check (public.can_write_lots());

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.can_write_lots() to authenticated;
