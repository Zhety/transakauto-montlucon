-- 009 — Frais de mise à la route saisis avec la demande de plaquette.
-- Montant en euros, facultatif : ligne dédiée sur la plaquette, ajouté au prix total.
alter table public.plaquettes add column if not exists road_fees_eur integer;
