-- Create tags table
create table public.tags (
  id uuid not null default gen_random_uuid (),
  name text not null,
  color text null,
  created_at timestamp with time zone not null default now(),
  constraint tags_pkey primary key (id),
  constraint tags_name_key unique (name)
);

-- Create task_tags junction table
create table public.task_tags (
  task_id uuid not null,
  tag_id uuid not null,
  constraint task_tags_pkey primary key (task_id, tag_id),
  constraint task_tags_task_id_fkey foreign key (task_id) references tasks (id) on delete cascade,
  constraint task_tags_tag_id_fkey foreign key (tag_id) references tags (id) on delete cascade
);

-- RLS Policies for tags (Open for all authenticated users for now)
alter table public.tags enable row level security;
create policy "Allow all operations for authenticated users on tags" on public.tags
  for all using (auth.role() = 'authenticated');

-- RLS Policies for task_tags
alter table public.task_tags enable row level security;
create policy "Allow all operations for authenticated users on task_tags" on public.task_tags
  for all using (auth.role() = 'authenticated');
