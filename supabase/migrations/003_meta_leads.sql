-- Leads issus des formulaires instantanés Meta (Facebook / Instagram).
--
-- Un formulaire Meta ne collecte presque jamais les caractéristiques du
-- véhicule : les colonnes correspondantes deviennent facultatives. Les leads
-- du site continuent de les remplir, le tableau affiche « — » quand elles
-- manquent.

alter table public.leads
  alter column make drop not null,
  alter column model drop not null,
  alter column year drop not null,
  alter column mileage_km drop not null,
  alter column fuel drop not null,
  alter column gearbox drop not null,
  alter column condition drop not null,
  alter column phone drop not null,
  alter column postal_code drop not null,
  alter column last_name drop not null;

-- Identifiant du lead chez Meta : garantit qu'un même lead n'est pas inséré
-- deux fois, Meta pouvant renvoyer plusieurs fois le même événement.
alter table public.leads
  add column if not exists meta_lead_id text;

-- Index simple et non partiel : PostgreSQL traite les NULL comme distincts,
-- les demandes du site (sans identifiant Meta) cohabitent donc sans contrainte.
-- Un index partiel serait refusé comme cible d'un ON CONFLICT.
create unique index if not exists leads_meta_lead_id_key
  on public.leads (meta_lead_id);
