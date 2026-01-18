-- Add new columns to clients table
alter table clients
add column if not exists cnpj text,
add column if not exists contract_url text;

-- Add comment for clarity
comment on column clients.cnpj is 'CNPJ (formatted or raw)';
comment on column clients.contract_url is 'URL to the contract PDF in storage';
