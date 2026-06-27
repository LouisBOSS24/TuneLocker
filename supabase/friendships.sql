-- ============================================================
--  TuneLocker — Système d'amis
--  À exécuter dans Supabase : SQL Editor > New query > Run
-- ============================================================

-- 1) Table friendships
--    requester_id  : celui qui a envoyé la demande
--    addressee_id  : celui qui la reçoit
--    status        : 'pending' (en attente) ou 'accepted' (amis)
--    Le refus / l'annulation / la suppression = DELETE de la ligne.
create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users (id) on delete cascade,
  addressee_id  uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending', 'accepted')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  -- Pas deux fois la même demande
  unique (requester_id, addressee_id),
  -- On ne peut pas s'ajouter soi-même
  check (requester_id <> addressee_id)
);

create index if not exists friendships_requester_idx on public.friendships (requester_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);

-- 2) Row Level Security
alter table public.friendships enable row level security;

-- SELECT : je vois uniquement les relations où je suis impliqué.
drop policy if exists "Voir mes relations" on public.friendships;
create policy "Voir mes relations"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- INSERT : je ne peux créer une demande qu'en tant que requester,
-- et seulement avec le statut 'pending'.
drop policy if exists "Envoyer une demande" on public.friendships;
create policy "Envoyer une demande"
  on public.friendships for insert
  with check (
    auth.uid() = requester_id
    and status = 'pending'
    and requester_id <> addressee_id
  );

-- UPDATE : seul l'addressee peut accepter une demande (pending -> accepted).
drop policy if exists "Accepter une demande" on public.friendships;
create policy "Accepter une demande"
  on public.friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

-- DELETE : les deux parties peuvent supprimer (annuler / refuser / retirer).
drop policy if exists "Supprimer une relation" on public.friendships;
create policy "Supprimer une relation"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- 3) Trigger pour mettre à jour updated_at automatiquement
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists friendships_updated_at on public.friendships;
create trigger friendships_updated_at
  before update on public.friendships
  for each row execute function public.touch_updated_at();
