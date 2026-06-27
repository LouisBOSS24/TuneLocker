-- ============================================================
--  TuneLocker — Table "profiles" liée à l'authentification
--  À exécuter dans Supabase : SQL Editor > New query > Run
--  Le script est idempotent : peut être ré-exécuté sans danger.
-- ============================================================

-- 1) Table profiles (1 ligne <-> 1 ligne dans auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  first_name    text,
  last_name     text,
  username      text unique,
  last_seen_at  timestamptz,
  created_at    timestamptz default now()
);

-- Compat : colonnes pour les bases déjà créées avant cette version
alter table public.profiles add column if not exists username     text;
alter table public.profiles add column if not exists last_seen_at timestamptz;

-- Unicité du pseudo (si la contrainte n'est pas déjà en place)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_key'
  ) then
    alter table public.profiles add constraint profiles_username_key unique (username);
  end if;
end $$;

-- 2) Row Level Security
alter table public.profiles enable row level security;

drop policy if exists "Profils visibles par tous" on public.profiles;
create policy "Profils visibles par tous"
  on public.profiles for select
  using (true);

drop policy if exists "Modifier son profil" on public.profiles;
create policy "Modifier son profil"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Créer son profil" on public.profiles;
create policy "Créer son profil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3) Trigger : à l'inscription, on crée le profil depuis les métadonnées.
--    ON CONFLICT DO NOTHING : évite que le trigger casse si la ligne existe
--    déjà (par exemple, créée à la main).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'username'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4) BACKFILL : crée le profil des utilisateurs déjà inscrits
--    Utile si tu avais des comptes créés AVANT que le trigger
--    n'existe / soit à jour. Aussi safe à ré-exécuter (no-op si OK).
-- ============================================================

insert into public.profiles (id, first_name, last_name, username)
select
  u.id,
  u.raw_user_meta_data ->> 'first_name',
  u.raw_user_meta_data ->> 'last_name',
  u.raw_user_meta_data ->> 'username'
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- Mise à jour des champs manquants (si certains profils ont été créés
-- avec des champs null mais que les métadonnées contiennent les valeurs).
update public.profiles p
set
  first_name = coalesce(p.first_name, u.raw_user_meta_data ->> 'first_name'),
  last_name  = coalesce(p.last_name,  u.raw_user_meta_data ->> 'last_name'),
  username   = coalesce(p.username,   u.raw_user_meta_data ->> 'username')
from auth.users u
where p.id = u.id
  and (
    p.first_name is null
    or p.last_name is null
    or p.username is null
  );
