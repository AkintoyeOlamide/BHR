-- Permanent profiles schema alignment
-- Adds missing columns, backfills from auth.users, and hardens new-user trigger.

-- 1) Ensure expected profile columns exist
alter table public.profiles
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists department text,
  add column if not exists job_title text,
  add column if not exists manager_id uuid,
  add column if not exists created_at timestamptz default now();

-- 2) Ensure manager_id FK exists (safe if already present)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_manager_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_manager_id_fkey
      foreign key (manager_id) references public.profiles (id);
  end if;
end $$;

-- 3) Backfill existing profiles from auth.users
update public.profiles p
set
  email = coalesce(nullif(trim(p.email), ''), lower(u.email)),
  full_name = coalesce(
    nullif(trim(p.full_name), ''),
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(lower(u.email), '@', 1)
  ),
  role = coalesce(
    nullif(trim(p.role), ''),
    nullif(trim(lower(u.raw_user_meta_data->>'role')), ''),
    'employee'
  ),
  created_at = coalesce(p.created_at, u.created_at)
from auth.users u
where p.id = u.id;

-- 4) Insert missing profiles for existing auth users
insert into public.profiles (id, email, full_name, role, created_at)
select
  u.id,
  lower(u.email),
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(lower(u.email), '@', 1)
  ),
  coalesce(
    nullif(trim(lower(u.raw_user_meta_data->>'role')), ''),
    'employee'
  ),
  coalesce(u.created_at, now())
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- 5) Normalize required defaults
update public.profiles
set role = 'employee'
where role is null or trim(role) = '';

-- 6) Role constraint
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'hr_manager', 'employee', 'facility_manager'));

-- 7) Helpful indexes
create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_role on public.profiles (role);

-- 8) Harden handle_new_user trigger to always populate full profile columns
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'employee');
  safe_role text;
begin
  if requested_role in ('super_admin', 'hr_manager', 'employee', 'facility_manager') then
    safe_role := requested_role;
  else
    safe_role := 'employee';
  end if;

  insert into public.profiles (id, email, full_name, role, created_at)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(lower(new.email), '@', 1)
    ),
    safe_role,
    coalesce(new.created_at, now())
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
