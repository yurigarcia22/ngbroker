-- Enable RLS (just in case)
alter table profiles enable row level security;

-- Drop existing select policy if it exists (to start fresh or update)
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Profiles are viewable by users" on profiles;
drop policy if exists "Authenticated users can view profiles" on profiles;

-- Create policy to allow authenticated users to view all profiles
create policy "Authenticated users can view profiles"
on profiles for select
to authenticated
using (true);

-- Ensure update for own profile is allowed (for settings)
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
on profiles for update
to authenticated
using (auth.uid() = id);
