-- ============================================================
--  TuneLocker — Extension de "gear" pour les pédales d'effet
--  À exécuter APRÈS gear.sql
--  Script idempotent.
-- ============================================================

create table if not exists public.gear_pedal (
  gear_id        uuid primary key references public.gear (id) on delete cascade,
  effect_type    text,                                  -- overdrive | distortion | fuzz | delay | reverb | ...
  technology     text,                                  -- analog | digital | hybrid
  main_controls  text[] not null default '{}',          -- ex : ['drive','tone','level']
  bypass_type    text,                                  -- true_bypass | buffered | soft
  power          text,                                  -- ex : '9V DC center-negative', 'USB-C', '2x AA'
  connectivity   text[] not null default '{}',          -- ex : ['input','output','expression in']
  format         text                                   -- mini | standard | double | triple | rack | desktop | other
);

-- Contraintes sur les valeurs énumérées
alter table public.gear_pedal
  drop constraint if exists gear_pedal_effect_type_check,
  add  constraint gear_pedal_effect_type_check
    check (effect_type is null or effect_type in (
      'overdrive','distortion','fuzz','boost','compressor','eq',
      'delay','reverb','chorus','flanger','phaser','tremolo','vibrato',
      'octaver','pitch','harmonizer','wah','filter','noise_gate',
      'looper','tuner','utility','multi','other'
    ));

alter table public.gear_pedal
  drop constraint if exists gear_pedal_technology_check,
  add  constraint gear_pedal_technology_check
    check (technology is null or technology in ('analog','digital','hybrid'));

alter table public.gear_pedal
  drop constraint if exists gear_pedal_bypass_check,
  add  constraint gear_pedal_bypass_check
    check (bypass_type is null or bypass_type in ('true_bypass','buffered','soft'));

alter table public.gear_pedal
  drop constraint if exists gear_pedal_format_check,
  add  constraint gear_pedal_format_check
    check (format is null or format in (
      'mini','standard','double','triple','rack','desktop','other'
    ));

-- Index GIN sur les colonnes text[] pour filtrer rapidement
create index if not exists gear_pedal_controls_idx
  on public.gear_pedal using gin (main_controls);

create index if not exists gear_pedal_connectivity_idx
  on public.gear_pedal using gin (connectivity);

-- ------------------------------------------------------------
-- Row Level Security — déléguée à la table "gear"
-- ------------------------------------------------------------
alter table public.gear_pedal enable row level security;

drop policy if exists "Voir la pédale si le gear est visible" on public.gear_pedal;
create policy "Voir la pédale si le gear est visible"
  on public.gear_pedal for select
  using (
    exists (
      select 1 from public.gear g
      where g.id = gear_pedal.gear_id
    )
  );

drop policy if exists "Créer la fiche pédale de son gear" on public.gear_pedal;
create policy "Créer la fiche pédale de son gear"
  on public.gear_pedal for insert
  with check (
    exists (
      select 1 from public.gear g
      where g.id = gear_pedal.gear_id and g.owner_id = auth.uid()
    )
  );

drop policy if exists "Modifier la fiche pédale de son gear" on public.gear_pedal;
create policy "Modifier la fiche pédale de son gear"
  on public.gear_pedal for update
  using (
    exists (
      select 1 from public.gear g
      where g.id = gear_pedal.gear_id and g.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.gear g
      where g.id = gear_pedal.gear_id and g.owner_id = auth.uid()
    )
  );

drop policy if exists "Supprimer la fiche pédale de son gear" on public.gear_pedal;
create policy "Supprimer la fiche pédale de son gear"
  on public.gear_pedal for delete
  using (
    exists (
      select 1 from public.gear g
      where g.id = gear_pedal.gear_id and g.owner_id = auth.uid()
    )
  );
