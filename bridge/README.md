# Connecting real printers

The dashboard never talks to a printer. Everything it shows comes from
two tables, and exactly one function writes them:

```sql
ingest_printer_status(
  p_serial           text,        -- matches printers.serial
  p_status           text,        -- idle | printing | paused | error | offline | maintenance
  p_job_name         text,        -- the G-code filename
  p_progress_pct     numeric,     -- 0..100
  p_layer_current    int,
  p_layer_total      int,
  p_nozzle_temp      numeric,
  p_bed_temp         numeric,
  p_estimated_end_at timestamptz,
  p_filament_used_g  numeric,
  p_status_note      text         -- error text, pause reason, etc.
) returns uuid                     -- the affected print_jobs row
```

That is the whole contract. The simulator calls it today; a bridge on the
shop floor calls it tomorrow. **No UI code changes when you switch.**

The function is idempotent per push: it opens a job when a new filename
appears, updates the open one while the filename stays the same, closes
it when the machine reports idle or error, rolls the finished unit up
onto the lot, and appends a telemetry sample.

## Lot resolution

The lot is resolved from the job filename, in this order:

1. a `LOT-…` token in the name (`LOT-2609-014_bracket.gcode` → `LOT-2609-014`)
2. otherwise, the longest known `lots.lot_number` that appears anywhere
   in the filename

So the client's existing naming convention usually works untouched. If it
does not, adjust `resolve_lot_from_job_name()` in
`supabase/migrations/0003_ingest.sql` — it is the only place that needs
to know the convention.

## Turning the simulator off

```sql
select cron.unschedule('sim-tick');
-- or, to keep the schedule but stop it doing anything:
select public.sim_set_enabled(false);
```

Then delete the `sim_*` functions and `sim_settings`, and remove
`components/sim-controls.tsx` and the force-complete button in
`app/(app)/printers/[id]/printer-detail.tsx`. Nothing else references them.

## Writing the bridge

Run it on a PC or Raspberry Pi on the same network as the printers. It
needs the **service-role key** (server-side only, never in a browser).

```js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,   // service role: bypasses RLS
);

async function push(serial, s) {
  const { error } = await supabase.rpc("ingest_printer_status", {
    p_serial: serial,
    p_status: s.status,
    p_job_name: s.jobName ?? null,
    p_progress_pct: s.progress ?? null,
    p_layer_current: s.layer ?? null,
    p_layer_total: s.layerTotal ?? null,
    p_nozzle_temp: s.nozzle ?? null,
    p_bed_temp: s.bed ?? null,
    p_estimated_end_at: s.eta ?? null,
    p_filament_used_g: s.filament ?? null,
    p_status_note: s.note ?? null,
  });
  if (error) console.error(serial, error.message);
}
```

Push every 5–15 seconds per printer. Faster gains nothing: the UI is
event-driven and the telemetry series is trimmed to six hours.

Register each machine first — `printers.serial` is the key the bridge
addresses, so it must match whatever identifier the printer reports:

```sql
insert into public.printers (name, serial, model, manufacturer, location, sort_order)
values ('Printer 01', '<real serial>', 'X1 Carbon', 'Bambu Lab', 'Bay A', 1);
```

### Per-platform notes

**Bambu Lab (X1C / P1S / A1)** — subscribe over local MQTT to
`device/<serial>/report` on port 8883 (TLS, username `bblp`, password =
the printer's LAN access code, which also requires LAN mode enabled).
Map `print.gcode_state` → status (`RUNNING`→printing, `PAUSE`→paused,
`FINISH`/`IDLE`→idle, `FAILED`→error), `mc_percent` → progress,
`mc_remaining_time` (minutes) → `now() + interval`, `gcode_file` →
job name, `nozzle_temper` / `bed_temper` → temps.

**OctoPrint** — poll `GET /api/printer` and `GET /api/job` with an
`X-Api-Key` header. `job.file.name` → job name,
`progress.completion` → progress, `progress.printTimeLeft` (seconds) → ETA.

**Klipper / Moonraker** — subscribe to the websocket at
`/websocket`, or poll
`/printer/objects/query?print_stats&virtual_sdcard&extruder&heater_bed`.
`print_stats.state` → status, `virtual_sdcard.progress` (0–1, ×100) →
progress, `print_stats.filename` → job name.

**PrusaLink / Prusa Connect** — `GET /api/v1/status` and
`GET /api/v1/job` with the `X-Api-Key` header, on the printer's local
address.

### Things worth getting right

- **Send a terminal status.** A job only closes when the machine reports
  `idle`, `error` or a different filename. A bridge that stops pushing
  leaves the job open forever.
- **Push `offline` yourself** when a printer stops answering. Nothing
  else marks a machine unreachable.
- **Keep `p_serial` stable.** It is the identity the whole floor is keyed
  on.
