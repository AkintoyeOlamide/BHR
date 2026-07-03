-- Run this in Supabase: SQL Editor → New query → Run

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'employee'
    check (role in ('super_admin', 'hr_manager', 'employee')),
  department text,
  job_title text,
  manager_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.appraisal_cycles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'closed')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.appraisals (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.appraisal_cycles (id) on delete cascade,
  employee_id uuid not null references public.profiles (id) on delete cascade,
  reviewer_id uuid references public.profiles (id),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'submitted', 'completed')),
  job_title text,
  department text,
  review_period text,
  goals text,
  achievements text,
  strengths text,
  areas_for_improvement text,
  development_plan text,
  employee_self_review text,
  manager_comments text,
  overall_score numeric(4, 1),
  rating_label text,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cycle_id, employee_id)
);

create index if not exists idx_appraisals_cycle on public.appraisals (cycle_id);
create index if not exists idx_appraisals_employee on public.appraisals (employee_id);
create index if not exists idx_profiles_role on public.profiles (role);

alter table public.profiles enable row level security;
alter table public.appraisal_cycles enable row level security;
alter table public.appraisals enable row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "profiles read own or admin"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.current_user_role() in ('super_admin', 'hr_manager')
  );

create policy "profiles update own or admin"
  on public.profiles for update
  using (
    id = auth.uid()
    or public.current_user_role() = 'super_admin'
  );

create policy "cycles read admin hr"
  on public.appraisal_cycles for select
  using (public.current_user_role() in ('super_admin', 'hr_manager'));

create policy "cycles read active for employees"
  on public.appraisal_cycles for select
  using (status = 'active');

create policy "cycles manage admin hr"
  on public.appraisal_cycles for all
  using (public.current_user_role() in ('super_admin', 'hr_manager'));

create policy "appraisals read own"
  on public.appraisals for select
  using (employee_id = auth.uid());

create policy "appraisals read admin hr"
  on public.appraisals for select
  using (public.current_user_role() in ('super_admin', 'hr_manager'));

create policy "appraisals update own in progress"
  on public.appraisals for update
  using (
    employee_id = auth.uid()
    and status in ('not_started', 'in_progress')
  );

create policy "appraisals manage admin hr"
  on public.appraisals for all
  using (public.current_user_role() in ('super_admin', 'hr_manager'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_appraisal_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists appraisals_updated_at on public.appraisals;
create trigger appraisals_updated_at
  before update on public.appraisals
  for each row execute function public.set_appraisal_updated_at();
