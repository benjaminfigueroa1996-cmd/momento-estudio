-- Momento Estudio · esquema inicial
-- Regla central: un archivo físico (media) puede tener varios destinos (media_destinations).
-- El álbum de invitados solo ve destino 'album'; los anfitriones ven todo.

create extension if not exists pgcrypto with schema extensions;

create type media_source as enum ('guest', 'photographer', 'station');
create type destination as enum ('screen', 'album');
create type moderation_status as enum ('pending', 'approved', 'rejected', 'removed');
create type media_status as enum ('uploading', 'ready', 'failed');

-- Administradores de Momento Estudio (usuarios de Supabase Auth)
create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 40),
  event_type text not null check (char_length(event_type) <= 60),
  event_date date,
  location text check (char_length(location) <= 160),
  guests int check (guests between 1 and 5000),
  comments text check (char_length(comments) <= 3000),
  status text not null default 'nueva',
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,60}$'),
  name text not null,
  hosts_names text not null,
  starts_at timestamptz not null,
  timezone text not null default 'America/Santiago',
  city text,
  cover_key text,
  theme jsonb not null default '{}'::jsonb,
  -- pantalla
  screen_key text not null default encode(extensions.gen_random_bytes(18), 'hex'),
  screen_slide_seconds int not null default 10 check (screen_slide_seconds between 3 and 120),
  screen_ttl_minutes int not null default 45 check (screen_ttl_minutes between 1 and 1440),
  -- moderación independiente por destino
  moderate_screen boolean not null default true,
  moderate_album boolean not null default false,
  -- álbum
  album_enabled boolean not null default true,
  guest_downloads boolean not null default true,
  -- límites
  max_uploads_per_guest int not null default 30 check (max_uploads_per_guest between 1 and 500),
  max_file_mb int not null default 25 check (max_file_mb between 1 and 200),
  -- ciclo de vida (ninguno elimina archivos por sí solo)
  uploads_close_at timestamptz,
  album_until timestamptz,
  host_access_until timestamptz,
  retention_until timestamptz,
  created_at timestamptz not null default now()
);

-- Acceso privado de anfitriones (couple_access)
create table couple_access (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  code_hash text not null,              -- scrypt, nunca el código en claro
  label text not null default 'Anfitriones',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index on couple_access(event_id);

-- Personal con acceso a eventos específicos (operador de pantalla)
create table event_access (
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('operator')),
  primary key (event_id, user_id)
);

-- Enlaces de carga del fotógrafo autorizado
create table photographer_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  token_hash text not null unique,      -- sha256 del token
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Estaciones iPad (device_sessions)
create table device_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  pairing_code_hash text,               -- código corto de un solo uso
  pairing_expires_at timestamptz,
  token_hash text unique,               -- token largo entregado al iPad
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Sesiones de carga de invitados (anónimas, sin cuenta)
create table upload_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  guest_token_hash text not null,
  ip_hash text,
  uploads_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, guest_token_hash)
);

-- Archivos físicos: una fila = un objeto original en R2
create table media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  source media_source not null,
  status media_status not null default 'uploading',
  original_key text not null unique,
  display_key text,                     -- versión liviana para pantalla y álbum
  thumb_key text,
  mime text not null,
  bytes bigint,
  width int,
  height int,
  sha256 text,
  upload_session_id uuid references upload_sessions(id) on delete set null,
  photographer_link_id uuid references photographer_links(id) on delete set null,
  device_session_id uuid references device_sessions(id) on delete set null,
  original_filename text,
  created_at timestamptz not null default now()
);
create index on media(event_id, created_at desc);
-- evita duplicados del fotógrafo dentro del mismo evento
create unique index media_photographer_dedupe on media(event_id, sha256)
  where source = 'photographer' and sha256 is not null and status <> 'failed';

-- Destinos de cada archivo; sin copiar el original
create table media_destinations (
  media_id uuid not null references media(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  destination destination not null,
  moderation moderation_status not null default 'pending',
  featured boolean not null default false,
  approved_at timestamptz,
  screen_expires_at timestamptz,        -- solo pantalla: sale de la rotación, no se borra
  primary key (media_id, destination)
);
create index on media_destinations(event_id, destination, moderation);

-- Versiones intervenidas en el iPad: original intacto + nueva fila media
create table media_versions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  original_media_id uuid not null references media(id) on delete cascade,
  edited_media_id uuid not null unique references media(id) on delete cascade,
  device_session_id uuid references device_sessions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);
create index on messages(event_id);

create table photographer_uploads (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references photographer_links(id) on delete cascade,
  media_id uuid references media(id) on delete set null,
  filename text not null,
  status text not null check (status in ('ok', 'duplicate', 'error')),
  error text,
  created_at timestamptz not null default now()
);

-- Historial de moderación (moderation)
create table moderation (
  id bigint generated always as identity primary key,
  event_id uuid not null references events(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  destination destination not null,
  action text not null check (action in ('approve', 'reject', 'remove', 'feature', 'unfeature')),
  actor text not null,
  created_at timestamptz not null default now()
);

-- Estado de la pantalla en vivo, controlado desde administración
create table live_state (
  event_id uuid primary key references events(id) on delete cascade,
  paused boolean not null default false,
  layout text not null default 'auto' check (layout in ('auto', 'full', 'message', 'mosaic', 'gallery', 'featured')),
  featured_media_id uuid references media(id) on delete set null,
  show_qr boolean not null default true,
  updated_at timestamptz not null default now()
);

create table export_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  requested_by text not null,
  status text not null default 'streaming',
  files_count int,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id bigint generated always as identity primary key,
  event_id uuid references events(id) on delete cascade,
  actor_type text not null check (actor_type in ('admin', 'host', 'guest', 'photographer', 'device', 'system')),
  actor_id text,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on audit_logs(event_id, created_at desc);

-- Integraciones externas: vacía hasta que se apruebe alguna
create table integrations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Límite de solicitudes por clave (IP anonimizada, evento, código)
create table rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);

-- Devuelve true si la solicitud entra en el límite
create or replace function hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  r rate_limits;
begin
  insert into rate_limits(key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then 1 else rate_limits.count + 1 end,
    window_start = case when rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then now() else rate_limits.window_start end
  returning * into r;
  return r.count <= p_max;
end $$;

-- Vista del álbum de invitados: única fuente para el álbum público.
-- Nunca incluye fotos con destino solo pantalla.
create view album_items with (security_invoker = true) as
select m.id, m.event_id, m.source, m.display_key, m.thumb_key, m.original_key, m.width, m.height, m.created_at, d.featured
from media m
join media_destinations d on d.media_id = m.id and d.destination = 'album'
where m.status = 'ready' and d.moderation = 'approved';

-- Cola de pantalla: aprobada y dentro de su tiempo
create view screen_items with (security_invoker = true) as
select m.id, m.event_id, m.display_key, m.width, m.height, d.approved_at, d.screen_expires_at, d.featured,
       (select body from messages msg where msg.media_id = m.id order by created_at limit 1) as message
from media m
join media_destinations d on d.media_id = m.id and d.destination = 'screen'
where m.status = 'ready' and d.moderation = 'approved';
