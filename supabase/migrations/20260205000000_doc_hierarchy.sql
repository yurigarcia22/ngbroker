-- Migration: Document Hierarchy and Attachments

-- 1. Spaces
create table if not exists public.doc_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text default '#808080',
  created_at timestamp with time zone default now()
);

-- RLS for Spaces
alter table public.doc_spaces enable row level security;
create policy "Public Spaces Access" on public.doc_spaces for all using (true); -- Simplify for now, or match project member logic

-- 2. Folders
create table if not exists public.doc_folders (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references public.doc_spaces(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default now()
);

-- RLS for Folders
alter table public.doc_folders enable row level security;
create policy "Public Folders Access" on public.doc_folders for all using (true);

-- 3. Update 'documentos'
alter table public.documentos 
add column if not exists folder_id uuid references public.doc_folders(id) on delete set null;

-- 4. Attachments
create table if not exists public.doc_attachments (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.documentos(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  file_type text,
  size_bytes bigint,
  created_at timestamp with time zone default now()
);

-- RLS for Attachments
alter table public.doc_attachments enable row level security;
create policy "Public Attachments Access" on public.doc_attachments for all using (true);

-- 5. Storage Bucket (Idempotent insert)
insert into storage.buckets (id, name, public)
values ('doc-attachments', 'doc-attachments', true)
on conflict (id) do nothing;

-- Storage Policy
create policy "Allow Public Uploads"
on storage.objects for insert
to public
with check ( bucket_id = 'doc-attachments' );

create policy "Allow Public Reads"
on storage.objects for select
to public
using ( bucket_id = 'doc-attachments' );
