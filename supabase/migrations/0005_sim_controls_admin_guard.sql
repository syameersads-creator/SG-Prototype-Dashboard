-- =====================================================================
-- 0005_sim_controls_admin_guard.sql
-- =====================================================================
-- The demo controls are called straight from the browser by a signed-in
-- admin. Re-checking the role inside each SECURITY DEFINER function means
-- the web tier never needs to hold a service-role key.

create or replace function public.require_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'admin role required' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.sim_set_enabled(p_enabled boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_enabled boolean;
begin
  perform public.require_admin();
  update public.sim_settings set enabled = p_enabled, updated_at = now()
   where id returning enabled into v_enabled;
  return v_enabled;
end;
$$;

create or replace function public.sim_force_complete(p_printer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_serial text;
  v_job public.print_jobs%rowtype;
begin
  perform public.require_admin();

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

create or replace function public.sim_reset()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  perform public.require_admin();

  delete from public.printer_telemetry;
  delete from public.print_jobs;

  update public.lots
     set quantity_done = 0,
         status = case when status = 'cancelled' then 'cancelled' else 'pending' end;

  update public.printers
     set status = case when sort_order = 8 then 'maintenance' else 'idle' end,
         status_note = case when sort_order = 8 then 'scheduled nozzle service' end,
         last_seen_at = now();

  -- Refill the floor immediately so a reset never shows an empty board.
  for r in select id from public.printers where status = 'idle' order by sort_order loop
    perform public.sim_start_job(r.id);
  end loop;
end;
$$;

-- Manual tick, for when pg_cron is unavailable or a demo needs a nudge.
create or replace function public.sim_manual_tick()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  perform public.sim_tick();
end;
$$;

grant execute on function public.sim_set_enabled(boolean) to authenticated;
grant execute on function public.sim_force_complete(uuid) to authenticated;
grant execute on function public.sim_reset()              to authenticated;
grant execute on function public.sim_manual_tick()        to authenticated;
grant execute on function public.require_admin()          to authenticated;
