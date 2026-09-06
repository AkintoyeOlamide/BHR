-- vops 4-digit password recovery codes (shared Supabase with BHR / VOPS).
-- Also available as VOPS/supabase/028_vops_recovery_otp.sql

create table if not exists public.vops_recovery_codes (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_vops_recovery_codes_expires
  on public.vops_recovery_codes (expires_at);

alter table public.vops_recovery_codes enable row level security;

revoke all on public.vops_recovery_codes from anon, authenticated;
grant all on public.vops_recovery_codes to service_role;

notify pgrst, 'reload schema';
