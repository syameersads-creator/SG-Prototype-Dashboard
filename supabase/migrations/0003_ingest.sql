-- =====================================================================
-- 0003_ingest.sql — the printer ingest contract
-- =====================================================================
-- This is the ONLY way printer state enters the system. The simulator
-- (0004) calls it today; a real shop-floor bridge will call it tomorrow
-- with the service-role key. Swapping the data source therefore changes
-- nothing above this line — see bridge/README.md.

-- Resolve a lot from a G-code filename, e.g. "LOT-2409-014_bracket.gcode".
-- Falls back to matching any known lot number appearing in the name, so
-- the client's real naming convention does not have to match ours.
create or replace function public.resolve_lot_from_job_name(p_job_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_token text;
  v_lot_id uuid;
begin
  if p_job_name is null then
    return null;
  end if;

  v_token := substring(upper(p_job_name) from '(LOT[-_][A-Z0-9]+(?:[-_][A-Z0-9]+)*)');

  if v_token is not null then
    select id into v_lot_id
    from public.lots
    where upper(lot_number) = replace(v_token, '_', '-')
       or upper(lot_number) = v_token;
    if v_lot_id is not null then
      return v_lot_id;
    end if;
  end if;

  -- Last resort: longest known lot number contained in the filename.
  select id into v_lot_id
  from public.lots
  where position(upper(lot_number) in upper(p_job_name)) > 0
  order by length(lot_number) desc
  limit 1;

  return v_lot_id;
end;
$$;

-- Close out a job and roll the result up onto its lot.
create or replace function public.close_job(
  p_job_id uuid,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot_id uuid;
begin
  update public.print_jobs
     set status         = p_status,
         progress_pct   = case when p_status = 'completed' then 100 else progress_pct end,
         ended_at       = now(),
         failure_reason = p_reason
   where id = p_job_id
  returning lot_id into v_lot_id;

  if p_status = 'completed' and v_lot_id is not null then
    update public.lots
       set quantity_done = quantity_done + 1,
           status = case
                      when quantity_done + 1 >= quantity_target then 'completed'
                      else 'in_progress'
                    end
     where id = v_lot_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- ingest_printer_status — the contract
-- ---------------------------------------------------------------------
create or replace function public.ingest_printer_status(
  p_serial           text,
  p_status           text,
  p_job_name         text        default null,
  p_progress_pct     numeric     default null,
  p_layer_current    int         default null,
  p_layer_total      int         default null,
  p_nozzle_temp      numeric     default null,
  p_bed_temp         numeric     default null,
  p_estimated_end_at timestamptz default null,
  p_filament_used_g  numeric     default null,
  p_status_note      text        default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_printer_id uuid;
  v_job public.print_jobs%rowtype;
  v_job_id uuid;
begin
  if p_status not in ('idle','printing','paused','error','offline','maintenance') then
    raise exception 'unknown printer status: %', p_status;
  end if;

  select id into v_printer_id from public.printers where serial = p_serial;
  if v_printer_id is null then
    raise exception 'unknown printer serial: %', p_serial;
  end if;

  update public.printers
     set status       = p_status,
         status_note  = p_status_note,
         last_seen_at = now()
   where id = v_printer_id;

  select * into v_job
    from public.print_jobs
   where printer_id = v_printer_id
     and status in ('queued','printing','paused')
   limit 1;

  if p_status in ('printing','paused') and p_job_name is not null then
    -- A different filename means the previous job ended without us
    -- being told; treat a near-finished one as done, otherwise cancelled.
    if v_job.id is not null and v_job.job_name is distinct from p_job_name then
      perform public.close_job(
        v_job.id,
        case when v_job.progress_pct >= 99 then 'completed' else 'cancelled' end,
        case when v_job.progress_pct >= 99 then null else 'superseded by a new job' end
      );
      v_job := null;
    end if;

    if v_job.id is null then
      insert into public.print_jobs (
        printer_id, lot_id, job_name, status, progress_pct,
        layer_current, layer_total, nozzle_temp, bed_temp,
        estimated_end_at, filament_used_g
      )
      values (
        v_printer_id,
        public.resolve_lot_from_job_name(p_job_name),
        p_job_name,
        p_status,
        coalesce(p_progress_pct, 0),
        coalesce(p_layer_current, 0),
        coalesce(p_layer_total, 0),
        p_nozzle_temp, p_bed_temp,
        p_estimated_end_at,
        coalesce(p_filament_used_g, 0)
      )
      returning id into v_job_id;

      update public.lots
         set status = 'in_progress'
       where id = (select lot_id from public.print_jobs where id = v_job_id)
         and status = 'pending';
    else
      update public.print_jobs
         set status           = p_status,
             progress_pct     = coalesce(p_progress_pct, progress_pct),
             layer_current    = coalesce(p_layer_current, layer_current),
             layer_total      = coalesce(p_layer_total, layer_total),
             nozzle_temp      = coalesce(p_nozzle_temp, nozzle_temp),
             bed_temp         = coalesce(p_bed_temp, bed_temp),
             estimated_end_at = coalesce(p_estimated_end_at, estimated_end_at),
             filament_used_g  = coalesce(p_filament_used_g, filament_used_g)
       where id = v_job.id
      returning id into v_job_id;
    end if;

  elsif v_job.id is not null then
    -- Machine reports it is no longer running: settle the open job.
    perform public.close_job(
      v_job.id,
      case
        when coalesce(p_progress_pct, v_job.progress_pct) >= 99 then 'completed'
        when p_status = 'error' then 'failed'
        else 'cancelled'
      end,
      case when p_status = 'error' then coalesce(p_status_note, 'printer reported an error') end
    );
    v_job_id := v_job.id;
  end if;

  insert into public.printer_telemetry (printer_id, job_id, progress_pct, nozzle_temp, bed_temp)
  values (v_printer_id, v_job_id, p_progress_pct, p_nozzle_temp, p_bed_temp);

  return v_job_id;
end;
$$;

revoke all on function public.ingest_printer_status(
  text, text, text, numeric, int, int, numeric, numeric, timestamptz, numeric, text
) from public, anon, authenticated;
