-- Allow assigned reviewers (line managers) to read/update appraisals they own,
-- not only via the broad hr_manager role policies.

-- Appraisals: reviewer can read
drop policy if exists "appraisals read assigned reviewer" on public.appraisals;
create policy "appraisals read assigned reviewer"
  on public.appraisals for select
  using (reviewer_id = auth.uid());

-- Appraisals: reviewer can update while reviewing (submitted) or completing
drop policy if exists "appraisals update assigned reviewer" on public.appraisals;
create policy "appraisals update assigned reviewer"
  on public.appraisals for update
  using (
    reviewer_id = auth.uid()
    and status in ('submitted', 'in_progress', 'completed')
  );

-- KPIs: reviewer can read
drop policy if exists "kpis read assigned reviewer" on public.appraisal_kpis;
create policy "kpis read assigned reviewer"
  on public.appraisal_kpis for select
  using (
    exists (
      select 1 from public.appraisals a
      where a.id = appraisal_kpis.appraisal_id
        and a.reviewer_id = auth.uid()
    )
  );

-- KPIs: reviewer can update ratings on submitted appraisals
drop policy if exists "kpis update assigned reviewer" on public.appraisal_kpis;
create policy "kpis update assigned reviewer"
  on public.appraisal_kpis for update
  using (
    exists (
      select 1 from public.appraisals a
      where a.id = appraisal_kpis.appraisal_id
        and a.reviewer_id = auth.uid()
        and a.status in ('submitted', 'in_progress')
    )
  );

-- Behavioural: reviewer can read
drop policy if exists "behavioural read assigned reviewer"
  on public.appraisal_behavioural_items;
create policy "behavioural read assigned reviewer"
  on public.appraisal_behavioural_items for select
  using (
    exists (
      select 1 from public.appraisals a
      where a.id = appraisal_behavioural_items.appraisal_id
        and a.reviewer_id = auth.uid()
    )
  );

-- Behavioural: reviewer can update on submitted appraisals
drop policy if exists "behavioural update assigned reviewer"
  on public.appraisal_behavioural_items;
create policy "behavioural update assigned reviewer"
  on public.appraisal_behavioural_items for update
  using (
    exists (
      select 1 from public.appraisals a
      where a.id = appraisal_behavioural_items.appraisal_id
        and a.reviewer_id = auth.uid()
        and a.status in ('submitted', 'in_progress')
    )
  );
