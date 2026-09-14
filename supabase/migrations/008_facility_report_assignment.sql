-- Assign facility reports to a team member (email notified with note).
-- Run in Supabase SQL Editor.

alter table public.facility_reports
  add column if not exists assigned_to_name text,
  add column if not exists assigned_to_email text,
  add column if not exists assignment_note text,
  add column if not exists assigned_at timestamptz,
  add column if not exists assigned_by text;

create index if not exists idx_facility_reports_assignee
  on public.facility_reports (assigned_to_email);
