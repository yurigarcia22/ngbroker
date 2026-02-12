-- PARTE 1: O Banco de Dados (Supabase SQL)

-- 1. Create 'arquivos' Bucket for Image Uploads
insert into storage.buckets (id, name, public) 
values ('arquivos', 'arquivos', true)
on conflict (id) do nothing;

-- Storage Policies (Simple: Auth users can upload, Public can read)
create policy "Public Read Arquivos"
on storage.objects for select
to public
using ( bucket_id = 'arquivos' );

create policy "Auth Insert Arquivos"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'arquivos' );

-- 2. Update/Unified 'documentos' Table
-- Ensure the table exists and has the necessary columns for hierarchy
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  titulo text,
  conteudo jsonb
);

-- Add Columns for Hierarchy and Features
alter table public.documentos 
add column if not exists parent_id uuid references public.documentos(id) on delete cascade,
add column if not exists icone text,
add column if not exists tipo text default 'pagina', -- 'pasta', 'pagina'
add column if not exists anexo_url text,
add column if not exists user_id uuid references auth.users(id);

-- Indexes for performance
create index if not exists idx_documentos_parent_id on public.documentos(parent_id);
create index if not exists idx_documentos_user_id on public.documentos(user_id);

-- 3. RLS Policies
alter table public.documentos enable row level security;

-- Simple Policy: Allow all operations for authenticated users (as requested)
create policy "Allow All for Authenticated"
on public.documentos
for all
to authenticated
using (true)
with check (true);
