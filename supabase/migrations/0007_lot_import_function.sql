-- =====================================================================
-- 0007_lot_import_function.sql
-- =====================================================================
-- One call, one transaction. Writing the audit row and the lots as
-- separate statements from the API route would leave a half-written
-- import behind on any failure, and would need an UPDATE policy on
-- lot_imports purely to backfill the counts afterwards.

create or replace function public.import_lots(
  p_filename   text,
  p_rows       jsonb,
  p_errors     jsonb default '[]'::jsonb,
  p_total_rows int  default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_import_id uuid;
  v_row       jsonb;
  v_inserted  int := 0;
  v_updated   int := 0;
  v_was_new   boolean;
begin
  if not public.can_write_lots() then
    raise exception 'operator or admin role required' using errcode = '42501';
  end if;

  insert into public.lot_imports (filename, uploaded_by, row_count, error_count, errors)
  values (
    p_filename, auth.uid(), p_total_rows,
    coalesce(jsonb_array_length(p_errors), 0), p_errors
  ) returning id into v_import_id;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    insert into public.lots (
      lot_number, product_code, description, quantity_target, due_date, import_id
    ) values (
      v_row ->> 'lot_number',
      nullif(v_row ->> 'product_code', ''),
      nullif(v_row ->> 'description', ''),
      coalesce((v_row ->> 'quantity_target')::int, 1),
      nullif(v_row ->> 'due_date', '')::date,
      v_import_id
    )
    on conflict (lot_number) do update
      set product_code    = excluded.product_code,
          description     = excluded.description,
          quantity_target = excluded.quantity_target,
          due_date        = excluded.due_date,
          import_id       = excluded.import_id
    -- xmax = 0 on a freshly inserted tuple; non-zero means the ON
    -- CONFLICT path updated a lot that already existed. Re-uploading a
    -- corrected sheet therefore updates instead of duplicating, and
    -- deliberately leaves status and quantity_done alone.
    returning (xmax = 0) into v_was_new;

    if v_was_new then
      v_inserted := v_inserted + 1;
    else
      v_updated := v_updated + 1;
    end if;
  end loop;

  update public.lot_imports
     set inserted_count = v_inserted, updated_count = v_updated
   where id = v_import_id;

  return jsonb_build_object(
    'import_id',      v_import_id,
    'inserted_count', v_inserted,
    'updated_count',  v_updated,
    'error_count',    coalesce(jsonb_array_length(p_errors), 0),
    'row_count',      p_total_rows
  );
end;
$$;

revoke all on function public.import_lots(text, jsonb, jsonb, int) from public, anon;
grant execute on function public.import_lots(text, jsonb, jsonb, int) to authenticated;
