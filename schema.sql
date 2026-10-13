-- ============================================================
--  Famiglia Moltisanti — esquema de base de datos (Supabase)
--  Pégalo completo en Supabase → SQL Editor → Run
-- ============================================================

-- 1) Perfiles de miembros (ligados al sistema de login)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  rank text not null default 'Associato',
  created_at timestamptz not null default now()
);

-- 2) Tablón de mensajes (solo miembros)
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null,
  content text not null check (char_length(content) between 1 and 400),
  created_at timestamptz not null default now()
);

-- 3) Anuncios (lectura pública, los escribes tú desde el panel de Supabase)
create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- 4) Crear el perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Seguridad (Row Level Security)
alter table public.profiles      enable row level security;
alter table public.posts         enable row level security;
alter table public.announcements enable row level security;

-- Perfiles: cualquiera puede contar/leer; cada quien edita solo el suyo (el rango NO se cambia desde la web)
create policy "perfiles visibles" on public.profiles for select using (true);
create policy "editar mi perfil" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id and rank = (select rank from public.profiles where id = auth.uid()));

-- Tablón: solo usuarios con sesión leen; solo escribes/borras lo tuyo
create policy "leer tablon (miembros)" on public.posts for select to authenticated using (true);
create policy "escribir en tablon"      on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "borrar mis mensajes"     on public.posts for delete to authenticated using (auth.uid() = user_id);

-- Anuncios: lectura pública (sin políticas de escritura = solo tú desde el panel)
create policy "anuncios publicos" on public.announcements for select using (true);

-- 6) Anuncio de ejemplo
insert into public.announcements (title, body)
values ('Bienvenidos a la Famiglia', 'La web oficial ya está en línea. Únete al Discord y preséntate.');
