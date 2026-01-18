-- Project Templates
create table if not exists public.project_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  scope_type text,
  created_at timestamptz default now()
);

-- Template Tasks
create table if not exists public.template_tasks (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references public.project_templates(id) on delete cascade not null,
  title text not null,
  description text,
  priority text default 'Média',
  offset_days int default 0, -- Days from project start or execution time
  created_at timestamptz default now()
);

-- Template Checklist Items
create table if not exists public.template_checklist_items (
  id uuid default gen_random_uuid() primary key,
  template_task_id uuid references public.template_tasks(id) on delete cascade not null,
  title text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.project_templates enable row level security;
alter table public.template_tasks enable row level security;
alter table public.template_checklist_items enable row level security;

-- Policies (Open for authenticated users for now)
create policy "Auth users view templates" on project_templates for select using (auth.role() = 'authenticated');
create policy "Auth users manage templates" on project_templates for all using (auth.role() = 'authenticated');

create policy "Auth users view template tasks" on template_tasks for select using (auth.role() = 'authenticated');
create policy "Auth users manage template tasks" on template_tasks for all using (auth.role() = 'authenticated');

create policy "Auth users view template checklist" on template_checklist_items for select using (auth.role() = 'authenticated');
create policy "Auth users manage template checklist" on template_checklist_items for all using (auth.role() = 'authenticated');

-- Insert a Default Template (Onboarding)
insert into public.project_templates (name, description, scope_type)
values ('Onboarding de Cliente', 'Template padrão para início de contrato', 'Personalizado');

do $$
declare
  v_template_id uuid;
  v_task_id uuid;
begin
  select id into v_template_id from public.project_templates where name = 'Onboarding de Cliente' limit 1;

  -- Task 1: Setup Inicial
  insert into public.template_tasks (template_id, title, priority, offset_days)
  values (v_template_id, 'Setup Inicial e Acessos', 'Alta', 0)
  returning id into v_task_id;

  insert into public.template_checklist_items (template_task_id, title, sort_order)
  values (v_task_id, 'Criar grupo de WhatsApp', 1), (v_task_id, 'Solicitar acessos (Meta/Google)', 2);

  -- Task 2: Kickoff
  insert into public.template_tasks (template_id, title, priority, offset_days)
  values (v_template_id, 'Reunião de Kick-off', 'Alta', 2);

  -- Task 3: Estratégia
  insert into public.template_tasks (template_id, title, priority, offset_days)
  values (v_template_id, 'Definição de Estratégia', 'Média', 5);
end $$;
