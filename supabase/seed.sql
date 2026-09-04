-- =====================================================================
-- seed.sql — demo floor: 8 identical printers + a lot backlog
-- =====================================================================
-- Idempotent: safe to re-run.

insert into public.printers (name, serial, model, manufacturer, location, status, status_note, sort_order)
values
  ('Printer 01', 'SG-3DP-0001', 'X1 Carbon', 'Bambu Lab', 'Bay A · Line 1', 'idle', null, 1),
  ('Printer 02', 'SG-3DP-0002', 'X1 Carbon', 'Bambu Lab', 'Bay A · Line 1', 'idle', null, 2),
  ('Printer 03', 'SG-3DP-0003', 'X1 Carbon', 'Bambu Lab', 'Bay A · Line 2', 'idle', null, 3),
  ('Printer 04', 'SG-3DP-0004', 'X1 Carbon', 'Bambu Lab', 'Bay A · Line 2', 'idle', null, 4),
  ('Printer 05', 'SG-3DP-0005', 'X1 Carbon', 'Bambu Lab', 'Bay B · Line 1', 'idle', null, 5),
  ('Printer 06', 'SG-3DP-0006', 'X1 Carbon', 'Bambu Lab', 'Bay B · Line 1', 'idle', null, 6),
  ('Printer 07', 'SG-3DP-0007', 'X1 Carbon', 'Bambu Lab', 'Bay B · Line 2', 'idle', null, 7),
  ('Printer 08', 'SG-3DP-0008', 'X1 Carbon', 'Bambu Lab', 'Bay B · Line 2', 'maintenance',
   'scheduled nozzle service', 8)
on conflict (serial) do nothing;

insert into public.lots (lot_number, product_code, description, quantity_target, due_date, priority)
values
  ('LOT-2609-001', 'PRD-A100', 'Mounting bracket, left hand',        6, current_date + 1,  10),
  ('LOT-2609-002', 'PRD-A100', 'Mounting bracket, right hand',       6, current_date + 1,  10),
  ('LOT-2609-003', 'PRD-B220', 'Sensor housing, revision 2',         4, current_date + 2,  20),
  ('LOT-2609-004', 'PRD-B220', 'Sensor housing cover',               4, current_date + 2,  20),
  ('LOT-2609-005', 'PRD-C310', 'Cable clip, 12mm',                  12, current_date + 2,  30),
  ('LOT-2609-006', 'PRD-C310', 'Cable clip, 18mm',                  12, current_date + 3,  30),
  ('LOT-2609-007', 'PRD-D440', 'Manifold body',                      3, current_date + 3,  40),
  ('LOT-2609-008', 'PRD-D440', 'Manifold end cap',                   6, current_date + 3,  40),
  ('LOT-2609-009', 'PRD-E550', 'Gearcase shell, upper',              5, current_date + 4,  50),
  ('LOT-2609-010', 'PRD-E550', 'Gearcase shell, lower',              5, current_date + 4,  50),
  ('LOT-2609-011', 'PRD-F660', 'Alignment jig plate',                2, current_date + 5,  60),
  ('LOT-2609-012', 'PRD-F660', 'Alignment jig pin block',            4, current_date + 5,  60),
  ('LOT-2609-013', 'PRD-A100', 'Bracket spacer, 3mm',               20, current_date + 6,  70),
  ('LOT-2609-014', 'PRD-G770', 'Inspection fixture base',            2, current_date + 7,  80),
  ('LOT-2609-015', 'PRD-G770', 'Inspection fixture arm',             4, current_date + 7,  80),
  ('LOT-2609-016', 'PRD-H880', 'Test coupon, tensile',              10, current_date + 8,  90),
  ('LOT-2609-017', 'PRD-H880', 'Test coupon, impact',               10, current_date + 8,  90),
  ('LOT-2609-018', 'PRD-B220', 'Housing gasket former',              6, current_date + 9, 100),
  ('LOT-2609-019', 'PRD-C310', 'Clip retainer strip',                8, current_date + 10, 110),
  ('LOT-2609-020', 'PRD-D440', 'Manifold flow insert',               6, current_date + 12, 120)
on conflict (lot_number) do nothing;

-- Kick the floor off so the dashboard is never empty on first load:
-- start a job on each free printer, then wind three of them forward so
-- the client immediately sees jobs at different stages.
do $$
declare
  r record;
  n int := 0;
begin
  for r in select id from public.printers where status = 'idle' order by sort_order loop
    perform public.sim_start_job(r.id);
  end loop;

  for r in select j.id from public.print_jobs j
            join public.printers p on p.id = j.printer_id
           where j.status = 'printing' order by p.sort_order
  loop
    n := n + 1;
    if n = 1 then
      -- nearly done: completes within a couple of minutes of the demo
      update public.print_jobs
         set started_at = now() - (estimated_end_at - started_at) * 0.97,
             estimated_end_at = now() + interval '90 seconds'
       where id = r.id;
    elsif n = 2 then
      update public.print_jobs
         set started_at = now() - (estimated_end_at - started_at) * 0.6
       where id = r.id;
    elsif n = 3 then
      update public.print_jobs
         set started_at = now() - (estimated_end_at - started_at) * 0.3
       where id = r.id;
    end if;
  end loop;
end;
$$;
