-- Enable Realtime for the 'documentos' table
-- This allows clients to listen to INSERT/UPDATE/DELETE events
alter publication supabase_realtime add table public.documentos;
