-- Nuevo diseño de pantalla "conversación" (estilo chat)
alter table live_state drop constraint if exists live_state_layout_check;
alter table live_state add constraint live_state_layout_check
  check (layout in ('auto', 'chat', 'full', 'message', 'mosaic', 'gallery', 'featured'));
