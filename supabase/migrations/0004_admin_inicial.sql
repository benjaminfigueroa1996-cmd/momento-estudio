-- Convierte en administrador al dueño de Momento Estudio cuando se cree su usuario.
create or replace function promote_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'benjaminfigueroa1996@gmail.com' then
    insert into admins(user_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end $$;

revoke all on function promote_owner() from public, anon, authenticated;

create trigger promote_owner_after_insert
  after insert on auth.users
  for each row execute function promote_owner();
