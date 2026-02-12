-- Add GIN indexes for efficient text search on tasks
-- This requires the pg_trgm extension for trigram-based search using ILIKE or regex

create extension if not exists pg_trgm;

create index if not exists tasks_title_trgm_idx on tasks using gin (title gin_trgm_ops);
create index if not exists tasks_description_trgm_idx on tasks using gin (description gin_trgm_ops);

-- Also add index for common filter columns if they don't exist
create index if not exists tasks_project_id_idx on tasks (project_id);
create index if not exists tasks_status_id_idx on tasks (status_id);
create index if not exists tasks_due_date_idx on tasks (due_date);
