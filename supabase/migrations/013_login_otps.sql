-- One-time login codes for passwordless staff/manager/facility sign-in.
create table if not exists public.login_otps (
  email text primary key,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists login_otps_expires_at_idx
  on public.login_otps (expires_at);

alter table public.login_otps enable row level security;

-- No public policies: only service role / admin client should read/write.
