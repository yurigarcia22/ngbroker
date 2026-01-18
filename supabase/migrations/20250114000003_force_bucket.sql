
-- Force create bucket if not exists, or update public status
insert into storage.buckets (id, name, public)
values ('documents-files', 'documents-files', true)
on conflict (id) do update set public = true;

-- Ensure policies exist (best effort)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Authenticated users can upload document files'
  ) then
    create policy "Authenticated users can upload document files"
    on storage.objects for insert
    to authenticated
    with check ( bucket_id = 'documents-files' );
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Authenticated users can update document files'
  ) then
    create policy "Authenticated users can update document files"
    on storage.objects for update
    to authenticated
    using ( bucket_id = 'documents-files' );
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Authenticated users can view document files'
  ) then
    create policy "Authenticated users can view document files"
    on storage.objects for select
    to authenticated
    using ( bucket_id = 'documents-files' );
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Public access to document files'
  ) then
    create policy "Public access to document files"
    on storage.objects for select
    to public
    using ( bucket_id = 'documents-files' );
  end if;
end $$;
