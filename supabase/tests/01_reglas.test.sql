-- pgTAP: ejecutar con `supabase test db`
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into events(id, slug, name, hosts_names, starts_at) values
  ('00000000-0000-0000-0000-00000000000a', 'evento-a', 'A', 'Ana y Luis', now()),
  ('00000000-0000-0000-0000-00000000000b', 'evento-b', 'B', 'Sofía y Tomás', now());

insert into media(id, event_id, source, status, original_key, mime) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'guest', 'ready', 'a/1', 'image/jpeg'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', 'guest', 'ready', 'a/2', 'image/jpeg'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-00000000000a', 'guest', 'ready', 'a/3', 'image/jpeg'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'guest', 'ready', 'b/1', 'image/jpeg');

-- a1: solo pantalla · a2: solo álbum · a3: ambos
insert into media_destinations(media_id, event_id, destination, moderation, approved_at, screen_expires_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'screen', 'approved', now(), now() + interval '30 minutes'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', 'album', 'approved', now(), null),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-00000000000a', 'screen', 'approved', now(), now() + interval '30 minutes'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-00000000000a', 'album', 'approved', now(), null),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'album', 'approved', now(), null);

-- Prueba 1: solo pantalla no aparece en el álbum
select is((select count(*)::int from album_items where id = '00000000-0000-0000-0000-0000000000a1'), 0, 'foto solo pantalla fuera del álbum');
-- Prueba 2: solo álbum no aparece en pantalla
select is((select count(*)::int from screen_items where id = '00000000-0000-0000-0000-0000000000a2'), 0, 'foto solo álbum fuera de pantalla');
-- Prueba 3: ambos destinos, un solo archivo
select is((select count(*)::int from media where original_key = 'a/3'), 1, 'un solo original con dos destinos');
select is((select count(*)::int from album_items where id = '00000000-0000-0000-0000-0000000000a3'), 1, 'ambos: en álbum');
-- Prueba 10: aislamiento por evento en el álbum
select is((select count(*)::int from album_items where event_id = '00000000-0000-0000-0000-00000000000a'), 2, 'álbum A solo con fotos de A');

-- Prueba 9: tras expirar en pantalla, el original sigue existiendo
update media_destinations set screen_expires_at = now() - interval '1 minute'
  where media_id = '00000000-0000-0000-0000-0000000000a1' and destination = 'screen';
select is((select count(*)::int from media where id = '00000000-0000-0000-0000-0000000000a1'), 1, 'expirar en pantalla no elimina');

-- RLS: la clave anónima no ve nada
set local role anon;
select is((select count(*)::int from media), 0, 'anon no lee media');
reset role;

select * from finish();
rollback;
