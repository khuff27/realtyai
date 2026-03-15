-- Run this in your Supabase SQL Editor to set up the database

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  is_pro boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  -- Usage counters (reset monthly via cron)
  usage_listing integer default 0,
  usage_cma integer default 0,
  usage_openhouse integer default 0,
  usage_reset_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: users can only read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Monthly usage reset function (call via Supabase cron or external cron)
create or replace function reset_monthly_usage()
returns void as $$
begin
  update public.profiles
  set usage_listing = 0,
      usage_cma = 0,
      usage_openhouse = 0,
      usage_reset_at = now()
  where usage_reset_at < now() - interval '30 days';
end;
$$ language plpgsql security definer;
