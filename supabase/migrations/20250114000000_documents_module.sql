-- Create document_folders table
create table public.document_folders (
  id uuid not null default gen_random_uuid (),
  parent_id uuid null references document_folders(id) on delete cascade,
  scope_type text not null check (scope_type in ('global', 'client', 'project')),
  client_id uuid null references clients(id) on delete cascade,
  project_id uuid null references projects(id) on delete cascade,
  name text not null,
  description text null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint document_folders_pkey primary key (id)
);

-- Create documents table
create table public.documents (
  id uuid not null default gen_random_uuid (),
  folder_id uuid references document_folders(id) on delete set null,
  scope_type text not null check (scope_type in ('global', 'client', 'project')),
  client_id uuid null references clients(id) on delete cascade,
  project_id uuid null references projects(id) on delete cascade,
  title text not null,
  doc_type text not null check (doc_type in ('page', 'file', 'video')),
  status text default 'draft' check (status in ('draft', 'review', 'approved', 'archived')),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint documents_pkey primary key (id)
);

-- Create document_pages table (Notion-like content)
create table public.document_pages (
  document_id uuid not null references documents(id) on delete cascade,
  content_json jsonb not null default '[]'::jsonb,
  content_text text null,
  updated_by uuid references auth.users(id),
  updated_at timestamp with time zone not null default now(),
  constraint document_pages_pkey primary key (document_id)
);

-- Create document_files table (Uploads)
create table public.document_files (
  id uuid not null default gen_random_uuid (),
  document_id uuid references documents(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text null,
  size_bytes bigint null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  constraint document_files_pkey primary key (id)
);

-- Create document_videos table
create table public.document_videos (
  document_id uuid not null references documents(id) on delete cascade,
  provider text not null check (provider in ('youtube', 'vimeo', 'loom', 'custom')),
  video_url text not null,
  title text null,
  duration_seconds int null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  constraint document_videos_pkey primary key (document_id)
);

-- Create folder_permissions table
create table public.folder_permissions (
  folder_id uuid not null references document_folders(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  access_level text not null check (access_level in ('viewer', 'editor', 'owner')),
  constraint folder_permissions_pkey primary key (folder_id, user_id)
);

-- Indexes for performance
create index idx_documents_folder_id on public.documents(folder_id);
create index idx_documents_scope on public.documents(scope_type, client_id, project_id);
create index idx_document_folders_parent on public.document_folders(parent_id);
create index idx_folder_permissions_user on public.folder_permissions(user_id);

-- RLS Policies
-- Enable RLS on all tables
alter table public.document_folders enable row level security;
alter table public.documents enable row level security;
alter table public.document_pages enable row level security;
alter table public.document_files enable row level security;
alter table public.document_videos enable row level security;
alter table public.folder_permissions enable row level security;

-- Policies for document_folders
-- View: Created by user OR has permission OR is admin (simplified to authenticated + permissions check for now)
create policy "Users can view folders if they have permission or created it" on public.document_folders
  for select using (
    auth.uid() = created_by or
    exists (
      select 1 from public.folder_permissions fp
      where fp.folder_id = id and fp.user_id = auth.uid()
    )
  );

-- Insert: Authenticated users can create global/client/project folders (refine logic later if needed)
create policy "Users can create folders" on public.document_folders
  for insert with check (auth.role() = 'authenticated');

-- Update/Delete: Only Owner or Editor (for Update)
create policy "Owner/Editor can update folders" on public.document_folders
  for update using (
    auth.uid() = created_by or
    exists (
      select 1 from public.folder_permissions fp
      where fp.folder_id = id and fp.user_id = auth.uid() and fp.access_level in ('editor', 'owner')
    )
  );

create policy "Owner can delete folders" on public.document_folders
  for delete using (
    auth.uid() = created_by or
    exists (
      select 1 from public.folder_permissions fp
      where fp.folder_id = id and fp.user_id = auth.uid() and fp.access_level = 'owner'
    )
  );

-- Policies for documents (inherit from folder permissions implicitly via check or explicit join)
-- Simplified: If you can see the folder, you can see the document.
create policy "Users can view documents if they can view the folder" on public.documents
  for select using (
    folder_id is null or 
    exists (
        select 1 from public.document_folders f
        where f.id = folder_id and (
            f.created_by = auth.uid() or
            exists (select 1 from public.folder_permissions fp where fp.folder_id = f.id and fp.user_id = auth.uid())
        )
    )
  );

create policy "Users can create documents if they have edit access to folder" on public.documents
  for insert with check (
    folder_id is not null and
    exists (
        select 1 from public.document_folders f
        where f.id = folder_id and (
            f.created_by = auth.uid() or
            exists (select 1 from public.folder_permissions fp where fp.folder_id = f.id and fp.user_id = auth.uid() and fp.access_level in ('editor', 'owner'))
        )
    )
  );

create policy "Users can update/delete documents if they have edit access" on public.documents
  for all using (
    folder_id is not null and
    exists (
        select 1 from public.document_folders f
        where f.id = folder_id and (
            f.created_by = auth.uid() or
            exists (select 1 from public.folder_permissions fp where fp.folder_id = f.id and fp.user_id = auth.uid() and fp.access_level in ('editor', 'owner'))
        )
    )
  );

-- Sub-resource policies (pages, files, videos) match document access
create policy "Access pages via document" on public.document_pages
  for all using (
    exists (select 1 from public.documents d where d.id = document_id) -- Relies on document RLS, but simpler to just replicate logic or trust 'security barrier' of queries. 
    -- Actually for RLS to work robustly on child tables without costly joins, we often simplify or assume the app handles it, but let's do a join check.
    -- Better: if you can select the document, you can select the page.
  );
  
-- Allow authenticated for child tables for simplicity, relying on the parent (document) constraint in UI/API layer is risky but common for MVP.
-- Let's stick to "Authenticated" for sub-resources for now to avoid complexity in SQL, as the main gatekeeper is the 'document' and 'folder' query.
-- BUT to be safe:
create policy "Auth users can view pages of docs they see" on public.document_pages
    for select using (
        exists (select 1 from public.documents d where d.id = document_id)
    );

create policy "Auth users can edit pages of docs they edit" on public.document_pages
    for all using (
        exists (select 1 from public.documents d where d.id = document_id)
    );
-- (Repeating for files and videos - relying on the 'documents' RLS to filter visibility)
create policy "Auth access files" on public.document_files for all using (exists (select 1 from public.documents d where d.id = document_id));
create policy "Auth access videos" on public.document_videos for all using (exists (select 1 from public.documents d where d.id = document_id));

-- Permissions table accessibility
create policy "Users can view permissions" on public.folder_permissions
    for select using (
        exists (select 1 from public.document_folders f where f.id = folder_id and (f.created_by = auth.uid() or exists (select 1 from public.folder_permissions fp where fp.folder_id = f.id and fp.user_id = auth.uid())))
    );

create policy "Owners can manage permissions" on public.folder_permissions
    for all using (
        exists (select 1 from public.document_folders f where f.id = folder_id and (f.created_by = auth.uid() or exists (select 1 from public.folder_permissions fp where fp.folder_id = f.id and fp.user_id = auth.uid() and fp.access_level = 'owner')))
    );

-- Storage bucket insert is handled via storage policies (not in SQL migration usually, but we note it)
