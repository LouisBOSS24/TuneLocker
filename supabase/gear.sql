-- ============================================================
--  TuneLocker — Table principale "gear" (matériel musical)
--  À exécuter APRÈS profiles.sql et friendships.sql
--  Script idempotent : peut être ré-exécuté sans danger.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Fonctions utilitaires partagées
-- ------------------------------------------------------------

-- Mise à jour automatique du champ updated_at (réutilisé par les triggers).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- "Suis-je ami avec cet utilisateur ?"
-- Utilisé dans la politique RLS de gear pour autoriser la lecture
-- d'un objet public uniquement aux amis du propriétaire.
create or replace function public.is_friend(other_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = auth.uid() and f.addressee_id = other_id)
        or (f.addressee_id = auth.uid() and f.requester_id = other_id)
      )
  );
$$;

-- ------------------------------------------------------------
-- 2) Table gear
-- ------------------------------------------------------------

create table if not exists public.gear (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  category        text not null,
  name            text not null,
  brand           text,
  model           text,
  year            int,
  country         text,
  color           text,
  weight_g        int,
  condition       text,
  purchase_date   date,
  purchase_price  numeric(10, 2),
  estimated_value numeric(10, 2),
  description     text,
  photo_urls      text[]      not null default '{}',
  is_public       boolean     not null default false,
  is_favorite     boolean     not null default false,
  is_wishlist     boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3) Contraintes sur les valeurs énumérées et numériques
-- ------------------------------------------------------------

alter table public.gear
  drop constraint if exists gear_category_check,
  add  constraint gear_category_check
    check (category in (
      'guitar','amp','pedal','synth','drum','microphone','accessory'
    ));

alter table public.gear
  drop constraint if exists gear_condition_check,
  add  constraint gear_condition_check
    check (condition is null or condition in (
      'new','like_new','very_good','good','fair','poor','for_parts'
    ));

alter table public.gear
  drop constraint if exists gear_year_check,
  add  constraint gear_year_check
    check (year is null or year between 1900 and 2100);

alter table public.gear
  drop constraint if exists gear_weight_check,
  add  constraint gear_weight_check
    check (weight_g is null or weight_g >= 0);

alter table public.gear
  drop constraint if exists gear_prices_check,
  add  constraint gear_prices_check
    check (
      (purchase_price is null or purchase_price >= 0)
      and (estimated_value is null or estimated_value >= 0)
    );

-- ------------------------------------------------------------
-- 4) Index utiles
-- ------------------------------------------------------------

create index if not exists gear_owner_idx        on public.gear (owner_id);
create index if not exists gear_category_idx     on public.gear (category);
create index if not exists gear_owner_public_idx on public.gear (owner_id) where is_public;
create index if not exists gear_created_idx      on public.gear (created_at desc);

-- ------------------------------------------------------------
-- 5) Trigger updated_at
-- ------------------------------------------------------------

drop trigger if exists gear_updated_at on public.gear;
create trigger gear_updated_at
  before update on public.gear
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 6) Row Level Security
--    SELECT  : moi (owner) OU (objet public ET ami du owner)
--    INSERT  : je crée uniquement en mon nom
--    UPDATE  : propriétaire seulement
--    DELETE  : propriétaire seulement
-- ------------------------------------------------------------

alter table public.gear enable row level security;

drop policy if exists "Voir le matériel" on public.gear;
create policy "Voir le matériel"
  on public.gear for select
  using (
    owner_id = auth.uid()
    or (is_public = true and public.is_friend(owner_id))
  );

drop policy if exists "Ajouter du matériel" on public.gear;
create policy "Ajouter du matériel"
  on public.gear for insert
  with check (owner_id = auth.uid());

drop policy if exists "Modifier mon matériel" on public.gear;
create policy "Modifier mon matériel"
  on public.gear for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Supprimer mon matériel" on public.gear;
create policy "Supprimer mon matériel"
  on public.gear for delete
  using (owner_id = auth.uid());
