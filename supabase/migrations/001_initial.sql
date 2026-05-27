-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Plants table
create table if not exists public.plants (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  room text not null default 'Вітальня',
  conditions text not null default 'partial',
  watering_frequency_days integer not null default 7,
  fertilizing_frequency_days integer,
  next_repotting_date date,
  photo_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Watering logs table
create table if not exists public.watering_logs (
  id uuid default uuid_generate_v4() primary key,
  plant_id uuid references public.plants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  watered_at timestamptz default now() not null,
  with_fertilizer boolean default false not null
);

-- Notes table
create table if not exists public.notes (
  id uuid default uuid_generate_v4() primary key,
  plant_id uuid references public.plants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text,
  photo_url text,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.plants enable row level security;
alter table public.watering_logs enable row level security;
alter table public.notes enable row level security;

-- Plants RLS policies
create policy "Users can view own plants"
  on public.plants for select
  using (auth.uid() = user_id);

create policy "Users can insert own plants"
  on public.plants for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plants"
  on public.plants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own plants"
  on public.plants for delete
  using (auth.uid() = user_id);

-- Watering logs RLS policies
create policy "Users can view own watering logs"
  on public.watering_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own watering logs"
  on public.watering_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own watering logs"
  on public.watering_logs for delete
  using (auth.uid() = user_id);

-- Notes RLS policies
create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Storage bucket for plant photos
insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "Authenticated users can upload plant photos"
  on storage.objects for insert
  with check (
    bucket_id = 'plant-photos'
    and auth.uid() is not null
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view plant photos"
  on storage.objects for select
  using (bucket_id = 'plant-photos');

create policy "Users can update own plant photos"
  on storage.objects for update
  using (
    bucket_id = 'plant-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own plant photos"
  on storage.objects for delete
  using (
    bucket_id = 'plant-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger plants_updated_at
  before update on public.plants
  for each row execute procedure public.handle_updated_at();
