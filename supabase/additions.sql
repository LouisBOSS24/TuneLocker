-- ============================================================
--  TuneLocker — Additions pour la dernière phase
--  À exécuter dans Supabase : SQL Editor > New query > Run
--  Idempotent : peut être ré-exécuté sans danger.
-- ============================================================

-- 1) Colonnes manquantes sur profiles : bio + avatar_url
alter table public.profiles add column if not exists bio        text;
alter table public.profiles add column if not exists avatar_url text;

-- Rend nullables les champs de profil pour permettre les sauvegardes
-- partielles (juste une bio, juste une photo, etc.).
alter table public.profiles alter column first_name drop not null;
alter table public.profiles alter column last_name  drop not null;
alter table public.profiles alter column username   drop not null;

-- 2) RECRÉE les policies de profiles : SELECT (lecture libre), INSERT
--    (créer son propre profil) et UPDATE (modifier son propre profil).
--    Indispensable pour la recherche d'amis ET pour l'édition du profil
--    depuis la page Paramètres.
alter table public.profiles enable row level security;

drop policy if exists "Profils visibles par tous" on public.profiles;
create policy "Profils visibles par tous"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Créer son profil" on public.profiles;
create policy "Créer son profil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Modifier son profil" on public.profiles;
create policy "Modifier son profil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3) Policies pour Supabase Storage
--    On suppose que tu auras créé deux buckets PUBLICS dans Storage :
--      - "avatars"     (pour les photos de profil)
--      - "gear-photos" (pour les photos de matériel)
--
--    Comment créer les buckets : Supabase → Storage → "+ New bucket"
--      → Nom : avatars, coche "Public bucket", Save
--      → Nom : gear-photos, coche "Public bucket", Save
--
--    Une fois les buckets créés, ces policies permettent à tout utilisateur
--    connecté d'uploader / écraser / supprimer ses propres fichiers.
--    La convention : chaque fichier est dans un dossier nommé avec l'user.id,
--    donc le path commence par "<user_id>/...".

-- Lecture publique (les buckets sont déjà publics, mais on s'assure)
drop policy if exists "Lecture publique avatars"   on storage.objects;
drop policy if exists "Lecture publique gear"      on storage.objects;
drop policy if exists "Upload avatar perso"        on storage.objects;
drop policy if exists "Update avatar perso"        on storage.objects;
drop policy if exists "Delete avatar perso"        on storage.objects;
drop policy if exists "Upload gear perso"          on storage.objects;
drop policy if exists "Update gear perso"          on storage.objects;
drop policy if exists "Delete gear perso"          on storage.objects;

create policy "Lecture publique avatars"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "Lecture publique gear"
  on storage.objects for select
  to public
  using (bucket_id = 'gear-photos');

-- INSERT : on n'autorise que dans un dossier qui porte son propre user_id
create policy "Upload avatar perso"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Update avatar perso"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Delete avatar perso"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Upload gear perso"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gear-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Update gear perso"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'gear-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Delete gear perso"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gear-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) RPC : suppression complète de son propre compte
--    L'utilisateur appelle delete_my_account() depuis le client. La fonction
--    s'exécute en SECURITY DEFINER pour avoir le droit de toucher à
--    auth.users. La cascade sur profiles/gear/friendships nettoie le reste.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_my_account() to authenticated;

-- ============================================================
-- 5) ADMIN : rôle, policies de superviseur, RPC de suppression
-- ============================================================

-- Colonne is_admin (attribuée manuellement via update profiles).
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Helper : suis-je admin ?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- Admin sur profiles
drop policy if exists "Admin modifie tout profil" on public.profiles;
create policy "Admin modifie tout profil"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin supprime tout profil" on public.profiles;
create policy "Admin supprime tout profil"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- Admin sur gear
drop policy if exists "Admin voit tout gear" on public.gear;
create policy "Admin voit tout gear"
  on public.gear for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admin modifie tout gear" on public.gear;
create policy "Admin modifie tout gear"
  on public.gear for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin supprime tout gear" on public.gear;
create policy "Admin supprime tout gear"
  on public.gear for delete
  to authenticated
  using (public.is_admin());

-- RPC : suppression d'un compte par un admin
create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Permission refusée : admin requis.';
  end if;
  delete from auth.users where id = target_user_id;
end;
$$;
grant execute on function public.admin_delete_user(uuid) to authenticated;
