-- Tableau des leads — Transakauto Montluçon
-- À exécuter une fois dans Supabase → SQL Editor.

-- Statuts du kanban, dans l'ordre des colonnes.
create type lead_status as enum ('a_traiter', 'ne_repond_pas', 'non_rdv', 'oui_rdv');

-- L'équipe : toute personne à qui un lead peut être attribué. Quand la personne
-- ouvre le tableau, son `id` est celui de son compte auth (c'est ce que vérifie
-- `is_member()`) ; un commercial sans compte a un simple identifiant généré.
-- Rôles : un admin gère les utilisateurs, un commercial travaille les leads.
create type member_role as enum ('admin', 'commercial');

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  role member_role not null default 'commercial',
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  status lead_status not null default 'a_traiter',
  assigned_to uuid references public.members (id) on delete set null,
  -- Date de rappel convenue avec le vendeur (affichée sur la fiche, trie la
  -- colonne « À rappeler »).
  callback_at timestamptz,

  intent text not null check (intent in ('estimation', 'reprise')),

  -- Véhicule
  make text not null,
  model text not null,
  version text,
  year integer not null,
  first_registration text,
  mileage_km integer not null,
  fuel text not null,
  gearbox text not null,
  plate text,

  -- État et projet
  condition text not null,
  technical_inspection text,
  service_history boolean,
  first_hand boolean,
  damaged boolean,
  ownership text,
  expected_price_eur integer,
  timeframe text,

  -- Coordonnées
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  postal_code text not null,
  city text,
  message text,

  -- Origine (Google / Meta Ads)
  source text,
  utm jsonb
);

-- Le tableau trie par date décroissante à l'intérieur de chaque colonne.
create index if not exists leads_status_created_at_idx on public.leads (status, created_at desc);

alter table public.leads enable row level security;
alter table public.members enable row level security;

-- `security definer` : la fonction lit `members` en contournant RLS. Sans cela,
-- une politique sur `members` qui interroge `members` boucle à l'infini
-- (Postgres 42P17).
create or replace function public.is_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select exists (select 1 from public.members where id = auth.uid()) $$;

revoke execute on function public.is_member() from anon;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select exists (select 1 from public.members where id = auth.uid() and role = 'admin') $$;

revoke execute on function public.is_admin() from anon;

-- Les demandes arrivent par la route serveur, qui utilise la clé de service et
-- contourne donc RLS. Aucune écriture n'est ouverte au public.
create policy "membres lisent les leads"
  on public.leads for select
  to authenticated
  using (public.is_member());

create policy "membres modifient les leads"
  on public.leads for update
  to authenticated
  using (public.is_member())
  with check (public.is_member());

create policy "membres lisent les membres"
  on public.members for select
  to authenticated
  using (public.is_member());

-- Journal des appels : une ligne par note, horodatée et signée. Les notes ne
-- se modifient ni ne se suppriment depuis le tableau : c'est une trace.
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references public.members (id) on delete set null,
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists lead_notes_lead_id_created_at_idx
  on public.lead_notes (lead_id, created_at desc);

alter table public.lead_notes enable row level security;

create policy "membres lisent les notes"
  on public.lead_notes for select
  to authenticated
  using (public.is_member());

create policy "membres ajoutent des notes"
  on public.lead_notes for insert
  to authenticated
  with check (public.is_member() and author_id = auth.uid());

create policy "auteur ou admin supprime une note"
  on public.lead_notes for delete
  to authenticated
  using (public.is_member() and (author_id = auth.uid() or public.is_admin()));

-- Diffusion temps réel : un nouveau lead ou une note apparaît sans rafraîchir.
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.lead_notes;

-- Les commerciaux de l'agence, sans compte : ils n'apparaissent que dans
-- « Commercial en charge ».
insert into public.members (first_name, last_name, role)
values ('Gabriel', 'HADDAD', 'commercial'), ('Jordan', 'PAUCHARD', 'commercial'), ('Hugo', 'RENAUD', 'commercial');

-- Les utilisateurs se créent depuis le tableau (page Utilisateurs, réservée aux
-- admins) : la route serveur crée le compte et la ligne `members` avec la clé
-- de service. Pour amorcer le premier admin, après avoir créé son compte dans
-- Authentication → Users :
-- insert into public.members (id, first_name, last_name, role)
-- values ('<uuid du compte>', 'François', 'Gayon', 'admin');
