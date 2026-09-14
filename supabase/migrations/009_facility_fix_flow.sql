-- Staff fix-without-login flow + awaiting_confirm status.
-- Run in Supabase SQL Editor.

alter table public.facility_reports
  drop constraint if exists facility_reports_status_check;

alter table public.facility_reports
  add constraint facility_reports_status_check
  check (status in ('reported', 'in_progress', 'awaiting_confirm', 'resolved', 'closed'));

alter table public.facility_reports
  add column if not exists fix_token text,
  add column if not exists fix_note text,
  add column if not exists fix_photo_urls text[] not null default '{}',
  add column if not exists fix_submitted_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by text;

create unique index if not exists idx_facility_reports_fix_token
  on public.facility_reports (fix_token)
  where fix_token is not null;
