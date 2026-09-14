-- Separate staff self-rating from manager rating on KPI and behavioural rows.
-- Official scores use manager_rating when set, otherwise staff rating.

alter table public.appraisal_kpis
  add column if not exists manager_rating numeric(3, 1);

alter table public.appraisal_behavioural_items
  add column if not exists manager_rating numeric(3, 1);

comment on column public.appraisal_kpis.rating is 'Staff self-rating (1–5)';
comment on column public.appraisal_kpis.manager_rating is 'Manager rating (1–5); drives official score when set';
comment on column public.appraisal_behavioural_items.rating is 'Staff self-rating (1–5)';
comment on column public.appraisal_behavioural_items.manager_rating is 'Manager rating (1–5); drives official score when set';
