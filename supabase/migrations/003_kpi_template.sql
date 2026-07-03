-- Run in Supabase SQL Editor after schema.sql

create table if not exists public.kpi_templates (
  id text primary key default 'default',
  appraisee_name text default '',
  appraiser_name text default '',
  department text default '',
  job_title text default '',
  review_period text default '',
  time_in_present_position text default '',
  kpi_section_weight numeric(5, 2) default 80,
  kpis jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.kpi_templates (id)
values ('default')
on conflict (id) do nothing;

alter table public.kpi_templates enable row level security;

create policy "kpi template read admin hr"
  on public.kpi_templates for select
  using (public.current_user_role() in ('super_admin', 'hr_manager'));

create policy "kpi template manage admin hr"
  on public.kpi_templates for all
  using (public.current_user_role() in ('super_admin', 'hr_manager'));
