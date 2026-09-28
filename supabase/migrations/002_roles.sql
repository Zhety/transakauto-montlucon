-- Rôles des utilisateurs du tableau (admin / commercial).
-- À exécuter sur une base créée avant l'ajout des rôles.

create type member_role as enum ('admin', 'commercial');

alter table public.members
  add column if not exists role member_role not null default 'commercial';

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select exists (select 1 from public.members where id = auth.uid() and role = 'admin') $$;

revoke execute on function public.is_admin() from anon;

-- Le compte existant devient administrateur.
update public.members set role = 'admin'
where id in (
  select id from auth.users
  where email in ('tskmontlucon@gmail.com')
);
