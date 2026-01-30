create table if not exists public.task_checklist_items (
    id uuid not null default gen_random_uuid(),
    task_id uuid not null references public.tasks(id) on delete cascade,
    content text not null,
    is_completed boolean not null default false,
    position integer not null default 0,
    created_at timestamp with time zone not null default now(),
    
    constraint task_checklist_items_pkey primary key (id)
);

-- RLS
alter table public.task_checklist_items enable row level security;

create policy "Users can view checklist items of tasks they can view"
    on public.task_checklist_items for select
    using ( exists ( select 1 from public.tasks where tasks.id = task_checklist_items.task_id ) );

create policy "Users can insert checklist items to tasks they can view"
    on public.task_checklist_items for insert
    with check ( exists ( select 1 from public.tasks where tasks.id = task_checklist_items.task_id ) );

create policy "Users can update checklist items of tasks they can view"
    on public.task_checklist_items for update
    using ( exists ( select 1 from public.tasks where tasks.id = task_checklist_items.task_id ) );

create policy "Users can delete checklist items of tasks they can view"
    on public.task_checklist_items for delete
    using ( exists ( select 1 from public.tasks where tasks.id = task_checklist_items.task_id ) );
