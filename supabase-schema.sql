-- Run this entire file in the Supabase SQL editor:
-- Dashboard → SQL Editor → New query → paste → Run

-- ── Daily Logs ─────────────────────────────────────────────────────────────────
create table if not exists daily_logs (
  user_id uuid references auth.users not null,
  date text not null,
  id text,
  morning_weight numeric,
  calorie_target_min integer not null default 1400,
  calorie_target_max integer not null default 1600,
  protein_target_min integer not null default 120,
  protein_target_max integer not null default 140,
  hydration_target_oz integer not null default 80,
  soreness_level integer not null default 0,
  fatigue_level integer not null default 0,
  period_flag boolean not null default false,
  restaurant_meal_flag boolean not null default false,
  notes text,
  primary key (user_id, date)
);
alter table daily_logs enable row level security;
create policy "daily_logs: users own their rows" on daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Draft Meals ────────────────────────────────────────────────────────────────
create table if not exists draft_meals (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  meal_type text not null,
  ingredient_list text not null default '',
  default_portions text,
  estimated_calories integer not null default 0,
  estimated_protein integer not null default 0,
  estimated_carbs integer not null default 0,
  estimated_fat integer not null default 0,
  tags text[] not null default '{}',
  notes text,
  favorite boolean not null default false,
  created_at text not null
);
alter table draft_meals enable row level security;
create policy "draft_meals: users own their rows" on draft_meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Logged Meals ───────────────────────────────────────────────────────────────
create table if not exists logged_meals (
  id text primary key,
  user_id uuid references auth.users not null,
  date text not null,
  time text not null,
  linked_draft_meal_id text,
  meal_name text not null,
  ingredient_text text not null default '',
  estimated_calories integer not null default 0,
  estimated_protein integer not null default 0,
  estimated_carbs integer not null default 0,
  estimated_fat integer not null default 0,
  notes text
);
alter table logged_meals enable row level security;
create policy "logged_meals: users own their rows" on logged_meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Activity Logs ──────────────────────────────────────────────────────────────
create table if not exists activity_logs (
  id text primary key,
  user_id uuid references auth.users not null,
  date text not null,
  activity_type text not null,
  minutes integer not null default 0,
  estimated_steps integer,
  estimated_calories_burned integer,
  intensity text,
  pr_flag boolean,
  pr_notes text,
  notes text
);
alter table activity_logs enable row level security;
create policy "activity_logs: users own their rows" on activity_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Hydration Logs ─────────────────────────────────────────────────────────────
create table if not exists hydration_logs (
  id text primary key,
  user_id uuid references auth.users not null,
  date text not null,
  time text not null,
  ounces numeric not null
);
alter table hydration_logs enable row level security;
create policy "hydration_logs: users own their rows" on hydration_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── User Settings ──────────────────────────────────────────────────────────────
create table if not exists user_settings (
  user_id uuid primary key references auth.users,
  name text,
  tdee integer,
  calorie_target_min integer not null default 1400,
  calorie_target_max integer not null default 1600,
  protein_target_min integer not null default 120,
  protein_target_max integer not null default 140,
  carb_target_g integer,
  fat_target_g integer,
  hydration_target_oz integer not null default 80,
  step_goal integer not null default 8000,
  weight_lbs numeric,
  height_inches numeric,
  current_bf_pct numeric,
  goal_bf_pct numeric,
  bf_measured_date text
);
alter table user_settings enable row level security;
create policy "user_settings: users own their rows" on user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
