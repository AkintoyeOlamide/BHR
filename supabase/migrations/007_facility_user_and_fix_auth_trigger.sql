-- Run this in Supabase → SQL Editor (after or instead of only 006).
-- Fixes: missing facility tables/role, broken new-user creation, facility login account.

-- 1) Allow facility_manager role
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'hr_manager', 'employee', 'facility_manager'));

-- 2) Recreate signup trigger (safe defaults; never put invalid roles in check)
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

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    safe_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Facility reports table + policies (idempotent)
create table if not exists public.facility_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_name text not null,
  reporter_email text not null,
  department text not null,
  location text not null,
  issue_title text not null,
  how_it_spoilt text not null,
  occurred_at timestamptz not null,
  priority text not null default 'medium'
    check (priority in ('critical', 'high', 'medium', 'low')),
  status text not null default 'reported'
    check (status in ('reported', 'in_progress', 'resolved', 'closed')),
  photo_urls text[] not null default '{}',
  facility_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_facility_reports_status
  on public.facility_reports (status);
create index if not exists idx_facility_reports_created
  on public.facility_reports (created_at desc);
create index if not exists idx_facility_reports_email
  on public.facility_reports (reporter_email);

alter table public.facility_reports enable row level security;

drop policy if exists "facility_reports read facility and admin" on public.facility_reports;
create policy "facility_reports read facility and admin"
  on public.facility_reports for select
  using (
    public.current_user_role() in ('super_admin', 'facility_manager')
  );

drop policy if exists "facility_reports update facility and admin" on public.facility_reports;
create policy "facility_reports update facility and admin"
  on public.facility_reports for update
  using (
    public.current_user_role() in ('super_admin', 'facility_manager')
  );

create or replace function public.set_facility_report_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists facility_reports_updated_at on public.facility_reports;
create trigger facility_reports_updated_at
  before update on public.facility_reports
  for each row execute function public.set_facility_report_updated_at();

insert into storage.buckets (id, name, public)
values ('facility-reports', 'facility-reports', true)
on conflict (id) do nothing;

drop policy if exists "facility report photos public read" on storage.objects;
create policy "facility report photos public read"
  on storage.objects for select
  using (bucket_id = 'facility-reports');

drop policy if exists "facility report photos service upload" on storage.objects;
create policy "facility report photos service upload"
  on storage.objects for insert
  with check (bucket_id = 'facility-reports');

-- 4) Create facility@bhr.com if missing (password: bhradmin)
do $$
declare
  new_id uuid := gen_random_uuid();
  existing_id uuid;
begin
  select id into existing_id from auth.users where email = 'facility@bhr.com';

  if existing_id is null then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      new_id,
      'authenticated',
      'authenticated',
      'facility@bhr.com',
      crypt('bhradmin', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Facility Manager","role":"facility_manager"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      new_id,
      jsonb_build_object('sub', new_id::text, 'email', 'facility@bhr.com'),
      'email',
      new_id::text,
      now(),
      now(),
      now()
    );

    insert into public.profiles (id, email, full_name, role, department, job_title)
    values (
      new_id,
      'facility@bhr.com',
      'Facility Manager',
      'facility_manager',
      'Admin',
      'Facility Manager'
    )
    on conflict (id) do update
      set role = 'facility_manager',
          full_name = excluded.full_name,
          department = excluded.department,
          job_title = excluded.job_title;
  else
    update public.profiles
    set role = 'facility_manager',
        full_name = coalesce(full_name, 'Facility Manager'),
        department = coalesce(department, 'Admin'),
        job_title = coalesce(job_title, 'Facility Manager')
    where id = existing_id;

    update auth.users
    set encrypted_password = crypt('bhradmin', gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
          || '{"full_name":"Facility Manager","role":"facility_manager"}'::jsonb
    where id = existing_id;
  end if;
end $$;
