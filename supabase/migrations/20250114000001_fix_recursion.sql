-- Fix Infinite Recursion in RLS

-- 1. Create a security definer function to check folder ownership
-- This bypasses RLS on document_folders to prevent the loop when folder_permissions checks parent folder
create or replace function public.is_folder_owner(_folder_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 
    from public.document_folders 
    where id = _folder_id 
    and created_by = auth.uid()
  );
end;
$$;

-- 2. Drop existing problematic policies
drop policy if exists "Users can view folders if they have permission or created it" on public.document_folders;
drop policy if exists "Users can view permissions" on public.folder_permissions;
drop policy if exists "Owners can manage permissions" on public.folder_permissions;

-- 3. Re-create document_folders policy (Standard)
create policy "Users can view folders if they have permission or created it" on public.document_folders
  for select using (
    auth.uid() = created_by or
    exists (
      select 1 from public.folder_permissions fp
      where fp.folder_id = id and fp.user_id = auth.uid()
    )
  );

-- 4. Re-create folder_permissions policies using the wrapper function
-- View: I can see my own permissions, OR I can see all permissions if I own the folder
create policy "Users can view permissions" on public.folder_permissions
    for select using (
        user_id = auth.uid() or
        public.is_folder_owner(folder_id)
    );

-- Manage: Only owners (via function) can insert/update/delete
create policy "Owners can manage permissions" on public.folder_permissions
    for all using (
        public.is_folder_owner(folder_id)
    );

-- 5. Fix Documents recursion as well just in case
-- Documents RLS relies on document_folders RLS.
-- Since document_folders is now safe (it checks folder_permissions table which has safe RLS), documents should be safe.
-- But let's verify documents RLS isn't doing anything weird. 
-- Previous policy: check folder_id in document_folders (RLS checked).
-- Safe.
