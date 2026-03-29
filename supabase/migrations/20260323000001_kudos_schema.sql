-- =============================================================================
-- SAA 2025 — Kudos Schema
-- Thứ tự: (1) departments → (2) hashtags → (3) ALTER profiles → (4) kudos
--         → (5) kudos_likes → (6) secret_boxes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. departments
-- ---------------------------------------------------------------------------
create table public.departments (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. hashtags (reference list for dropdown — no FK junction with kudos)
-- ---------------------------------------------------------------------------
create table public.hashtags (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,  -- e.g. '#Dedicated'
  created_at timestamptz not null
    default now()
);

-- ---------------------------------------------------------------------------
-- 3. Extend profiles (departments must exist first for FK)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists department_id   uuid references public.departments (id) on delete set null,
  add column if not exists kudos_star_tier int check (kudos_star_tier in (1, 2, 3)),
  add column if not exists role            text not null default 'user'
    check (role in ('user', 'admin'));

comment on column public.profiles.department_id   is 'FK to departments; nullable.';
comment on column public.profiles.kudos_star_tier is '1=≥10 kudos, 2=≥20, 3=≥50; null if < 10.';
comment on column public.profiles.role            is 'user (default) | admin.';

-- ---------------------------------------------------------------------------
-- 4. kudos
-- ---------------------------------------------------------------------------
create table public.kudos (
  id            uuid        primary key default gen_random_uuid(),
  sender_id     uuid        not null references auth.users (id) on delete cascade,
  receiver_id   uuid        not null references auth.users (id) on delete cascade,
  message       text        not null check (char_length(message) between 1 and 1000),
  hashtags      text[]      not null default '{}',
  heart_count   int         not null default 0 check (heart_count >= 0),
  department_id uuid        references public.departments (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint kudos_no_self_send check (sender_id <> receiver_id)
);
-- department_id = phòng ban của receiver tại thời điểm gửi (denormalized)

-- ---------------------------------------------------------------------------
-- 5. kudos_likes
-- ---------------------------------------------------------------------------
create table public.kudos_likes (
  kudos_id   uuid        not null references public.kudos (id) on delete cascade,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (kudos_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 6. secret_boxes
-- ---------------------------------------------------------------------------
create table public.secret_boxes (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade,
  is_opened      boolean     not null default false,
  gift_title     text,
  gift_value     text,
  gift_image_url text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------

-- kudos
alter table public.kudos enable row level security;
create policy "kudos: read all (authenticated)"
  on public.kudos for select using (auth.uid() is not null);
create policy "kudos: insert own"
  on public.kudos for insert with check (auth.uid() = sender_id);

-- kudos_likes
alter table public.kudos_likes enable row level security;
create policy "kudos_likes: read all"
  on public.kudos_likes for select using (auth.uid() is not null);
create policy "kudos_likes: insert own"
  on public.kudos_likes for insert with check (auth.uid() = user_id);
create policy "kudos_likes: delete own"
  on public.kudos_likes for delete using (auth.uid() = user_id);

-- departments
alter table public.departments enable row level security;
create policy "departments: public read"
  on public.departments for select using (true);

-- hashtags
alter table public.hashtags enable row level security;
create policy "hashtags: public read"
  on public.hashtags for select using (true);

-- secret_boxes
alter table public.secret_boxes enable row level security;
create policy "secret_boxes: read own"
  on public.secret_boxes for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Trigger: Auto-update kudos_star_tier on profiles
-- ---------------------------------------------------------------------------
create or replace function public.update_kudos_star_tier()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  kudos_count int;
  new_tier    int;
begin
  select count(*) into kudos_count
  from public.kudos
  where receiver_id = NEW.receiver_id;

  new_tier := case
    when kudos_count >= 50 then 3
    when kudos_count >= 20 then 2
    when kudos_count >= 10 then 1
    else null
  end;

  update public.profiles
  set kudos_star_tier = new_tier
  where id = NEW.receiver_id;

  return NEW;
end;
$$;

create trigger kudos_update_star_tier
  after insert on public.kudos
  for each row execute function public.update_kudos_star_tier();

-- ---------------------------------------------------------------------------
-- Trigger: Sync kudos.heart_count via kudos_likes
-- ---------------------------------------------------------------------------
create or replace function public.sync_kudos_heart_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    update public.kudos set heart_count = heart_count + 1 where id = NEW.kudos_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.kudos set heart_count = greatest(0, heart_count - 1) where id = OLD.kudos_id;
    return OLD;
  end if;
  return null;
end;
$$;

create trigger kudos_likes_sync_heart_count
  after insert or delete on public.kudos_likes
  for each row execute function public.sync_kudos_heart_count();
