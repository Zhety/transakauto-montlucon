-- Notes d'appel et date de rappel.
--
-- 1. `leads.callback_at` : date de rappel convenue avec le vendeur. Elle
--    s'affiche sur la fiche du tableau et trie la colonne « À rappeler ».
-- 2. `lead_notes` : journal des appels, une ligne par note, horodatée et
--    signée par son auteur. Les notes ne se modifient ni ne se suppriment
--    depuis le tableau : c'est une trace.
--
-- À exécuter une fois dans Supabase → SQL Editor, après la migration 004.

alter table public.leads
  add column if not exists callback_at timestamptz;

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references public.members (id) on delete set null,
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

-- La fiche affiche les notes de la plus récente à la plus ancienne.
create index if not exists lead_notes_lead_id_created_at_idx
  on public.lead_notes (lead_id, created_at desc);

alter table public.lead_notes enable row level security;

create policy "membres lisent les notes"
  on public.lead_notes for select
  to authenticated
  using (public.is_member());

-- Une note est toujours signée par celui qui l'écrit.
create policy "membres ajoutent des notes"
  on public.lead_notes for insert
  to authenticated
  with check (public.is_member() and author_id = auth.uid());

-- Temps réel : une note ajoutée par un collègue apparaît sans rafraîchir.
alter publication supabase_realtime add table public.lead_notes;
