-- Add contract dates to clients table
alter table public.clients 
add column if not exists contract_start date,
add column if not exists contract_end date;
