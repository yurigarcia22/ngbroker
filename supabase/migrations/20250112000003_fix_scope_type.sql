-- Migration to update projects scope_type constraint
-- Frontend uses: Recorrente, Fechado, Horas, Outro
-- Previous constraint: Treinamento, Tráfego, CRM, IA, Personalizado

alter table public.projects drop constraint if exists projects_scope_type_check;

alter table public.projects add constraint projects_scope_type_check 
  check (scope_type in ('Recorrente', 'Fechado', 'Horas', 'Outro'));

-- Optionally update default if needed, though default was 'Personalizado' which is invalid now.
alter table public.projects alter column scope_type set default 'Outro';
