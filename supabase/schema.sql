-- Tableau des leads — Transakauto Montluçon
-- À exécuter une fois dans Supabase → SQL Editor.

-- Statuts du kanban, dans l'ordre des colonnes.
create type lead_status as enum ('a_traiter', 'ne_repond_pas', 'non_rdv', 'oui_rdv');

-- Les commerciaux qui peuvent se voir attribuer un lead. Un membre est créé
-- pour chaque compte autorisé à ouvrir le tableau.
create table if not exists public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  status lead_status not null default 'a_traiter',
  assigned_to uuid references public.members (id) on delete set null,

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

-- Diffusion temps réel : un nouveau lead apparaît sans rafraîchir la page.
alter publication supabase_realtime add table public.leads;

-- Après avoir créé les comptes dans Authentication → Users, les déclarer ici :
-- insert into public.members (id, first_name, last_name)
-- values ('<uuid du compte>', 'François', 'Gayon');
