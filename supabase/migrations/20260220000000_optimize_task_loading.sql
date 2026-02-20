-- Migration para Otimização de Carregamento de Tarefas
-- Resolve problemas de lentidão na dashboard listando todas as tarefas de todos os projetos

-- 1. Cria a extensão pg_trgm (se não existir) para buscas eficientes de texto (LIKE/ILIKE)
create extension if not exists pg_trgm;

-- 2. Índices GIN otimizados para texto (Status, Título, Descrição)
create index if not exists project_statuses_name_trgm_idx on project_statuses using gin (name gin_trgm_ops);
create index if not exists tasks_title_trgm_idx on tasks using gin (title gin_trgm_ops);
create index if not exists tasks_description_trgm_idx on tasks using gin (description gin_trgm_ops);

-- 3. Índices em Chaves Estrangeiras (B-Tree Normal) - Usados em JOINs Constantes
create index if not exists tasks_project_id_idx on tasks (project_id);
create index if not exists tasks_status_id_idx on tasks (status_id);
create index if not exists project_statuses_project_id_idx on project_statuses (project_id);
create index if not exists projects_client_id_idx on projects (client_id);

-- Índices em Tabelas Associativas
create index if not exists task_assignees_task_id_idx on task_assignees (task_id);
create index if not exists task_assignees_user_id_idx on task_assignees (user_id);
create index if not exists task_tags_task_id_idx on task_tags (task_id);
create index if not exists task_tags_tag_id_idx on task_tags (tag_id);

-- 4. Índice Composto de Ordenação Específica do NGBroker
-- A query `getAllTasks` usa `.order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })`
create index if not exists tasks_dashboard_sort_idx on tasks (due_date ASC NULLS LAST, created_at DESC);
