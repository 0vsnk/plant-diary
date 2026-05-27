-- Add repotting_notes column to plants table
alter table public.plants
  add column if not exists repotting_notes text;
