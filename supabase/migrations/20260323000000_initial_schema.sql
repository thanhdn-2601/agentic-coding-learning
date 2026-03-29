-- =============================================================================
-- SAA 2025 (Sun Annual Awards 2025) — Initial Schema
-- =============================================================================
-- App: Sun Annual Awards 2025 · Theme: ROOT FURTHER
-- Auth: Google OAuth via Supabase Auth
-- Languages: Vietnamese (vi) · English (en)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. profiles
--    One-to-one extension of auth.users.
--    Created automatically via trigger on first sign-in.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text unique not null,
  full_name    text not null default '',
  avatar_url   text,
  locale       text not null default 'vi' check (locale in ('vi', 'en')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table  public.profiles is 'User profiles, extended from auth.users.';
comment on column public.profiles.locale is 'Preferred UI language: vi = Vietnamese, en = English.';

-- ---------------------------------------------------------------------------
-- 2. award_categories
--    Each category represents one award (e.g., "Best Contributor").
-- ---------------------------------------------------------------------------
create table public.award_categories (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name_vi          text not null,
  name_en          text not null,
  description_vi   text,
  description_en   text,
  cover_image_url  text,
  icon_url         text,
  display_order    int not null default 0,
  voting_start_at  timestamptz,
  voting_end_at    timestamptz,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint voting_window_check check (
    voting_start_at is null
    or voting_end_at is null
    or voting_start_at < voting_end_at
  )
);

comment on table  public.award_categories is 'Award categories for SAA 2025.';
comment on column public.award_categories.slug is 'URL-friendly identifier, e.g. "best-contributor".';
comment on column public.award_categories.voting_start_at is 'NULL means voting is not time-gated.';

-- ---------------------------------------------------------------------------
-- 3. nominees
--    Employees nominated within a specific award category.
-- ---------------------------------------------------------------------------
create table public.nominees (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references public.award_categories (id) on delete cascade,
  name           text not null,
  email          text,
  department     text,
  position       text,
  bio_vi         text,
  bio_en         text,
  photo_url      text,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table  public.nominees is 'Nominees per award category.';
comment on column public.nominees.email is 'Company email of the nominee (nullable for privacy).';

create index nominees_category_id_idx on public.nominees (category_id);
create index nominees_display_order_idx on public.nominees (category_id, display_order);

-- ---------------------------------------------------------------------------
-- 4. votes
--    One vote per user per category (enforced by unique constraint).
-- ---------------------------------------------------------------------------
create table public.votes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  nominee_id   uuid not null references public.nominees (id) on delete cascade,
  category_id  uuid not null references public.award_categories (id) on delete cascade,
  created_at   timestamptz not null default now(),

  -- A user can vote for exactly one nominee per category
  constraint votes_one_per_category unique (user_id, category_id)
);

comment on table  public.votes is 'User votes — one vote per user per award category.';
comment on column public.votes.category_id is 'Denormalized for efficient per-category vote counting.';

create index votes_user_id_idx      on public.votes (user_id);
create index votes_nominee_id_idx   on public.votes (nominee_id);
create index votes_category_id_idx  on public.votes (category_id);

-- ---------------------------------------------------------------------------
-- 5. event_config
--    Key–value store for global event settings (voting window, public results, etc.)
-- ---------------------------------------------------------------------------
create table public.event_config (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

comment on table public.event_config is 'Global key-value configuration for the SAA 2025 event.';

-- Default configuration rows
insert into public.event_config (key, value) values
  ('event_name',        'Sun Annual Awards 2025'),
  ('event_theme',       'ROOT FURTHER'),
  ('voting_open',       'false'),
  ('results_public',    'false');

-- ---------------------------------------------------------------------------
-- Triggers — auto-update updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger award_categories_set_updated_at
  before update on public.award_categories
  for each row execute function public.set_updated_at();

create trigger nominees_set_updated_at
  before update on public.nominees
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger — create profile on first Google sign-in
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------

-- profiles -------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- award_categories -----------------------------------------------------------
alter table public.award_categories enable row level security;

create policy "award_categories: public read"
  on public.award_categories for select
  using (is_active = true);

-- nominees -------------------------------------------------------------------
alter table public.nominees enable row level security;

create policy "nominees: public read"
  on public.nominees for select
  using (
    is_active = true
    and exists (
      select 1 from public.award_categories ac
      where ac.id = nominees.category_id and ac.is_active = true
    )
  );

-- votes ----------------------------------------------------------------------
alter table public.votes enable row level security;

create policy "votes: read own"
  on public.votes for select
  using (auth.uid() = user_id);

create policy "votes: insert own"
  on public.votes for insert
  with check (auth.uid() = user_id);

create policy "votes: delete own"
  on public.votes for delete
  using (auth.uid() = user_id);

-- event_config ---------------------------------------------------------------
alter table public.event_config enable row level security;

create policy "event_config: public read"
  on public.event_config for select
  using (true);
