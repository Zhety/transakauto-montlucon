-- 008 — File d'attente des plaquettes PDF.
--
-- Une demande est déposée depuis l'onglet « Plaquette PDF » du tableau, puis
-- traitée par le service tournant sur le Mac de l'agence (scripts/plaquette-worker.mts),
-- qui fait rédiger le contenu par Claude Code et renvoie le PDF. Les lignes ne
-- sont lues et écrites que par le serveur (clé de service) : RLS activé, aucune
-- politique, le navigateur passe par /api/board/plaquette.

create table if not exists public.plaquettes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  requested_by  uuid references public.members (id) on delete set null,
  url           text not null,
  ref           text,
  title         text,
  status        text not null default 'en_attente'
                check (status in ('en_attente', 'en_cours', 'prete', 'erreur')),
  -- 'claude-code' quand le contenu a été rédigé, 'generique' sinon.
  agent         text,
  note          text,
  error         text,
  pdf_path      text,
  pdf_filename  text,
  started_at    timestamptz,
  finished_at   timestamptz
);

create index if not exists plaquettes_status_created_idx on public.plaquettes (status, created_at);

alter table public.plaquettes enable row level security;

-- Dernier signe de vie du service sur le Mac : le tableau affiche « agent
-- connecté » ou « hors ligne » d'après cette date.
create table if not exists public.plaquette_worker (
  id       text primary key,
  seen_at  timestamptz not null default now(),
  version  text
);

alter table public.plaquette_worker enable row level security;

-- Les PDF produits ; privés, servis par liens signés depuis le serveur.
insert into storage.buckets (id, name, public)
values ('plaquettes', 'plaquettes', false)
on conflict (id) do nothing;
