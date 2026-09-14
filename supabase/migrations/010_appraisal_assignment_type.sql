-- Track whether assignment is technical, behavioural, or both.
alter table public.appraisals
  add column if not exists assessment_type text not null default 'both';

alter table public.appraisals
  drop constraint if exists appraisals_assessment_type_check;

alter table public.appraisals
  add constraint appraisals_assessment_type_check
  check (assessment_type in ('both', 'technical', 'behavioural'));
