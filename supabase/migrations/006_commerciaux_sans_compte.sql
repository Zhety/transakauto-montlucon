-- Commerciaux sans compte.
--
-- Un membre n'a plus besoin d'un compte de connexion : la table `members` liste
-- toute l'équipe à qui un lead peut être attribué. Quand la personne ouvre le
-- tableau, son `id` est celui de son compte auth (c'est ce que vérifie
-- `is_member()`) ; sinon c'est un simple identifiant généré.
--
-- À exécuter une fois dans Supabase → SQL Editor, après la migration 005.

-- 1. La clé étrangère vers auth.users empêchait toute fiche sans compte.
--    Conséquence : supprimer un compte auth ne supprime plus sa fiche `members`
--    (la page Utilisateurs du tableau supprime les deux).
do $$
declare constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.members'::regclass and contype = 'f';
  if constraint_name is not null then
    execute format('alter table public.members drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.members alter column id set default gen_random_uuid();

-- 2. Les trois commerciaux de l'agence. Rejouable : déjà présents = ignorés.
insert into public.members (first_name, last_name, role)
select v.first_name, v.last_name, 'commercial'::member_role
from (values ('Gabriel', 'HADDAD'), ('Jordan', 'PAUCHARD'), ('Hugo', 'RENAUD')) as v(first_name, last_name)
where not exists (
  select 1 from public.members m
  where lower(m.first_name) = lower(v.first_name)
    and lower(coalesce(m.last_name, '')) = lower(v.last_name)
);
