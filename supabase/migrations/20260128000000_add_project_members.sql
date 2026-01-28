create table if not exists project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (project_id, user_id)
);

-- RLS
alter table project_members enable row level security;

create policy "Users can view members of projects they have access to"
  on project_members for select
  using (
    exists (
      select 1 from projects
      where id = project_members.project_id
      -- Assuming projects are visible to all for MVP or check project policy copy logic
    )
  );

create policy "Users can insert members"
  on project_members for insert
  with check (true); 

create policy "Users can delete members"
  on project_members for delete
  using (true);
