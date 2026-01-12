-- Enable necessary extensions
create extension if not exists moddatetime schema extensions;

-- Function to handle new user (idempotent)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Profiles Policies
drop policy if exists "Users can view their own profile" on profiles;
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

-- Clients Table
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  type text check (type in ('PF', 'PJ')),
  name text not null,
  segment text,
  ticket numeric,
  status text check (status in ('Ativo', 'Pausado', 'Inadimplente', 'Encerrado')) default 'Ativo',
  owner_user_id uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;

-- Clients Policies
drop policy if exists "Authenticated users can view clients" on clients;
create policy "Authenticated users can view clients" on clients for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert clients" on clients;
create policy "Authenticated users can insert clients" on clients for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update clients" on clients;
create policy "Authenticated users can update clients" on clients for update using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete clients" on clients;
create policy "Authenticated users can delete clients" on clients for delete using (auth.role() = 'authenticated');

-- Clients Triggers
drop trigger if exists handle_updated_at on clients;
create trigger handle_updated_at before update on clients for each row execute procedure moddatetime (updated_at);

-- Projects Table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  scope_type text check (scope_type in ('Treinamento','Tráfego','CRM','IA','Personalizado')) default 'Personalizado',
  scope_custom text,
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;
drop policy if exists "Auth users projects" on projects;
create policy "Auth users projects" on projects for all using (auth.role() = 'authenticated');

drop trigger if exists handle_updated_at_projects on projects;
create trigger handle_updated_at_projects before update on projects for each row execute procedure moddatetime (updated_at);

-- Project Statuses Table
create table if not exists public.project_statuses (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  sort_order int not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

alter table public.project_statuses enable row level security;
drop policy if exists "Auth users project_statuses" on project_statuses;
create policy "Auth users project_statuses" on project_statuses for all using (auth.role() = 'authenticated');

-- Function to seed statuses
create or replace function public.handle_new_project()
returns trigger as $$
begin
  insert into public.project_statuses (project_id, name, sort_order, is_default)
  values
    (new.id, 'Backlog', 1, true),
    (new.id, 'Em andamento', 2, false),
    (new.id, 'Em revisão', 3, false),
    (new.id, 'Concluído', 4, false);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_created on projects;
create trigger on_project_created after insert on projects for each row execute procedure public.handle_new_project();


-- Tasks Table
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  priority text check (priority in ('Baixa','Média','Alta','Urgente')) default 'Média',
  due_date date,
  status_id uuid references public.project_statuses(id),
  tags text[] default '{}',
  recurrence_rule text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;
drop policy if exists "Auth users tasks" on tasks;
create policy "Auth users tasks" on tasks for all using (auth.role() = 'authenticated');

drop trigger if exists handle_updated_at_tasks on tasks;
create trigger handle_updated_at_tasks before update on tasks for each row execute procedure moddatetime (updated_at);


-- Task Assignees Table
create table if not exists public.task_assignees (
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  primary key (task_id, user_id)
);

alter table public.task_assignees enable row level security;
drop policy if exists "Auth users task_assignees" on task_assignees;
create policy "Auth users task_assignees" on task_assignees for all using (auth.role() = 'authenticated');


-- Task Checklist Items
create table if not exists public.task_checklist_items (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  title text not null,
  is_done boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.task_checklist_items enable row level security;
drop policy if exists "Auth users task_checklist_items" on task_checklist_items;
create policy "Auth users task_checklist_items" on task_checklist_items for all using (auth.role() = 'authenticated');


-- Task Comments
create table if not exists public.task_comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  body text not null,
  created_at timestamptz default now()
);

alter table public.task_comments enable row level security;
drop policy if exists "Auth users task_comments" on task_comments;
create policy "Auth users task_comments" on task_comments for all using (auth.role() = 'authenticated');


-- Task Attachments
create table if not exists public.task_attachments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  file_path text not null,
  file_name text not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.task_attachments enable row level security;
drop policy if exists "Auth users task_attachments" on task_attachments;
create policy "Auth users task_attachments" on task_attachments for all using (auth.role() = 'authenticated');


-- Time Entries
create table if not exists public.time_entries (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  minutes int not null check (minutes > 0),
  entry_date date default current_date,
  notes text,
  created_at timestamptz default now()
);

alter table public.time_entries enable row level security;
drop policy if exists "Auth users time_entries" on time_entries;
create policy "Auth users time_entries" on time_entries for all using (auth.role() = 'authenticated');
