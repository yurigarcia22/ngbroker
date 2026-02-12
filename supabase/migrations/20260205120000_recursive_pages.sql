-- Migration: Recursive Pages (Sub-pages)

-- Add parent_page_id to enable nesting pages inside pages
alter table public.documentos 
add column if not exists parent_page_id uuid references public.documentos(id) on delete cascade;

-- Index for performance
create index if not exists idx_documentos_parent_page_id on public.documentos(parent_page_id);
