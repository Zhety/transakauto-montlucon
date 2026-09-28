-- Nouvelle colonne du kanban : « À rappeler », entre « À traiter » et
-- « Ne répond pas ».
--
-- ALTER TYPE ... ADD VALUE ne s'exécute pas dans une transaction : lancer cette
-- instruction seule dans le SQL Editor.
alter type lead_status add value if not exists 'a_rappeler' after 'a_traiter';
