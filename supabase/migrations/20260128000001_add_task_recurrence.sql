alter table tasks 
add column if not exists is_recurring boolean default false;
