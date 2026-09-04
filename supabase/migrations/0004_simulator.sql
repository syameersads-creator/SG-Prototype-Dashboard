-- =====================================================================
-- 0004_simulator.sql — the POC printer simulator
-- =====================================================================
-- The client's hardware is not confirmed yet, so this drives the 8
-- printers with realistic behaviour. It runs INSIDE Postgres on a
-- pg_cron schedule, which means:
--   * no extra service to host, and it keeps running with no browser open
--   * every viewer sees the same state on every device
--   * it writes through ingest_printer_status(), exactly like a real
--     bridge will, so the UI cannot tell the difference
--
-- To go live on real hardware:
--   select cron.unschedule('sim-tick');
-- ...and point the bridge at ingest_printer_status(). Nothing else changes.

create table if not exists public.sim_settings (
  id         boolean primary key default true check (id),
  enabled    boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.sim_settings (id, enabled) values (true, true)
on conflict (id) do nothing;

alter table public.sim_settings enable row level security;

create policy "sim_settings readable by authenticated"
  on public.sim_settings for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- start a fresh job on an idle printer, claiming the next due lot
-- ---------------------------------------------------------------------
create or replace function public.sim_start_job(p_printer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_serial   text;
  v_lot      public.lots%rowtype;
  v_parts    text[] := array['bracket','housing_v2','spacer','clip_left','manifold','gearcase','end_cap','jig_plate'];
  v_minutes  int;
  v_layers   int;
  v_job_name text;
begin
  select serial into v_serial from public.printers where id = p_printer_id;

  -- Next lot that still needs units and is not already on another machine.
  select l.* into v_lot
    from public.lots l
   where l.status in ('pending','in_progress')
     and l.quantity_done < l.quantity_target
     and not exists (
       select 1 from public.print_jobs j
        where j.lot_id = l.id
          and j.status in ('queued','printing','paused')
     )
   order by l.priority, l.due_date nulls last, l.lot_number
   limit 1;

  if v_lot.id is null then
    return null;   -- nothing left to print; printer stays idle
  end if;

  v_minutes := 15 + floor(random() * 60)::int;
  v_layers  := 200 + floor(random() * 700)::int;
  v_job_name := v_lot.lot_number || '_'
              || v_parts[1 + floor(random() * array_length(v_parts, 1))::int]
              || '.gcode';

  return public.ingest_printer_status(
    p_serial           => v_serial,
    p_status           => 'printing'::text,
    p_job_name         => v_job_name,
    p_progress_pct     => 0::numeric,
    p_layer_current    => 0,
    p_layer_total      => v_layers,
    p_nozzle_temp      => (205 + random() * 15)::numeric,
    p_bed_temp         => (58 + random() * 5)::numeric,
    p_estimated_end_at => now() + make_interval(mins => v_minutes),
    p_filament_used_g  => 0::numeric
  );
end;
$$;

-- ---------------------------------------------------------------------
-- sim_tick — one step of the simulation, scheduled every 10 seconds
-- ---------------------------------------------------------------------
create or replace function public.sim_tick()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r          record;
  v_progress numeric;
  v_total_s  numeric;
begin
  if not coalesce((select enabled from public.sim_settings where id), false) then
    return;
  end if;

  -- 1. advance everything that is printing ---------------------------
  for r in
    select j.*, p.serial
      from public.print_jobs j
      join public.printers p on p.id = j.printer_id
     where j.status = 'printing'
  loop
    v_total_s := greatest(extract(epoch from (r.estimated_end_at - r.started_at)), 60);
    v_progress := least(100, 100 * extract(epoch from (now() - r.started_at)) / v_total_s);

    if v_progress >= 100 then
      perform public.ingest_printer_status(
        r.serial, 'idle'::text, r.job_name, 100::numeric,
        r.layer_total, r.layer_total,
        null::numeric, null::numeric, r.estimated_end_at, r.filament_used_g
      );

    elsif random() < 0.002 then
      -- rare failure, so the client can see how an error surfaces
      perform public.ingest_printer_status(
        r.serial, 'error'::text, r.job_name, v_progress,
        r.layer_current, r.layer_total, null::numeric, null::numeric, null::timestamptz, r.filament_used_g,
        (array['filament runout','thermal runaway detected','bed adhesion loss','nozzle clog'])
          [1 + floor(random() * 4)::int]
      );

    elsif random() < 0.003 then
      perform public.ingest_printer_status(
        r.serial, 'paused'::text, r.job_name, v_progress,
        r.layer_current, r.layer_total,
        (195 + random() * 8)::numeric, (58 + random() * 3)::numeric,
        r.estimated_end_at, r.filament_used_g, 'paused by operator'::text
      );

    else
      perform public.ingest_printer_status(
        r.serial, 'printing'::text, r.job_name, v_progress,
        floor(r.layer_total * v_progress / 100)::int, r.layer_total,
        (205 + random() * 15)::numeric, (58 + random() * 5)::numeric,
        r.estimated_end_at,
        round((v_progress / 100 * (40 + random() * 120))::numeric, 2)
      );
    end if;
  end loop;

  -- 2. paused printers resume ---------------------------------------
  for r in
    select j.*, p.serial
      from public.print_jobs j
      join public.printers p on p.id = j.printer_id
     where j.status = 'paused' and random() < 0.08
  loop
    -- keep the finish time honest: push it out by the time spent paused
    update public.print_jobs
       set estimated_end_at = greatest(estimated_end_at, now() + interval '2 minutes')
     where id = r.id;

    perform public.ingest_printer_status(
      r.serial, 'printing'::text, r.job_name, r.progress_pct,
      r.layer_current, r.layer_total,
      (205 + random() * 15)::numeric, (58 + random() * 5)::numeric,
      (select estimated_end_at from public.print_jobs where id = r.id),
      r.filament_used_g
    );
  end loop;

  -- 3. idle printers pick up the next lot ----------------------------
  for r in
    select id from public.printers
     where status = 'idle' and random() < 0.12
  loop
    perform public.sim_start_job(r.id);
  end loop;

  -- 4. errored / offline printers recover ----------------------------
  update public.printers
     set status = 'idle', status_note = null, last_seen_at = now()
   where status in ('error', 'offline') and random() < 0.05;

  -- 5. a healthy printer occasionally drops off the network ----------
  update public.printers
     set status = 'offline', status_note = 'lost network connection'
   where status = 'idle' and random() < 0.001;

  -- 6. trim the telemetry series -------------------------------------
  delete from public.printer_telemetry where recorded_at < now() - interval '6 hours';
end;
$$;

-- ---------------------------------------------------------------------
-- demo controls — used by /api/sim, admin only
-- ---------------------------------------------------------------------
create or replace function public.sim_set_enabled(p_enabled boolean)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.sim_settings set enabled = p_enabled, updated_at = now()
   where id returning enabled;
$$;

-- Jump the current job on a printer to done. During a live demo nobody
-- wants to wait 20 minutes to see what completion looks like.
create or replace function public.sim_force_complete(p_printer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_serial text;
  v_job public.print_jobs%rowtype;
begin
  select serial into v_serial from public.printers where id = p_printer_id;

  select * into v_job from public.print_jobs
   where printer_id = p_printer_id and status in ('queued','printing','paused') limit 1;

  if v_job.id is null then
    return;
  end if;

  update public.print_jobs set estimated_end_at = now() where id = v_job.id;

  perform public.ingest_printer_status(
    v_serial, 'idle'::text, v_job.job_name, 100::numeric,
    v_job.layer_total, v_job.layer_total, null::numeric, null::numeric, now(),
    v_job.filament_used_g
  );
end;
$$;

-- Put the demo back to a known-good state.
create or replace function public.sim_reset()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.printer_telemetry;
  delete from public.print_jobs;

  update public.lots
     set quantity_done = 0,
         status = case when status = 'cancelled' then 'cancelled' else 'pending' end;

  update public.printers
     set status = case when sort_order = 8 then 'maintenance' else 'idle' end,
         status_note = case when sort_order = 8 then 'scheduled nozzle service' end,
         last_seen_at = now();
end;
$$;

revoke all on function public.sim_tick()                 from public, anon, authenticated;
revoke all on function public.sim_start_job(uuid)        from public, anon, authenticated;
revoke all on function public.sim_set_enabled(boolean)   from public, anon, authenticated;
revoke all on function public.sim_force_complete(uuid)   from public, anon, authenticated;
revoke all on function public.sim_reset()                from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- schedule it
-- ---------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_cron;

  perform cron.unschedule('sim-tick')
   where exists (select 1 from cron.job where jobname = 'sim-tick');

  perform cron.schedule('sim-tick', '10 seconds', 'select public.sim_tick();');
exception
  when others then
    raise notice 'pg_cron unavailable (%). Drive the simulator via POST /api/sim {"action":"tick"} instead.', sqlerrm;
end;
$$;
