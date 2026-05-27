-- Add pot_size column to plants table
alter table public.plants
  add column if not exists pot_size text;
