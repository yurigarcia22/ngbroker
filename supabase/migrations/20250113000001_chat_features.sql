-- Chat Features Migration

-- 1. Notifications Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'task_mention', 'task_assignment', etc
  entity_type text not null, -- 'comment', 'task', etc
  entity_id uuid not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on notifications;
create policy "Users can view their own notifications" on notifications for select using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on notifications;
create policy "Users can update their own notifications" on notifications for update using (auth.uid() = user_id);

-- 2. Comment Mentions Table
create table if not exists public.comment_mentions (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references public.task_comments(id) on delete cascade not null,
  mentioned_user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.comment_mentions enable row level security;

drop policy if exists "Authenticated users can view mentions" on comment_mentions;
create policy "Authenticated users can view mentions" on comment_mentions for select using (auth.role() = 'authenticated');

-- 3. Update Task Attachments to link to comments
alter table public.task_attachments add column if not exists comment_id uuid references public.task_comments(id) on delete cascade;

-- 4. Storage Bucket for Attachments (if not exists)
-- Note: Storage buckets are usually created via API or Dashboard, but we can try inserting if storage schema is available.
-- For safety, we will assume bucket exists or user creates it, but we can try to set up RLS for storage.objects if needed.
-- We'll skip bucket creation in SQL to avoid permissions issues, but ensure policies allow access.
