-- 0002: user profiles (auto-created from auth signups) + school ownership.

-- ── PROFILES ──────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  school text,
  role text,
  gender text,
  phone text,
  country text,
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth user, auto-created by the on_auth_user_created trigger from signup metadata.';

alter table public.profiles enable row level security;

-- A user can read/update only their own profile.
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Auto-create a profile whenever someone signs up, copying the metadata the
-- signup wizard collected (full_name, school, role, …).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, school, role, gender, phone, country)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'school', ''),
    coalesce(new.raw_user_meta_data ->> 'role', ''),
    coalesce(new.raw_user_meta_data ->> 'gender', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'country', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── SCHOOLS: ownership + the onboarding wizard's saved setup ─────────────────
alter table public.schools
  add column if not exists owner_id uuid references public.profiles (id) on delete cascade,
  add column if not exists setup jsonb,
  add column if not exists onboarding_done boolean not null default false;

-- Every authenticated user may create their school (one per owner is enforced
-- by a unique index below); reading/updating is limited to the owner.
create unique index if not exists schools_owner_unique
  on public.schools (owner_id)
  where owner_id is not null;

drop policy if exists "authenticated can read schools" on public.schools;
create policy "owner can read own school"
  on public.schools for select
  to authenticated
  using (owner_id = auth.uid());

create policy "owner can update own school"
  on public.schools for update
  to authenticated
  using (owner_id = auth.uid());

create policy "user can create own school"
  on public.schools for insert
  to authenticated
  with check (owner_id = auth.uid());
