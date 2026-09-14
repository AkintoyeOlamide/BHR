-- Facility maintenance reporting
-- Run in Supabase SQL Editor after previous migrations.

-- Allow facility_manager role on profiles
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'hr_manager', 'employee', 'facility_manager'));

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

create policy "facility_reports read facility and admin"
  on public.facility_reports for select
  using (
    public.current_user_role() in ('super_admin', 'facility_manager')
  );

create policy "facility_reports update facility and admin"
  on public.facility_reports for update
  using (
    public.current_user_role() in ('super_admin', 'facility_manager')
  );

-- Inserts go through service role (API); no public insert policy needed.

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

-- Storage bucket for report photos (public read for dashboard display)
insert into storage.buckets (id, name, public)
values ('facility-reports', 'facility-reports', true)
on conflict (id) do nothing;

create policy "facility report photos public read"
  on storage.objects for select
  using (bucket_id = 'facility-reports');

create policy "facility report photos service upload"
  on storage.objects for insert
  with check (bucket_id = 'facility-reports');
