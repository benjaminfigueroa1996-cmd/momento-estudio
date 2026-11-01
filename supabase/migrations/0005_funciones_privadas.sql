-- Mueve las funciones de permisos a un esquema que la API no expone (revisor de seguridad de Supabase).
-- Las políticas RLS las referencian por identificador interno, así que siguen funcionando.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_admin() set schema private;
alter function public.is_operator(uuid) set schema private;
alter function public.promote_owner() set schema private;
alter function public.hit_rate_limit(text, int, int) set schema private;

revoke all on function private.is_admin() from public, anon;
revoke all on function private.is_operator(uuid) from public, anon;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_operator(uuid) to authenticated;
grant usage on schema private to service_role;
grant execute on function private.hit_rate_limit(text, int, int) to service_role;

-- La plataforma llama al límite de solicitudes por la API con la clave de servicio.
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language sql security invoker set search_path = '' as $$
  select private.hit_rate_limit(p_key, p_max, p_window_seconds);
$$;
revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;
