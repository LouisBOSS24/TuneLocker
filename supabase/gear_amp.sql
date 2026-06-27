-- ============================================================
--  TuneLocker — Extension de "gear" pour les amplis
--  À exécuter APRÈS gear.sql (la FK pointe vers gear.id).
--  Script idempotent : peut être ré-exécuté sans danger.
-- ============================================================

-- 1) Table : 1 ligne <-> 1 ligne dans gear (PK = FK).
--    Tous les champs sont optionnels (NULL autorisé) sauf les tableaux,
--    qui démarrent vides ('{}') pour éviter de gérer null côté JS.
create table if not exists public.gear_amp (
  gear_id            uuid primary key references public.gear (id) on delete cascade,
  amp_type           text,         -- combo | head | cabinet | stack | modeling
  technology         text,         -- tube | solid_state | hybrid | digital
  wattage            int,          -- en watts
  num_channels       smallint,     -- 1, 2, 3, ...
  speakers           text[] not null default '{}',  -- ex: ['1x12" Celestion V30']
  builtin_effects    text[] not null default '{}',  -- ex: ['reverb','delay']
  main_controls      text[] not null default '{}',  -- ex: ['gain','volume','bass','mid','treble']
  main_connectivity  text[] not null default '{}'   -- ex: ['input','fx loop','headphones']
);

-- 2) Contraintes de validation sur les valeurs énumérées.
--    On utilise des CHECK plutôt que des ENUM Postgres : c'est plus
--    facile à modifier (ajouter une valeur autorisée plus tard).

alter table public.gear_amp
  drop constraint if exists gear_amp_amp_type_check,
  add  constraint gear_amp_amp_type_check
    check (
      amp_type is null
      or amp_type in ('combo','head','cabinet','stack','modeling')
    );

alter table public.gear_amp
  drop constraint if exists gear_amp_technology_check,
  add  constraint gear_amp_technology_check
    check (
      technology is null
      or technology in ('tube','solid_state','hybrid','digital')
    );

alter table public.gear_amp
  drop constraint if exists gear_amp_wattage_check,
  add  constraint gear_amp_wattage_check
    check (wattage is null or wattage > 0);

alter table public.gear_amp
  drop constraint if exists gear_amp_num_channels_check,
  add  constraint gear_amp_num_channels_check
    check (num_channels is null or num_channels between 1 and 32);

-- 3) Index GIN sur les colonnes text[] pour pouvoir filtrer rapidement
--    plus tard (ex : "tous les amplis avec reverb intégrée").
--    Pas indispensable au début, mais c'est le bon moment pour les poser.
create index if not exists gear_amp_effects_idx
  on public.gear_amp using gin (builtin_effects);

create index if not exists gear_amp_controls_idx
  on public.gear_amp using gin (main_controls);

create index if not exists gear_amp_connectivity_idx
  on public.gear_amp using gin (main_connectivity);

-- 4) Row Level Security
--    Politique : on délègue les droits à la table "gear" parente.
--    Si l'utilisateur a le droit de voir/modifier la ligne gear,
--    il a le même droit sur la ligne gear_amp correspondante.
alter table public.gear_amp enable row level security;

-- SELECT : visible si le gear parent est visible (RLS de gear gère le reste).
drop policy if exists "Voir l'ampli si le gear est visible" on public.gear_amp;
create policy "Voir l'ampli si le gear est visible"
  on public.gear_amp for select
  using (
    exists (
      select 1
      from public.gear g
      where g.id = gear_amp.gear_id
    )
  );

-- INSERT : seul le propriétaire du gear peut ajouter sa fiche ampli.
drop policy if exists "Créer la fiche ampli de son gear" on public.gear_amp;
create policy "Créer la fiche ampli de son gear"
  on public.gear_amp for insert
  with check (
    exists (
      select 1
      from public.gear g
      where g.id = gear_amp.gear_id
        and g.owner_id = auth.uid()
    )
  );

-- UPDATE : idem, propriétaire uniquement.
drop policy if exists "Modifier la fiche ampli de son gear" on public.gear_amp;
create policy "Modifier la fiche ampli de son gear"
  on public.gear_amp for update
  using (
    exists (
      select 1
      from public.gear g
      where g.id = gear_amp.gear_id
        and g.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.gear g
      where g.id = gear_amp.gear_id
        and g.owner_id = auth.uid()
    )
  );

-- DELETE : idem.
drop policy if exists "Supprimer la fiche ampli de son gear" on public.gear_amp;
create policy "Supprimer la fiche ampli de son gear"
  on public.gear_amp for delete
  using (
    exists (
      select 1
      from public.gear g
      where g.id = gear_amp.gear_id
        and g.owner_id = auth.uid()
    )
  );
