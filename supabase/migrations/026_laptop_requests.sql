-- Public laptop request form (/laptoprequest)
-- Run in Supabase SQL Editor after previous migrations.

create table if not exists public.laptop_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  department text not null,
  reason text not null,
  preferred_spec text not null,
  currently_has_laptop boolean not null,
  status text not null default 'requested'
    check (status in ('requested', 'in_review', 'approved', 'fulfilled', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_laptop_requests_created
  on public.laptop_requests (created_at desc);

create index if not exists idx_laptop_requests_email
  on public.laptop_requests (email);

create index if not exists idx_laptop_requests_status
  on public.laptop_requests (status);

alter table public.laptop_requests enable row level security;

create policy "laptop_requests read admin and hr"
  on public.laptop_requests for select
  using (
    public.current_user_role() in ('super_admin', 'hr_manager')
  );

create policy "laptop_requests update admin and hr"
  on public.laptop_requests for update
  using (
    public.current_user_role() in ('super_admin', 'hr_manager')
  );

-- Inserts go through service role (API); no public insert policy needed.

create or replace function public.set_laptop_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists laptop_requests_updated_at on public.laptop_requests;
create trigger laptop_requests_updated_at
  before update on public.laptop_requests
  for each row execute function public.set_laptop_request_updated_at();
