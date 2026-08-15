-- Public staff onboarding progress (tracked by name + email, no auth login required).

create table if not exists public.onboarding_learners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  current_department_id text,
  current_lesson_id text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint onboarding_learners_email_unique unique (email)
);

create index if not exists onboarding_learners_last_seen_at_idx
  on public.onboarding_learners (last_seen_at desc);

create table if not exists public.onboarding_department_progress (
  learner_id uuid not null references public.onboarding_learners (id) on delete cascade,
  department_id text not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  completed_lesson_ids text[] not null default '{}',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (learner_id, department_id)
);

create index if not exists onboarding_department_progress_status_idx
  on public.onboarding_department_progress (status);

alter table public.onboarding_learners enable row level security;
alter table public.onboarding_department_progress enable row level security;

-- No public policies: API routes use the service-role admin client.
