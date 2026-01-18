-- ⚠️ ATENÇÃO: Este script irá resetar os status de TODOS os projetos.
-- As tarefas existentes ficarão momentaneamente sem status (status_id = NULL)
-- e precisarão ser atualizadas manualmente ou via script adicional.

BEGIN;

-- 1. Remove a associação de status das tarefas existentes para permitir a exclusão
UPDATE public.tasks SET status_id = NULL;

-- 2. Remove todos os status existentes
DELETE FROM public.project_statuses;

-- 3. Insere os novos status padrão para CADA projeto existente
-- Status: Backlog
INSERT INTO public.project_statuses (project_id, name, sort_order, is_default)
SELECT id, 'Backlog', 10, false FROM public.projects;

-- Status: A Fazer
INSERT INTO public.project_statuses (project_id, name, sort_order, is_default)
SELECT id, 'A Fazer', 20, false FROM public.projects;

-- Status: Em Progresso
INSERT INTO public.project_statuses (project_id, name, sort_order, is_default)
SELECT id, 'Em Progresso', 30, false FROM public.projects;

-- Status: Em Revisão
INSERT INTO public.project_statuses (project_id, name, sort_order, is_default)
SELECT id, 'Em Revisão', 40, false FROM public.projects;

-- Status: Concluído
INSERT INTO public.project_statuses (project_id, name, sort_order, is_default)
SELECT id, 'Concluído', 100, true FROM public.projects;

COMMIT;

-- 4. (Opcional) Tentar recuperar status das tarefas se o nome bater (se não tiver sido deletado)
-- Como deletamos, perdemos a referência do ID antigo.
-- Todas as tarefas estarão "Sem Status" na UI e precisarão ser movidas.
