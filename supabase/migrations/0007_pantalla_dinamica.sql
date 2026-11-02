-- Identidad del evento para la pantalla
alter table events add column event_type text not null default 'matrimonio'
  check (event_type in ('matrimonio', 'cumpleanos', 'celebracion', 'corporativo', 'otro'));
alter table events add column tagline text check (char_length(tagline) <= 60);
alter table events add column logo_key text;

-- Mensajes sin foto: media_id opcional, con su propia moderación y tiempo en pantalla
alter table messages alter column media_id drop not null;
alter table messages add column moderation moderation_status not null default 'approved';
alter table messages add column approved_at timestamptz;
alter table messages add column screen_expires_at timestamptz;
alter table messages add column upload_session_id uuid references upload_sessions(id) on delete set null;
create index on messages(event_id, moderation) where media_id is null;

create view screen_notes with (security_invoker = true) as
select id, event_id, body, approved_at, screen_expires_at
from messages
where media_id is null and moderation = 'approved';
