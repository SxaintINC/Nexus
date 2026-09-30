create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  address text,
  phone text,
  email text,
  logo_url text,
  motto text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.schools is
  'One row per school account. Created by the onboarding wizard.';

alter table public.schools enable row level security;

-- Starter policy: only logged-in users can read. Anon gets nothing.
create policy "authenticated can read schools"
  on public.schools for select
  to authenticated
  using (true);

-- Demo row so the table is visible in the dashboard Table Editor.
insert into public.schools (name, short_name, address, phone, email, motto)
values (
  'Darlington Ajaezo',
  'DA',
  null,
  null,
  null,
  'Knowledge is Light'
);
