create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  photo_url text,
  plan text not null default 'free',
  credits integer not null default 30,
  credits_remaining integer not null default 30,
  max_credits integer not null default 30,
  total_credits integer not null default 30,
  billing_period text not null default 'monthly',
  daily_credits_used integer not null default 0,
  daily_limit integer not null default 5,
  daily_prompts_used integer not null default 0,
  last_daily_reset_date text,
  last_daily_reset timestamptz,
  monthly_credits_used integer not null default 0,
  last_monthly_reset timestamptz,
  has_used_free_trial boolean not null default false,
  free_trial_used_at timestamptz,
  subscription_date timestamptz,
  subscription_id text,
  subscription_plan text,
  last_payment_date timestamptz,
  last_reset timestamptz,
  last_reset_date timestamptz,
  next_reset_date timestamptz,
  payment_amount numeric,
  payment_currency text,
  payment_id text,
  payment_status text,
  subscription_status text,
  cancelled_at timestamptz,
  package_id text,
  stripe_customer_id text,
  stripe_session_id text,
  stripe_subscription_id text,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Project',
  first_prompt text,
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  last_modified timestamptz not null default now()
);

create table if not exists public.campaign_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  direction text not null default 'outbound',
  provider text not null default 'brevo',
  recipient_email text not null,
  recipient_name text,
  sender_email text,
  subject text,
  body_text text,
  status text not null default 'queued',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  photo_url text,
  plan text not null default 'free',
  plan_started_at timestamptz,
  last_payment_date timestamptz,
  payment_id text,
  payment_amount numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_last_modified on public.projects(user_id, last_modified desc);
create index if not exists idx_campaign_emails_user_created on public.campaign_emails(user_id, created_at desc);
create index if not exists idx_campaign_emails_project_created on public.campaign_emails(project_id, created_at desc);

alter table public.user_credits enable row level security;
alter table public.projects enable row level security;
alter table public.profiles enable row level security;
alter table public.campaign_emails enable row level security;

drop policy if exists "users can read own credits" on public.user_credits;
create policy "users can read own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own credits" on public.user_credits;
create policy "users can insert own credits"
  on public.user_credits for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update own credits" on public.user_credits;
create policy "users can update own credits"
  on public.user_credits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can read own projects" on public.projects;
create policy "users can read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own projects" on public.projects;
create policy "users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update own projects" on public.projects;
create policy "users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own projects" on public.projects;
create policy "users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

drop policy if exists "users can read own campaign emails" on public.campaign_emails;
create policy "users can read own campaign emails"
  on public.campaign_emails for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own campaign emails" on public.campaign_emails;
create policy "users can insert own campaign emails"
  on public.campaign_emails for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update own campaign emails" on public.campaign_emails;
create policy "users can update own campaign emails"
  on public.campaign_emails for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
