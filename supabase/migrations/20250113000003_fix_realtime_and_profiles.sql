-- 0. Ensure profiles has necessary columns
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists name text;

-- 1. Create Profile Sync Trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Backfill existing users (Safe insert)
insert into public.profiles (id, email, name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
where id not in (select id from public.profiles);

-- 3. Enable Realtime
-- Check if publication exists (standard supabase setup), otherwise create or alter
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime for table task_comments, notifications, tasks;
  else
    alter publication supabase_realtime add table task_comments, notifications, tasks;
  end if;
end
$$;
