-- =====================================================================
-- 0006_harden_function_privileges.sql
-- =====================================================================
-- Postgres grants EXECUTE to PUBLIC on every new function, which exposes
-- each SECURITY DEFINER helper through PostgREST's /rpc endpoint.
-- close_job() in particular would have let an anonymous caller mark jobs
-- complete and inflate lot counts. Flagged by the Supabase database
-- linter; these are the fixes.

revoke all on function public.close_job(uuid, text, text)     from public, anon, authenticated;
revoke all on function public.resolve_lot_from_job_name(text) from public, anon, authenticated;
revoke all on function public.handle_new_user()               from public, anon, authenticated;
revoke all on function public.sim_manual_tick()               from public, anon;
revoke all on function public.sim_set_enabled(boolean)        from public, anon;
revoke all on function public.sim_force_complete(uuid)        from public, anon;
revoke all on function public.sim_reset()                     from public, anon;
revoke all on function public.require_admin()                 from public, anon;
revoke all on function public.current_user_role()             from public, anon;
revoke all on function public.can_write_lots()                from public, anon;

-- current_user_role() and can_write_lots() stay executable by
-- authenticated: the RLS policies call them as the querying user, and
-- they only ever reveal the caller's own role.
grant execute on function public.current_user_role() to authenticated;

-- Pin search_path on the two functions that were missing it, so a caller
-- cannot shadow the objects they resolve.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.can_write_lots()
returns boolean language sql stable set search_path = public as $$
  select auth.uid() is not null and public.current_user_role() in ('admin','operator');
$$;

revoke all on function public.can_write_lots() from public, anon;
grant execute on function public.can_write_lots() to authenticated;
