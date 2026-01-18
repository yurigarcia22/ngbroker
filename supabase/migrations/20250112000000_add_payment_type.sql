-- Add payment_type column to clients table
alter table public.clients 
add column if not exists payment_type text check (payment_type in ('Recorrente', 'Pontual')) default 'Recorrente';
