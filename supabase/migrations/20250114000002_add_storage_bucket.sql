
-- Create storage bucket for document files
insert into storage.buckets (id, name, public)
values ('documents-files', 'documents-files', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Authenticated users can upload document files"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'documents-files' );

create policy "Authenticated users can update document files"
on storage.objects for update
to authenticated
using ( bucket_id = 'documents-files' );

create policy "Authenticated users can view document files"
on storage.objects for select
to authenticated
using ( bucket_id = 'documents-files' );

create policy "Public access to document files"
on storage.objects for select
to public
using ( bucket_id = 'documents-files' );
