-- Run in Supabase SQL Editor after 004_behavioural_assessment.sql

alter table public.kpi_templates
  add column if not exists goals text default '',
  add column if not exists strengths text default '',
  add column if not exists areas_for_improvement text default '',
  add column if not exists development_plan text default '';
