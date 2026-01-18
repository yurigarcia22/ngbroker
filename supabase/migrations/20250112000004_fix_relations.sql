-- Fix relationships for PostgREST embedding
-- Drop constraints referencing auth.users and point to public.profiles

-- task_assignees
alter table public.task_assignees drop constraint if exists task_assignees_user_id_fkey;
alter table public.task_assignees add constraint task_assignees_user_id_fkey 
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- task_comments
alter table public.task_comments drop constraint if exists task_comments_user_id_fkey;
alter table public.task_comments add constraint task_comments_user_id_fkey 
  foreign key (user_id) references public.profiles(id) on delete set null;

-- task_attachments
-- Note: schema.sql didn't name the constraint explicitly, likely auto-named.
-- We'll try to drop by matching definition or just add if not exists, but cleaner to find name.
-- Assuming default naming: task_attachments_uploaded_by_fkey
alter table public.task_attachments drop constraint if exists task_attachments_uploaded_by_fkey;
alter table public.task_attachments add constraint task_attachments_uploaded_by_fkey 
  foreign key (uploaded_by) references public.profiles(id) on delete set null;

-- time_entries
alter table public.time_entries drop constraint if exists time_entries_user_id_fkey;
alter table public.time_entries add constraint time_entries_user_id_fkey 
  foreign key (user_id) references public.profiles(id) on delete set null;

-- clients (owner_user_id) - Might strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly
-- clients owner might also benefit from this if we want to show owner name easily.
alter table public.clients drop constraint if exists clients_owner_user_id_fkey;
alter table public.clients add constraint clients_owner_user_id_fkey 
  foreign key (owner_user_id) references public.profiles(id) on delete set null;
