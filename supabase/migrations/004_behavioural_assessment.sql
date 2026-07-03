-- Run in Supabase SQL Editor after 003_kpi_template.sql

alter table public.kpi_templates
  add column if not exists behavioural_section_weight numeric(5, 2) default 20,
  add column if not exists behavioural_items jsonb not null default '[]'::jsonb;

alter table public.appraisals
  add column if not exists behavioural_section_weight numeric(5, 2) default 20,
  add column if not exists behavioural_overall_rating numeric(6, 2),
  add column if not exists behavioural_section_actual numeric(6, 2);

create table if not exists public.appraisal_behavioural_items (
  id uuid primary key default gen_random_uuid(),
  appraisal_id uuid not null references public.appraisals (id) on delete cascade,
  sort_order int not null default 0,
  key_measurement text not null default '',
  weight numeric(6, 2) not null default 0,
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  comments text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_appraisal_behavioural_appraisal
  on public.appraisal_behavioural_items (appraisal_id);

alter table public.appraisal_behavioural_items enable row level security;

create policy "behavioural read own appraisal"
  on public.appraisal_behavioural_items for select
  using (
    exists (
      select 1 from public.appraisals a
      where a.id = appraisal_behavioural_items.appraisal_id
        and a.employee_id = auth.uid()
    )
  );

create policy "behavioural read admin hr"
  on public.appraisal_behavioural_items for select
  using (public.current_user_role() in ('super_admin', 'hr_manager'));

create policy "behavioural manage admin hr"
  on public.appraisal_behavioural_items for all
  using (public.current_user_role() in ('super_admin', 'hr_manager'));

create policy "behavioural update comments employee"
  on public.appraisal_behavioural_items for update
  using (
    exists (
      select 1 from public.appraisals a
      where a.id = appraisal_behavioural_items.appraisal_id
        and a.employee_id = auth.uid()
        and a.status in ('not_started', 'in_progress')
    )
  );
