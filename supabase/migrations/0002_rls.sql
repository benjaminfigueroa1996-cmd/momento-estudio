-- Row Level Security: nada es visible con la clave anónima.
-- Invitados, anfitriones, fotógrafo e iPads pasan por rutas del servidor que validan su acceso
-- y filtran por event_id. Solo los administradores autenticados leen directo.

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

create or replace function is_operator(p_event uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from event_access where user_id = auth.uid() and event_id = p_event and role = 'operator');
$$;

do $$
declare t text;
begin
  foreach t in array array['admins','settings','quote_requests','events','couple_access','event_access',
    'photographer_links','device_sessions','upload_sessions','media','media_destinations','media_versions',
    'messages','photographer_uploads','moderation','live_state','export_jobs','audit_logs','integrations','rate_limits']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('create policy admin_all on %I for all to authenticated using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- El operador de pantalla solo controla la pantalla de sus eventos
create policy operator_read_event on events for select to authenticated using (is_operator(id));
create policy operator_live on live_state for all to authenticated
  using (is_operator(event_id)) with check (is_operator(event_id));

-- Configuración pública del sitio (correo y teléfono comerciales cuando se definan)
create policy public_settings on settings for select to anon, authenticated
  using (key in ('contact_email', 'contact_phone', 'contact_instagram'));

revoke all on function hit_rate_limit(text, int, int) from public, anon, authenticated;
