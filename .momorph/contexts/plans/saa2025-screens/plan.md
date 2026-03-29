# Development Plan: SAA 2025 — All Screens

**Stack**: Next.js 15.5.9 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase SSR · `next-intl` 4.8.3 · Cloudflare Workers (OpenNext)
**Specs**: `.momorph/contexts/specs/`
**Created**: 2026-03-23
**Status**: In Progress

---

## Current State Assessment

| Area | Status | Notes |
|---|---|---|
| Login Screen | ✅ Done | Implemented + tested |
| `src/middleware.ts` | ⚠️ Partial | Auth guard exists; missing pre-launch redirect |
| `src/app/auth/callback/` | ✅ Done | OAuth code exchange |
| `src/components/auth/` | ✅ Done | LoginButton, LanguageSelector, ErrorToast |
| `src/app/page.tsx` | ⚠️ Placeholder | "Dashboard — coming soon" |
| `next-intl` | ✅ Done | Cookie-based, vi/en |
| DB — `profiles` | ⚠️ Partial | Missing: `department_id`, `kudos_star_tier`, `role` |
| DB — `kudos` | ❌ Missing | Core Kudos table |
| DB — `kudos_likes` | ❌ Missing | Like tracking |
| DB — `secret_boxes` | ❌ Missing | Secret box gifts |
| DB — `departments` | ❌ Missing | Department reference table |
| DB — `hashtags` | ❌ Missing | Hashtag reference table |
| `lib/countdown.ts` | ❌ Missing | Shared countdown utility |
| `components/layout/Header.tsx` | ❌ Missing | Shared nav header |
| `components/layout/Footer.tsx` | ❌ Missing | Shared footer |
| `components/layout/WidgetButton.tsx` | ❌ Missing | Floating action button |
| Prelaunch page `/prelaunch` | ❌ Missing | Waiting room countdown |
| Homepage `/` | ❌ Missing | Main page |
| Awards page `/awards` | ❌ Missing | Awards information |
| Kudos Live Board `/kudos` | ❌ Missing | Kudos interactive board |

---

## Milestones Overview

```
M0 → Infrastructure (DB migration + Middleware update + Lib + Shared Components)
M1 → Prelaunch Page  (/prelaunch)
M2 → Homepage        (/)
M3 → Awards Page     (/awards)
M4 → Kudos Live Board (/kudos) — Phase A: Static + Feed
M5 → Kudos Live Board (/kudos) — Phase B: Interactive (like, send, spotlight, sidebar)
```

---

## Milestone 0 — Infrastructure

> **Goal**: DB schema bổ sung + middleware pre-launch + shared countdown util + shared layout components. Đây là prerequisite cho tất cả các màn hình còn lại.

---

### Task 0.1 — DB Migration: Extend `profiles` + New Tables

**File**: `supabase/migrations/20260323000001_kudos_schema.sql`

> **⚠️ Thứ tự SQL quan trọng**: `departments` và `hashtags` phải được CREATE trước khi ALTER `profiles` (FK dependency). Thứ tự trong file migration: (1) departments → (2) hashtags → (3) ALTER profiles → (4) kudos → (5) kudos_likes → (6) secret_boxes.

> **Hashtag strategy (text[])**: `kudos.hashtags` lưu dạng `text[]` (e.g. `['#Dedicated', '#TeamWork']`). Bảng `hashtags` dùng để liệt kê các hashtag có sẵn trong dropdown — không dùng FK junction table. Filter query: `WHERE '#Dedicated' = ANY(hashtags)`. API nhận `{ hashtags: string[] }` (không phải `hashtag_ids`).

#### 0.1a — New Reference Tables (tạo TRƯỚC)

```sql
-- departments ---------------------------------------------------------------
create table public.departments (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  created_at timestamptz not null default now()
);

-- hashtags (reference list for dropdown only — không dùng FK với kudos) ----
create table public.hashtags (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,  -- e.g. '#Dedicated'
  created_at timestamptz not null default now()
);
```

#### 0.1b — Alter `profiles` (sau khi departments đã tồn tại)

```sql
alter table public.profiles
  add column if not exists department_id   uuid references public.departments (id) on delete set null,
  add column if not exists kudos_star_tier int check (kudos_star_tier in (1, 2, 3)),
  add column if not exists role            text not null default 'user' check (role in ('user', 'admin'));

comment on column public.profiles.department_id   is 'FK to departments; nullable.';
comment on column public.profiles.kudos_star_tier is '1=≥10 kudos, 2=≥20, 3=≥50; null if < 10.';
comment on column public.profiles.role            is 'user (default) | admin.';
```

#### 0.1c — New Feature Tables

```sql
-- kudos ---------------------------------------------------------------------
create table public.kudos (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references auth.users (id) on delete cascade,
  receiver_id   uuid not null references auth.users (id) on delete cascade,
  message       text not null check (char_length(message) between 1 and 1000),
  hashtags      text[] not null default '{}',  -- stored as text[], filtered with ANY()
  heart_count   int not null default 0 check (heart_count >= 0),
  department_id uuid references public.departments (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint kudos_no_self_send check (sender_id <> receiver_id)
);
-- department_id = phòng ban của receiver tại thời điểm gửi (denormalized)

-- kudos_likes ---------------------------------------------------------------
create table public.kudos_likes (
  kudos_id   uuid not null references public.kudos (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (kudos_id, user_id)
);

-- secret_boxes --------------------------------------------------------------
create table public.secret_boxes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  is_opened       boolean not null default false,
  gift_title      text,          -- e.g. 'Voucher ăn trưa'
  gift_value      text,          -- e.g. '100.000 VNĐ'
  gift_image_url  text,          -- optional illustration
  created_at      timestamptz not null default now()
);
```

#### 0.1c — RLS Policies

```sql
-- kudos: authenticated users can read all; sender can insert; no update/delete by user
alter table public.kudos enable row level security;
create policy "kudos: read all (authenticated)"  on public.kudos for select using (auth.uid() is not null);
create policy "kudos: insert own"                on public.kudos for insert with check (auth.uid() = sender_id);

-- kudos_likes: user manages own likes
alter table public.kudos_likes enable row level security;
create policy "kudos_likes: read all"            on public.kudos_likes for select using (auth.uid() is not null);
create policy "kudos_likes: insert own"          on public.kudos_likes for insert with check (auth.uid() = user_id);
create policy "kudos_likes: delete own"          on public.kudos_likes for delete using (auth.uid() = user_id);

-- departments + hashtags: public read
alter table public.departments enable row level security;
create policy "departments: public read" on public.departments for select using (true);
alter table public.hashtags enable row level security;
create policy "hashtags: public read"   on public.hashtags for select using (true);

-- secret_boxes: user sees own only
alter table public.secret_boxes enable row level security;
create policy "secret_boxes: read own" on public.secret_boxes for select using (auth.uid() = user_id);
```

#### 0.1d — DB Trigger: Auto-update `kudos_star_tier`

```sql
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
```

#### 0.1e — DB Trigger: Sync `kudos.heart_count` via kudos_likes

```sql
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
```

**Verify**: `supabase db push` thành công; schema hiển thị đủ 5 bảng mới + columns trong profiles.

---

### Task 0.2 — Update TypeScript Types

**File**: `src/types/database.ts`

Bổ sung types cho `departments`, `hashtags`, `kudos`, `kudos_likes`, `secret_boxes` và update `profiles` type với `department_id`, `kudos_star_tier`, `role`.

**Verify**: `tsc --noEmit` không lỗi.

---

### Task 0.3 — Update `middleware.ts`: Pre-launch Redirect

**File**: `src/middleware.ts`

Thêm logic: sau khi xác nhận `isAuthenticated`:
1. Nếu user đang ở `/prelaunch` và `Date.now() >= EVENT_DATETIME` → redirect `/`.
2. Nếu user đang ở `/login` và authenticated → redirect `/prelaunch` (nếu pre-launch) hoặc `/` (nếu event started).

```typescript
// Thêm sau kiểm tra isAuthenticated && pathname === '/login'
const eventDatetime = process.env.NEXT_PUBLIC_EVENT_DATETIME;
const isPrelaunch = eventDatetime
  ? Date.now() < new Date(eventDatetime).getTime()
  : false;

if (isAuthenticated && pathname === '/login') {
  return NextResponse.redirect(new URL(isPrelaunch ? '/prelaunch' : '/', request.url));
}

if (isAuthenticated && pathname === '/prelaunch' && !isPrelaunch) {
  return NextResponse.redirect(new URL('/', request.url));
}
```

**Verify**: Test flow:
- Authenticated user truy cập `/login` khi pre-launch → redirect `/prelaunch`
- Authenticated user truy cập `/prelaunch` khi event started → redirect `/`

---

### Task 0.4 — OAuth Callback: Pre-launch Redirect

**File**: `src/app/auth/callback/route.ts`

Sau `exchangeCodeForSession` thành công, kiểm tra `NEXT_PUBLIC_EVENT_DATETIME` trước khi redirect:

```typescript
const eventDatetime = process.env.NEXT_PUBLIC_EVENT_DATETIME;
const isPrelaunch = eventDatetime
  ? Date.now() < new Date(eventDatetime).getTime()
  : false;
return NextResponse.redirect(new URL(isPrelaunch ? '/prelaunch' : '/', requestUrl));
```

**Verify**: Đăng nhập mới → redirect `/prelaunch` khi `NEXT_PUBLIC_EVENT_DATETIME` ở tương lai.

---

### Task 0.5 — Shared Utility: `lib/countdown.ts`

**File**: `src/lib/countdown.ts`

```typescript
export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  isOver: boolean;
}

export function getTimeRemaining(targetISO: string): TimeRemaining {
  const target = new Date(targetISO).getTime();
  const now = Date.now();
  const total = Number.isNaN(target) ? 0 : Math.max(0, target - now);

  return {
    days:    Math.floor(total / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    isOver:  total === 0,
  };
}
```

**Verify**: Unit test đơn giản: `getTimeRemaining('')` → `{ days:0, hours:0, minutes:0, isOver:true }`.

---

### Task 0.6 — Shared Layout: `Header.tsx`

**File**: `src/components/layout/Header.tsx` (`'use client'`)

Components:
- Logo (SAA PNG) — click → `router.push('/')`
- Nav links: About SAA, Awards Information, Sun* Kudos — dùng `usePathname()` cho active state
- Notification icon (bell SVG) + unread badge
- Language Selector (reuse `src/components/auth/LanguageSelector.tsx`)
- User Avatar + dropdown: Profile / Sign out / Admin Dashboard (if `role === 'admin'`)

**Props**: `userRole?: 'user' | 'admin'` (passed from Server Component page)

**Verify**: Hiển thị đúng trên mọi breakpoint; active link highlight đúng theo pathname.

---

### Task 0.7 — Shared Layout: `Footer.tsx`

**File**: `src/components/layout/Footer.tsx` (Server Component)

- Logo + nav links (About SAA, Awards, Kudos, Tiêu chuẩn chung)
- Copyright text

**Verify**: Render đúng, links navigate đúng routes.

---

### Task 0.8 — Shared Layout: `WidgetButton.tsx`

**File**: `src/components/layout/WidgetButton.tsx` (`'use client'`)

- `position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 50`
- Pill `105×64px`, nền `#FFEA9E`
- Pencil icon + SAA icon (SVGs)
- Click → mở quick-action menu (MVP: navigate to `/kudos`)

**Verify**: Luôn visible ở mọi scroll position; không bị overlap header/footer.

---

### Task 0.9 — Shared Static Data: `lib/awards-data.ts`

**File**: `src/lib/awards-data.ts`

> **Path convention**: `src/lib/` = project utilities (mới tạo trong plan này). Khác với `src/libs/` (existing third-party integrations như Supabase client).

```typescript
export type AwardUnit = 'Đơn vị' | 'Cá nhân' | 'Tập thể';
export interface AwardValue { individual?: string; team?: string; single?: string; }
export interface Award {
  slug: string; name: string; description: string;
  quantity: number; unit?: AwardUnit; value: AwardValue;
  image: string; figmaNodeId: string;
}
export const AWARDS: Award[] = [
  { slug: 'top-talent', name: 'Top Talent', quantity: 10, unit: 'Đơn vị',
    description: 'Vinh danh top cá nhân xuất sắc nhất trên mọi phương diện năng lực và đóng góp trong năm.',
    value: { single: '7.000.000 VNĐ' }, image: '/assets/awards/top-talent.png', figmaNodeId: '313:8467' },
  { slug: 'top-project', name: 'Top Project', quantity: 2, unit: 'Tập thể',
    description: 'Vinh danh dự án xuất sắc trên mọi phương diện, đặc biệt là doanh thu và hiệu quả hoạt động.',
    value: { single: '15.000.000 VNĐ' }, image: '/assets/awards/top-project.png', figmaNodeId: '313:8468' },
  { slug: 'top-project-leader', name: 'Top Project Leader', quantity: 3, unit: 'Cá nhân',
    description: 'Vinh danh người quản lý dự án truyền cảm hứng và dẫn dắt đội nhóm bứt phá.',
    value: { single: '7.000.000 VNĐ' }, image: '/assets/awards/top-project-leader.png', figmaNodeId: '313:8469' },
  { slug: 'best-manager', name: 'Best Manager', quantity: 1, unit: 'Cá nhân',
    description: 'Vinh danh người quản lý có năng lực quản lý tốt, xây dựng và dẫn dắt đội nhóm hiệu quả.',
    value: { single: '10.000.000 VNĐ' }, image: '/assets/awards/best-manager.png', figmaNodeId: '313:8470' },
  { slug: 'signature-2025-creator', name: 'Signature 2025 - Creator', quantity: 1,
    description: 'Vinh danh cá nhân hoặc tập thể có đóng góp sáng tạo ấn tượng, mang dấu ấn riêng cho SAA 2025.',
    value: { individual: '5.000.000 VNĐ', team: '8.000.000 VNĐ' }, image: '/assets/awards/signature-2025-creator.png', figmaNodeId: '313:8471' },
  { slug: 'mvp', name: 'MVP (Most Valuable Person)', quantity: 1,
    description: 'Giải thưởng cao nhất, vinh danh cá nhân có giá trị và đóng góp lớn nhất trong toàn bộ chương trình.',
    value: { single: '15.000.000 VNĐ' }, image: '/assets/awards/mvp.png', figmaNodeId: '313:8510' },
];
```

**Verify**: `tsc --noEmit` không lỗi; import từ M2 AwardCard và M3 AwardBlock đều hoạt động.

---

### Task 0.10 — Shared Layout: `(dashboard)/layout.tsx`

**File**: `src/app/(dashboard)/layout.tsx` (Server Component)

> Centralize session guard + profile fetch cho tất cả authenticated pages. Các page con trong `(dashboard)/` KHÔNG cần lặp lại auth logic.

```typescript
// src/app/(dashboard)/layout.tsx
import { createClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WidgetButton from '@/components/layout/WidgetButton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, locale')
    .eq('id', user.id)
    .single();

  return (
    <>
      <Header userRole={profile?.role ?? 'user'} />
      <main>{children}</main>
      <Footer />
      <WidgetButton />
    </>
  );
}
```

**Impact**: Task 2.1, 3.1, 4.1 — xóa bỏ duplicate auth guard + profile fetch trong từng page; pages chỉ cần fetch data riêng của trang đó.

**Verify**: Navigate giữa các trang authenticated — Header render đúng role; redirect `/login` khi session hết hạn.

---

## Milestone 1 — Prelaunch Page

> **Goal**: Trang "phòng chờ" với LED countdown. Prerequisite: M0 hoàn thành.

**Spec**: `.momorph/contexts/specs/prelaunch/spec.md`
**Route**: `/prelaunch` → `src/app/(dashboard)/prelaunch/page.tsx`

---

### Task 1.1 — Route Guard (Server Component)

**File**: `src/app/(dashboard)/prelaunch/page.tsx`

```typescript
// Server Component
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login');

const eventDatetime = process.env.NEXT_PUBLIC_EVENT_DATETIME;
const isEventStarted = eventDatetime
  ? Date.now() >= new Date(eventDatetime).getTime()
  : true;
if (isEventStarted) redirect('/');

return <PrelaunchLayout eventDatetime={eventDatetime ?? ''} />;
```

---

### Task 1.2 — Background & Layout

**File**: `src/components/prelaunch/PrelaunchLayout.tsx` (Server Component)

- Fullscreen background: `next/image` với Node ID `2268:35129` (`public/assets/prelaunch/images/keyvisual-bg.png`)
- Gradient overlays (giống Login)
- Header component (logo + LanguageSelector)
- Hero text (ROOT FURTHER / SAA 2025)
- `<CountdownClock targetISO={eventDatetime} />`

---

### Task 1.3 — CountdownClock Component

**File**: `src/components/prelaunch/CountdownClock.tsx` (`'use client'`)

- `useState` + `useEffect` + `setInterval(60_000)`
- `getTimeRemaining()` từ `src/lib/countdown`
- `clearInterval` trong cleanup
- Khi `isOver` → `router.push('/')`
- Format: `String(n).padStart(2, '0')`
- 3 `CountdownBlock` (DAYS, HOURS, MINUTES): 2 ô số riêng biệt kiểu LED

**Verify**:
- [ ] Hiển thị đúng DAYS/HOURS/MINUTES với zero-padding
- [ ] Tự cập nhật sau 1 phút (có thể test bằng mock `Date.now`)
- [ ] Khi `isOver: true` → tự redirect `/`
- [ ] `clearInterval` khi unmount (no memory leak)

---

### Task 1.4 — Responsive & Visual Polish

- Mobile (375px): 3 khối xếp ngang, scale vừa màn hình
- Desktop (1440px): căn giữa, max-w
- Font số: monospace/LED style hoặc custom font
- Nhãn: `DAYS`, `HOURS`, `MINUTES` — uppercase, màu trắng, cỡ nhỏ hơn số

**Verify**: Visual match với Figma frame `2268:35127`.

---

## Milestone 2 — Homepage

> **Goal**: Trang chủ đầy đủ sau khi đăng nhập + event started. Prerequisite: M0, M1.

**Spec**: `.momorph/contexts/specs/homepage/spec.md`
**Route**: `/` → `src/app/(dashboard)/page.tsx`

---

### Task 2.1 — Route Guard + Profile Fetch

**File**: `src/app/(dashboard)/page.tsx` (Server Component)

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login');

// Fetch profile for Header (role check)
const { data: profile } = await supabase
  .from('profiles')
  .select('role, locale')
  .eq('id', user.id)
  .single();
```

---

### Task 2.2 — Hero Section

**File**: `src/components/homepage/HeroSection.tsx` (Server Component)

- Background: `next/image` fill + priority (Node `2167:9028`)
- Root Further logo image (Node `2788:12911`)
- Gradient overlays
- `<CountdownSection eventDatetime={process.env.NEXT_PUBLIC_EVENT_DATETIME} />`
- B4 — "Root Further" đoạn mô tả tinh thần

---

### Task 2.3 — CountdownSection (Homepage variant)

**File**: `src/components/homepage/CountdownSection.tsx` (`'use client'`)

- **KHÔNG redirect** khi `isOver` (khác với Prelaunch — NFR-004)
- `setInterval(60_000)` + `clearInterval` cleanup
- 3 tiles: DAYS / HOURS / MINUTES
- "Comming soon" label (ẩn khi `isOver`)
- Event info: 18h30 / Âu Cơ Art Center / Livestream
- 2 CTA buttons:
  - `ABOUT AWARDS` → `<Link href="/awards">`
  - `ABOUT KUDOS` → `<Link href="/kudos">`

**Verify**: Nhận `eventDatetime` prop; hiển thị `00 00 00` khi undefined; không crash.

---

### Task 2.4 — Awards Section

**File**: `src/components/homepage/AwardsSection.tsx` (Server Component)

- Section header (caption + title "Hệ thống giải thưởng" + mô tả)
- Grid 3 cột desktop / 2 cột mobile — 6 `<AwardCard>`

**File**: `src/components/homepage/AwardCard.tsx` (Server Component)

- Image (`next/image`) + title + description (truncate 2 dòng) + "Chi tiết" link
- `<Link href={/awards#${award.slug}}>` bao ngoài toàn card
- Hover: `hover:scale-[1.02] hover:shadow-lg` transition

**Data**: Import `AWARDS` từ `src/lib/awards-data.ts`

**Verify**: 6 cards hiển thị đúng tên/desc/image; click → navigate `/awards#[slug]`.

---

### Task 2.5 — Sun\* Kudos Section

**File**: `src/components/homepage/SunKudosSection.tsx` (Server Component)

- Label "Phong trào ghi nhận" + tiêu đề "Sun* Kudos" + mô tả + ảnh
- Nút "Chi tiết" → `<Link href="/kudos">`

---

### Task 2.6 — Assemble Homepage

**File**: `src/app/(dashboard)/page.tsx`

> **⚠️ C-4**: File `src/app/page.tsx` đang tồn tại phải được **XÓA** trước khi tạo `src/app/(dashboard)/page.tsx`. Hai file cùng serve route `/` sẽ gây build conflict trong Next.js App Router.

> **Lưu ý**: Header, Footer, WidgetButton đã được render bởi `(dashboard)/layout.tsx` (Task 0.10) — KHÔNG render lại trong page component.

```tsx
// src/app/(dashboard)/page.tsx — chỉ render page content (layout wrapper ở layout.tsx)
export default async function HomePage() {
  return (
    <>
      <HeroSection />
      <AwardsSection />
      <SunKudosSection />
    </>
  );
}
```

**Verify** (full):
- [ ] Redirect `/login` khi unauthenticated
- [ ] Countdown hiển thị đúng và tự cập nhật
- [ ] Header active link = "About SAA 2025" (trang `/`)
- [ ] 6 award cards với link đúng `#slug`
- [ ] WidgetButton fixed góc phải
- [ ] Admin Dashboard chỉ thấy với `role = 'admin'`
- [ ] Responsive mobile/tablet/desktop

---

## Milestone 3 — Awards Page

> **Goal**: Trang giải thưởng với sticky nav + scroll-spy. Prerequisite: M0, M2.

**Spec**: `.momorph/contexts/specs/awards/spec.md`
**Route**: `/awards` → `src/app/(dashboard)/awards/page.tsx`

---

### Task 3.1 — Route Guard + Page Shell

**File**: `src/app/(dashboard)/awards/page.tsx` (Server Component)

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login');
const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
```

> **Lưu ý**: Header, Footer, WidgetButton đã được render bởi `(dashboard)/layout.tsx` (Task 0.10) — KHÔNG render lại trong page component.

Render: Keyvisual + Section A (title) + Section B (nav + awards) + Sun*Kudos promo block

---

### Task 3.2 — Keyvisual Hero Banner

**File**: `src/components/awards/AwardsKeyvisual.tsx` (Server Component)

- Background: `next/image` fill (Node `2789:12915`, `public/assets/awards/images/keyvisual-bg.png`)
- ROOT FURTHER image + "Sun* Annual Award 2025" subtitle
- Gradient overlay (consistent với Login/Homepage)

---

### Task 3.3 — AwardNavMenu (Scroll-spy)

**File**: `src/components/awards/AwardNavMenu.tsx` (`'use client'`)

- 6 nav items từ `AWARDS` (slug + name)
- `position: sticky; top: var(--header-height)` ở desktop
- `IntersectionObserver` (threshold: 0.3) watches `section#[slug]` elements
- Khi section enters viewport → set `activeSlug`
- Click → `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`
- Invalid hash → active = `top-talent` (first item)
- Hash từ URL (`window.location.hash`) → set initial activeSlug on mount

**Active styles**: `color: var(--Gold)` + border-left/underline vàng

---

### Task 3.4 — AwardBlock (6 items)

**File**: `src/components/awards/AwardBlock.tsx` (Server Component)

```tsx
<section id={award.slug} aria-label={award.name}>
  <img ... /> {/* 336×336px, object-contain */}
  <AwardBlockContent award={award} />
</section>
```

**File**: `src/components/awards/AwardBlockContent.tsx` (Server Component)

- Tiêu đề + mô tả + số lượng + đơn vị + giá trị
- Giá trị: bold/màu vàng; số lượng: label + số + đơn vị
- D.5 Signature: hiển thị cả 2 giá trị (cá nhân / tập thể)

**Data**: `AWARDS` từ `src/lib/awards-data.ts`

---

### Task 3.5 — Assemble Awards Page

Layout desktop: 2-column flex: `AwardNavMenu` (sticky, ~240px) + award blocks column (flex-1)

```
Section B layout:
┌─────────────────────────────────────────────┐
│  C_Menu (sticky)  │  D.1 Top Talent block   │
│                   │  D.2 Top Project block  │
│                   │  ...                    │
│                   │  D.6 MVP block          │
│                   │  D1 Sun*Kudos promo      │
└─────────────────────────────────────────────┘
```

**Verify**:
- [ ] Redirect `/login` khi unauthenticated
- [ ] Menu trái sticky ở desktop
- [ ] Scroll-spy cập nhật active đúng khi cuộn
- [ ] Click menu → smooth scroll đến section
- [ ] URL `/awards#best-manager` scroll đúng section on load
- [ ] Hash không hợp lệ → không crash, top-talent active
- [ ] Mobile: menu chuyển horizontal scroll tabs
- [ ] 6 blocks hiển thị đúng data (số lượng, đơn vị, giá trị)

---

## Milestone 4 — Kudos Live Board (Phase A: Static + Feed)

> **Goal**: Trang Kudos với hero + filter UI + All Kudos feed (infinite scroll). Prerequisite: M0, M2.

**Spec**: `.momorph/contexts/specs/kudos-live-board/spec.md`
**Route**: `/kudos` → `src/app/(dashboard)/kudos/page.tsx`

---

### Task 4.1 — Route Guard + Initial Data Fetch

**File**: `src/app/(dashboard)/kudos/page.tsx` (Server Component)

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login');

// Fetch initial data (SSR):
// - top 5 highlight kudos (heart_count DESC LIMIT 5)
// - first page of all kudos (LIMIT 20, ORDER BY created_at DESC)
// - user stats (kudos_received, kudos_sent, hearts_received, secret_box counts)
// Note: profile/role fetch for Header is handled by (dashboard)/layout.tsx (Task 0.10)
```

---

### Task 4.2 — Hero Banner

**File**: `src/components/kudos/KudosHero.tsx` (Server Component)

- Tiêu đề "Hệ thống ghi nhận lời cảm ơn" + KUDOS logo SVG (Node `2940:13440`)
- `<SendKudosButton />` — pill trigger

**File**: `src/components/kudos/SendKudosButton.tsx` (`'use client'`)

- Pill input placeholder "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?"
- Click → opens `SendKudosDialog`

---

### Task 4.3 — All Kudos Feed + Infinite Scroll

**File**: `src/components/kudos/AllKudosSection.tsx` (`'use client'`)

- Nhận `initialKudos` prop từ Server Component
- `IntersectionObserver` trên sentinel element ở cuối list
- Khi sentinel visible + còn dữ liệu → fetch next page (cursor-based: `created_at`)
- Loading indicator khi fetching
- Empty state: "Hiện tại chưa có Kudos nào."
- Error state: "Thử lại" button

**File**: `src/components/kudos/KudoCard.tsx` (`'use client'`)

- Avatar gửi → mũi tên → avatar nhận
- Thời gian (relative, e.g., "2 giờ trước")
- Nội dung (truncate 3 dòng)
- Hashtags (max 5, truncate với "...")
- Heart button (optimistic toggle)
- Copy Link button → `navigator.clipboard.writeText()` + toast
- Click sender/receiver avatar/name → `/profile/[userId]`

**Heart Optimistic Logic**:
```typescript
const [liked, setLiked] = useState(initialLiked);
const [count, setCount] = useState(initialCount);

async function handleLike() {
  setLiked(!liked);
  setCount(liked ? count - 1 : count + 1);
  try { await toggleLike(kudosId); }
  catch { setLiked(liked); setCount(count); } // rollback
}
```

---

### Task 4.4 — API Routes cho Kudos Feed

**File**: `src/app/api/kudos/route.ts`

```
GET /api/kudos?cursor=ISO_DATE&limit=20&hashtag=X&department=Y
```

- Auth guard: return 401 nếu không có session
- Cursor-based pagination: `WHERE created_at < cursor ORDER BY created_at DESC LIMIT limit`
- Apply filter `hashtag` và `department_id` nếu có

**File**: `src/app/api/kudos/[id]/like/route.ts`

```
POST /api/kudos/:id/like   → toggle like (insert/delete kudos_likes)
```

- Auth guard
- Pattern: **select-then-insert-or-delete** (`UPSERT` không thể conditionally DELETE):

```typescript
const { data: existing } = await supabase
  .from('kudos_likes')
  .select('kudos_id')
  .eq('kudos_id', id)
  .eq('user_id', userId)
  .maybeSingle();

if (existing) {
  await supabase.from('kudos_likes').delete()
    .eq('kudos_id', id).eq('user_id', userId);
} else {
  await supabase.from('kudos_likes').insert({ kudos_id: id, user_id: userId });
}
// heart_count synced automatically by DB trigger (Task 0.1e)
```

- Trả về `{ liked: boolean, heart_count: number }`

---

### Task 4.5 — Sidebar Stats

**File**: `src/components/kudos/KudosSidebar.tsx` (`'use client'`)

- 6 chỉ số từ API `/api/me/kudos-stats`
- "Mở quà" button (disabled khi `secret_box_unopened = 0`)
- "10 SUNNER NHẬN QUÀ MỚI NHẤT" list (D.3)
- `position: sticky; top: var(--header-height)`

**File**: `src/app/api/me/kudos-stats/route.ts`

```
GET /api/me/kudos-stats
→ { kudos_received, kudos_sent, hearts_received, secret_box_opened, secret_box_unopened }
```

---

### Task 4.6 — Phase A Verify

- [ ] Redirect `/login` khi unauthenticated
- [ ] Hero banner + Send Kudos pill hiển thị
- [ ] All Kudos feed hiển thị 20 kudos đầu tiên
- [ ] Infinite scroll load next page khi scroll xuống cuối
- [ ] Heart toggle hoạt động (optimistic + rollback)
- [ ] Copy Link → clipboard + toast
- [ ] Sidebar stats hiển thị đúng số
- [ ] "Mở quà" disabled khi 0 unopened boxes

---

## Milestone 5 — Kudos Live Board (Phase B: Interactive)

> **Goal**: Highlight Carousel + Filter + Send Kudos Dialog + Spotlight Board + Secret Box Dialog. Prerequisite: M4.

---

### Task 5.1 — Highlight Kudos Carousel

**File**: `src/components/kudos/HighlightCarousel.tsx` (`'use client'`)

- Top 5 kudos by `heart_count DESC`
- Prev/Next buttons (disabled ở slide 1/5 và 5/5)
- Pagination counter "2/5"
- Center card = active (full opacity + scale); 2 bên = inactive (dimmed)
- Mỗi card: `<KudoHighlightCard>` (variant lớn hơn KudoCard)

**File**: `src/components/kudos/KudoHighlightCard.tsx` (`'use client'`)

- Avatar sender → arrow → avatar receiver
- Nội dung (3 dòng max) + hashtags (5 max)
- Heart + "Copy Link" + "Xem chi tiết" → `/kudos/[id]`

---

### Task 5.2 — Filter (Hashtag + Phòng ban)

**File**: `src/components/kudos/HighlightSection.tsx` (`'use client'`)

- "Hashtag" dropdown: fetch `/api/hashtags` on mount
- "Phòng ban" dropdown: fetch `/api/departments` on mount
- Khi filter thay đổi: refetch cả Highlight carousel VÀ All Kudos feed; pagination về trang 1

**Files**:
```
src/app/api/hashtags/route.ts     → GET all hashtags
src/app/api/departments/route.ts  → GET all departments
```

---

### Task 5.3 — Send Kudos Dialog

**File**: `src/components/kudos/SendKudosDialog.tsx` (`'use client'`)

Fields:
- Người nhận (combobox search `profiles`, loại trừ chính user → FR-010)
- Nội dung (textarea, max 1000 chars)
- Hashtags (multi-select từ `hashtags` reference table — dùng `name` string, không phải ID)
- Submit button (disabled khi thiếu required fields)

Submit → `POST /api/kudos`:
- Body: `{ receiver_id, message, hashtags: string[] }` — phù hợp với `kudos.hashtags text[]`
- Auth guard server-side; validate `sender_id !== receiver_id`
- Sau submit: close dialog + refresh All Kudos feed (thêm mới lên đầu)

**File**: `src/app/api/kudos/route.ts` (POST handler thêm vào existing file)

---

### Task 5.4 — Spotlight Board

**File**: `src/components/kudos/SpotlightBoard.tsx` (`'use client'`, lazy-loaded)

- `dynamic(() => import('@/components/kudos/SpotlightBoard'), { ssr: false })`
- Word-cloud: tên Sunner nhận kudos, size tỷ lệ với count
- Total kudos counter (polling mỗi 30s hoặc Supabase Realtime)
- Hover node → tooltip (tên + thời gian nhận kudos gần nhất)
- Click node → navigate `/kudos/[id]` (kudos gần nhất của người đó)
- Pan/Zoom button toggle
- Search input (maxLength 100) → highlight matching node

**Library**: Dùng `d3-cloud` (layout-only, không phụ thuộc DOM) + HTML/CSS render — an toàn với Cloudflare V8 isolate. Tránh D3 v7 full bundle và `react-wordcloud` (cả hai có Node.js DOM dependencies). Import pattern: `import cloud from 'd3-cloud'` (ESM-safe).

---

### Task 5.5 — Secret Box Dialog

**File**: `src/components/kudos/SecretBoxDialog.tsx` (`'use client'`)

- Trigger: "Mở quà" button trong sidebar (chỉ khi `secret_box_unopened > 0`)
- Animation mở quà
- Hiển thị nội dung quà (từ `secret_boxes` table)
- Sau mở: cập nhật `is_opened = true`; update sidebar stats

**File**: `src/app/api/me/secret-box/[id]/open/route.ts`

```
POST /api/me/secret-box/:id/open
→ PATCH secret_boxes SET is_opened = true WHERE id = :id AND user_id = auth.uid()
```

---

### Task 5.6 — Kudos Detail Page

**File**: `src/app/(dashboard)/kudos/[id]/page.tsx` (Server Component)

> Links "Xem chi tiết" trong Highlight và Spotlight Board đều navigate đến `/kudos/[id]`. Cần implement page này trong M5 để các links không dẫn đến 404.

- Fetch kudos by `id` từ DB
- Hiển thị đầy đủ: sender → receiver, nội dung, hashtags, hình ảnh, timestamp
- Heart button (tái dùng `KudoCard` logic)
- Back button → `/kudos`
- 404 nếu `id` không tồn tại

**Verify**: `/kudos/[id]` render đúng kudos; 404 cho ID không hợp lệ.

> **Profile page** `/profile/[userId]` được reference trong KudoCard click — MVP: render 404 hoặc redirect `/kudos`. Tạo spec riêng cho Profile page trước khi implement.

---

### Task 5.7 — Phase B Verify

- [ ] Highlight carousel hiển thị top 5 by heart_count
- [ ] Prev/Next buttons disabled đúng ở đầu/cuối
- [ ] Filter hashtag/department áp dụng cho cả Highlight + All Kudos
- [ ] Send Kudos Dialog: submit thành công + feed refresh
- [ ] Self-kudos prevention ở cả client và server
- [ ] Spotlight Board hiển thị word-cloud; hover tooltip; click → `/kudos/[id]`
- [ ] Secret Box Dialog: mở được khi `unopened > 0`; button disabled khi = 0
- [ ] `/kudos/[id]` hiển thị đúng kudos detail

---

## Environment Variables Summary

| Variable | Required | Used In |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | All pages |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | All pages |
| `NEXT_PUBLIC_SITE_URL` | ✅ | OAuth callback redirectTo |
| `NEXT_PUBLIC_EVENT_DATETIME` | ✅ | Middleware, Prelaunch, Homepage countdown |

---

## Asset Download Checklist *(từ Figma)*

| Asset | Figma Node | Destination |
|---|---|---|
| Prelaunch BG | `2268:35129` | `public/assets/prelaunch/images/keyvisual-bg.png` |
| Homepage hero BG | `2167:9028` | `public/assets/homepage/images/hero-bg.png` |
| ROOT FURTHER logo | `2788:12911` | `public/assets/homepage/images/root-further.png` |
| Sun\* Kudos promo image | `I3390:10349;313:8416` | `public/assets/homepage/images/kudos-bg.png` |
| Awards keyvisual BG | `2789:12915` | `public/assets/awards/images/keyvisual-bg.png` |
| Award images (×6) | `I2167:9075...` | `public/assets/homepage/awards/[slug].png` |
| Award detail images (×6) | `313:8467...` | `public/assets/awards/[slug].png` |
| KUDOS logo SVG | `2940:13440` | `public/assets/kudos/icons/kudos-logo.svg` |
| Widget pencil SVG | `I5022:15169;...` | `public/assets/homepage/icons/widget-pencil.svg` |
| Notification bell SVG | `I2167:9091;...` | `public/assets/homepage/icons/bell.svg` |
| Arrow prev/next SVGs | `I2940:13468/13470` | `public/assets/kudos/icons/arrow-*.svg` |
| Gift icon SVG | `I2940:13497;186:1766` | `public/assets/kudos/icons/gift.svg` |

---

## Dependency Graph

```
         M0 (Infrastructure)
              ↓
    ┌─────────┴──────────┐
    M1 (Prelaunch)       │  (parallel)
    ↓                    │
    M2 (Homepage)  ──────┘
         ↓
    ┌────┴────┐
    M3        M4        (parallel — M4 không cần M3)
 (Awards) (Kudos A)
              ↓
           M5 (Kudos B)
```

**Prerequisite summary**:
- M1: M0
- M2: M0
- M3: M0, M2
- M4: M0, M2 *(không cần M3)*
- M5: M4

---

## Screen → Route → Spec Mapping

| Screen | Route | Spec | Milestone |
|---|---|---|---|
| Login | `/login` | `specs/login/spec.md` | ✅ Done |
| Prelaunch | `/prelaunch` | `specs/prelaunch/spec.md` | M1 |
| Homepage | `/` | `specs/homepage/spec.md` | M2 |
| Awards | `/awards` | `specs/awards/spec.md` | M3 |
| Kudos Live Board | `/kudos` | `specs/kudos-live-board/spec.md` | M4 + M5 |

---

## Definition of Done (Per Milestone)

- [ ] Code builds without TypeScript errors (`tsc --noEmit` passes)
- [ ] `next build` passes (no build errors)
- [ ] Visual match với Figma design (desktop + mobile)
- [ ] All FR/TR trong spec tương ứng đã implemented
- [ ] No `console.error` hoặc unhandled promise rejections
- [ ] RLS policies ngăn unauthorized access
- [ ] Responsive: 375px / 768px / 1440px
