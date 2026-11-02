-- Cada foto y mensaje se proyecta una sola vez: se registra cuándo entró a la pantalla
alter table media_destinations add column screen_played_at timestamptz;
alter table messages add column screen_played_at timestamptz;

create or replace view screen_items with (security_invoker = true) as
select m.id, m.event_id, m.display_key, m.width, m.height, d.approved_at, d.screen_expires_at, d.featured,
       (select body from messages msg where msg.media_id = m.id order by created_at limit 1) as message,
       d.screen_played_at
from media m
join media_destinations d on d.media_id = m.id and d.destination = 'screen'
where m.status = 'ready' and d.moderation = 'approved';

create or replace view screen_notes with (security_invoker = true) as
select id, event_id, body, approved_at, screen_expires_at, screen_played_at
from messages
where media_id is null and moderation = 'approved';
