-- Operador de pantalla con enlace propio y moderación por anfitriones

alter table events add column hosts_can_moderate boolean not null default true;

create table operator_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  token_hash text not null unique,      -- sha256 del token
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table operator_links enable row level security;
alter table operator_links force row level security;
create policy admin_all on operator_links for all to authenticated using (is_admin()) with check (is_admin());

-- El rol por usuario de event_access queda sin uso: el operador entra con enlace, como el fotógrafo.
