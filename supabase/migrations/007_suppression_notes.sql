-- Suppression d'une note d'appel depuis le tableau : son auteur, ou un administrateur.
-- Le tableau signale un bandeau rouge tant que cette migration n'est pas passée.
create policy "auteur ou admin supprime une note"
  on public.lead_notes for delete
  to authenticated
  using (public.is_member() and (author_id = auth.uid() or public.is_admin()));
