-- Run after schema.sql in Supabase SQL Editor

alter table public.appraisals
  add column if not exists appraiser_name text,
  add column if not exists time_in_present_position text,
  add column if not exists kpi_section_weight numeric(5, 2) default 80,
  add column if not exists kpi_overall_rating numeric(6, 2),
  add column if not exists kpi_section_actual numeric(6, 2);

create table if not exists public.appraisal_kpis (
  id uuid primary key default gen_random_uuid(),
  appraisal_id uuid not null references public.appraisals (id) on delete cascade,
  sort_order int not null default 0,
  task text not null default '',
  weight numeric(6, 2) not null default 0,
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  measurement_area text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_appraisal_kpis_appraisal
  on public.appraisal_kpis (appraisal_id);

alter table public.appraisal_kpis enable row level security;

create policy "kpis read own appraisal"
  on public.appraisal_kpis for select
  using (
    exists (
      select 1 from public.appraisals a
      where a.id = appraisal_kpis.appraisal_id
        and a.employee_id = auth.uid()
    )
  );

create policy "kpis read admin hr"
  on public.appraisal_kpis for select
  using (public.current_user_role() in ('super_admin', 'hr_manager'));

create policy "kpis manage admin hr"
  on public.appraisal_kpis for all
  using (public.current_user_role() in ('super_admin', 'hr_manager'));

create policy "kpis update measurement employee"
  on public.appraisal_kpis for update
  using (
    exists (
      select 1 from public.appraisals a
      where a.id = appraisal_kpis.appraisal_id
        and a.employee_id = auth.uid()
        and a.status in ('not_started', 'in_progress')
    )
  );
