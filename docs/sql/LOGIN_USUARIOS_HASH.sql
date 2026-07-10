-- Ejecutar una sola vez desde Supabase SQL Editor.
-- Migra public.usuarios.password a password_hash con bcrypt y crea sesiones administrativas por RPC.

create extension if not exists pgcrypto with schema extensions;

alter table public.usuarios
  add column if not exists password_hash text;

update public.usuarios
set password_hash = extensions.crypt(password, extensions.gen_salt('bf', 12))
where password_hash is null
  and password is not null
  and length(password) > 0;

update public.usuarios
set password = null
where password_hash is not null
  and password is not null;

alter table public.usuarios enable row level security;

revoke all on table public.usuarios from anon;
revoke all on table public.usuarios from authenticated;

create table if not exists public.admin_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  usuario_id integer not null,
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists admin_sessions_token_hash_idx on public.admin_sessions (token_hash);
create index if not exists admin_sessions_expires_at_idx on public.admin_sessions (expires_at);

alter table public.admin_sessions enable row level security;

revoke all on table public.admin_sessions from anon;
revoke all on table public.admin_sessions from authenticated;

create or replace function public.login_admin(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user record;
  v_token text;
begin
  select id, username, password_hash
    into v_user
  from public.usuarios
  where lower(trim(username)) = lower(trim(coalesce(p_username, '')))
    and activo is true
  limit 1;

  if v_user.id is null or v_user.password_hash is null then
    return jsonb_build_object('ok', false);
  end if;

  if v_user.password_hash <> extensions.crypt(coalesce(p_password, ''), v_user.password_hash) then
    return jsonb_build_object('ok', false);
  end if;

  delete from public.admin_sessions
  where expires_at <= now()
     or usuario_id = v_user.id;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.admin_sessions (usuario_id, token_hash, expires_at)
  values (v_user.id, encode(extensions.digest(v_token, 'sha256'), 'hex'), now() + interval '8 hours');

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'username', v_user.username
  );
end;
$$;

create or replace function public.validar_sesion_admin(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user record;
begin
  if coalesce(p_token, '') = '' then
    return jsonb_build_object('authenticated', false);
  end if;

  delete from public.admin_sessions
  where expires_at <= now();

  select u.username
    into v_user
  from public.admin_sessions s
  join public.usuarios u on u.id = s.usuario_id
  where s.expires_at > now()
    and u.activo is true
    and s.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  limit 1;

  if v_user.username is null then
    return jsonb_build_object('authenticated', false);
  end if;

  return jsonb_build_object(
    'authenticated', true,
    'username', v_user.username
  );
end;
$$;

create or replace function public.logout_admin(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if coalesce(p_token, '') <> '' then
    delete from public.admin_sessions
    where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.login_admin(text, text) from public;
revoke all on function public.validar_sesion_admin(text) from public;
revoke all on function public.logout_admin(text) from public;

grant execute on function public.login_admin(text, text) to anon;
grant execute on function public.validar_sesion_admin(text) to anon;
grant execute on function public.logout_admin(text) to anon;

comment on column public.usuarios.password is 'Columna legacy. Queda en NULL luego de generar password_hash y puede eliminarse más adelante.';
