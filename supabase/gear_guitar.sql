-- ============================================================
--  TuneLocker — Extension de "gear" pour les guitares (et basses)
--  À exécuter APRÈS gear.sql
--  Script idempotent.
-- ============================================================

create table if not exists public.gear_guitar (
  gear_id            uuid primary key references public.gear (id) on delete cascade,
  guitar_type        text,             -- electric | electro_acoustic | acoustic | classical | bass | semi_hollow | hollow | resonator | other
  guitar_shape       text,             -- stratocaster | lesPaul | SG | etc
  num_strings        smallint,
  num_frets          smallint,
  body_wood          text,
  neck_wood          text,
  fretboard_wood     text,
  pickup_config      text,             -- SSS | HH | HSS | HSH | SS | H | S | P | J | PJ | none | custom
  pickup_models      text[] not null default '{}',
  pickup_active      boolean,
  bridge             text,
  scale_length_mm    int,
  construction_type  text              -- bolt_on | set_neck | neck_through | other
);

-- Contraintes sur les valeurs énumérées et numériques
alter table public.gear_guitar
  drop constraint if exists gear_guitar_type_check,
  add  constraint gear_guitar_type_check
    check (guitar_type is null or guitar_type in (
      'electric','electro_acoustic','acoustic','classical','bass',
      'semi_hollow','hollow','resonator','other'
    ));

alter table public.gear_guitar
  drop constraint if exists gear_guitar_strings_check,
  add  constraint gear_guitar_strings_check
    check (num_strings is null or num_strings between 1 and 12);

alter table public.gear_guitar
  drop constraint if exists gear_guitar_frets_check,
  add  constraint gear_guitar_frets_check
    check (num_frets is null or num_frets between 0 and 36);

alter table public.gear_guitar
  drop constraint if exists gear_guitar_pickup_config_check,
  add  constraint gear_guitar_pickup_config_check
    check (pickup_config is null or pickup_config in (
      'SSS','HH','HSS','HSH','SS','H','S','P','J','PJ','none','custom'
    ));

alter table public.gear_guitar
  drop constraint if exists gear_guitar_construction_check,
  add  constraint gear_guitar_construction_check
    check (construction_type is null or construction_type in (
      'bolt_on','set_neck','neck_through','other'
    ));

alter table public.gear_guitar
  drop constraint if exists gear_guitar_scale_check,
  add  constraint gear_guitar_scale_check
    check (scale_length_mm is null or scale_length_mm between 300 and 1000);

-- Index GIN sur les modèles de micros pour filtrer plus tard
-- (ex : "toutes les guitares avec un Seymour Duncan").
create index if not exists gear_guitar_pickups_idx
  on public.gear_guitar using gin (pickup_models);

-- ------------------------------------------------------------
-- Row Level Security — déléguée à la table "gear"
-- ------------------------------------------------------------
alter table public.gear_guitar enable row level security;

drop policy if exists "Voir la guitare si le gear est visible" on public.gear_guitar;
create policy "Voir la guitare si le gear est visible"
  on public.gear_guitar for select
  using (
    exists (
      select 1 from public.gear g
      where g.id = gear_guitar.gear_id
    )
  );

drop policy if exists "Créer la fiche guitare de son gear" on public.gear_guitar;
create policy "Créer la fiche guitare de son gear"
  on public.gear_guitar for insert
  with check (
    exists (
      select 1 from public.gear g
      where g.id = gear_guitar.gear_id and g.owner_id = auth.uid()
    )
  );

drop policy if exists "Modifier la fiche guitare de son gear" on public.gear_guitar;
create policy "Modifier la fiche guitare de son gear"
  on public.gear_guitar for update
  using (
    exists (
      select 1 from public.gear g
      where g.id = gear_guitar.gear_id and g.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.gear g
      where g.id = gear_guitar.gear_id and g.owner_id = auth.uid()
    )
  );

drop policy if exists "Supprimer la fiche guitare de son gear" on public.gear_guitar;
create policy "Supprimer la fiche guitare de son gear"
  on public.gear_guitar for delete
  using (
    exists (
      select 1 from public.gear g
      where g.id = gear_guitar.gear_id and g.owner_id = auth.uid()
    )
  );
