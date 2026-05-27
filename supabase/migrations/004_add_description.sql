-- Add description column to plants table
alter table public.plants
  add column if not exists description text;
