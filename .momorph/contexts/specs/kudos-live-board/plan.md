# Implementation Plan: Sun* Kudos - Live Board

**Frame**: `2940:13431 — Sun* Kudos - Live board`
**MoMorph Frame ID**: `6384`
**Date**: 2026-03-27
**Spec**: `.momorph/contexts/specs/kudos-live-board/spec.md`

---

## Summary

Trang `/kudos` là trung tâm tương tác của chương trình SAA 2025 Kudos. Toàn bộ codebase skeleton đã tồn tại (components, API routes, migrations), nhưng audit thực tế cho thấy **nhiều bug và gap quan trọng hơn dự kiến ban đầu**:

- `special_days` double-heart, `hearts_received`, `kudos_star_tier_updated_at` — chưa có trong DB
- `sort=heart_count` param **bị ignore** ở API GET — Highlight không sort theo like
- Self-like guard **hoàn toàn vắng mặt** (cả API lẫn UI)
- `currentUserId` **chưa được propagate** xuống bất kỳ component nào
- Hashtag `<span>` không có `onClick` — click hashtag không filter
- `KudoHighlightCard` render message là **plain text** (mất HTML từ rich editor)
- `KudoHighlightCard` thiếu `danh_hieu` display
- `IntersectionObserver` trong `AllKudosSection` thiếu dependency array (re-attach mỗi render)
- Post-send remount hiển thị stale SSR data thay vì fresh feed
- `hearts_received` query trong `kudos-stats` dùng sai PostgREST join syntax
- `SpotlightBoard` map `kudos_id` theo array index — không ổn định với d3-cloud output order
- D.2 "10 SUNNER CÓ SỰ THĂNG HẠNG" **hoàn toàn không tồn tại** trong sidebar
- SSR query trong `page.tsx` thiếu `danh_hieu`, `image_urls`, `is_anonymous`, `anonymous_name`

Kế hoạch này **bổ sung và sửa** tất cả các gap này theo thứ tự ưu tiên.

---

## Technical Context

| | |
|---|---|
| **Language/Framework** | TypeScript / Next.js 15 App Router + React 19 |
| **Auth** | Supabase Auth via `@supabase/ssr` (JWT — `getUser()`) |
| **Database** | Supabase (PostgreSQL) — RPC + Row-Level Security |
| **Deployment** | Cloudflare Workers via `@opennextjs/cloudflare` (OpenNext) |
| **Styling** | Tailwind CSS v4 + CSS custom properties (design tokens in `globals.css`) |
| **State Management** | React `useState` / `useReducer` + component-level state; no global store |
| **Data Fetching** | Server Components (initial) + `fetch` trong Route Handlers + optimistic update client-side |
| **Realtime** | Supabase Realtime (spotlight count polling / subscription) |
| **i18n** | `next-intl` v4 |
| **Rich Editor** | TipTap v3 với `@mention` extension |
| **Word Cloud** | `d3-cloud` v1.2.9 |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **Package Manager** | yarn |

---

## Constitution Compliance Check

- [x] Follows project coding conventions (2-space indent, single quotes, PascalCase components, kebab-case assets)
- [x] Uses approved libraries (`@supabase/ssr`, TipTap, d3-cloud, next-intl — đã có trong `package.json`)
- [x] Adheres to folder structure: `src/app/api/`, `src/components/kudos/`, `src/services/`
- [x] Meets security requirements: `getUser()` (không phải `getSession()`), RLS trên tất cả tables, API guard cho like/send
- [x] Cloudflare Workers: chỉ dùng Web APIs + `nodejs_compat` đã enable, không dùng `fs`/`path`

**Violations**: Không có vi phạm mới. Mọi thay đổi đều nằm trong stack hiện tại.

---

## Architecture Decisions

### Frontend

- **Component Strategy**: Skeleton đã có — chỉ bổ sung props/logic thiếu. Không tạo component mới trừ `ProfilePreviewPopover` (FR-016).
- **Rendering**: Server Component cho page shell + initial data; Client Components (`'use client'`) cho carousel, like, infinite scroll, sidebar stats.
- **Optimistic Updates**: Pattern hiện tại trong `KudoCard.tsx` — rollback on API error (giữ nguyên).
- **Filter State**: Shared `useState` ở `KudosClient.tsx`, truyền xuống `HighlightSection` và `AllKudosSection` qua props để đảm bảo filter đồng bộ cả hai section.
- **Truncation**: Dùng Tailwind `line-clamp-3` (Highlight) và `line-clamp-5` (All Kudos) — đã có trong Tailwind v4.

### Backend

- **API Design**: Route Handlers mỏng → Service layer (`src/services/kudos.service.ts`)
- **DB Operations**: Supabase RPC cho like toggle (atomic, tránh race condition); direct query cho read-only endpoints
- **Validation**: Zod trong service layer tại boundary input (API body)

### New DB Objects cần tạo

| Object | Type | Mục đích |
|---|---|---|
| `special_days` | Table | Admin-configurable ngày đặc biệt (double heart) |
| `kudos_likes.is_special_day` | Column | Track liệu like có trong ngày đặc biệt hay không |
| `profiles.hearts_received` | Column | Tổng tim sender nhận từ reactions trên kudos đã gửi |
| `profiles.kudos_star_tier_updated_at` | Column | Track lần cuối tier thay đổi (cho D.2 leaderboard) |
| `toggle_kudos_like()` | RPC | Atomic like/unlike + cập nhật heart_count + hearts_received; self-like guard built-in |
| `get_kudos_stats()` | RPC | Trả về stats sidebar theo user_id — thay thế broken PostgREST join |
| `update_kudos_star_tier()` | DB Trigger | Đã tồn tại trong migration 001; chỉ cần extend thêm `kudos_star_tier_updated_at` |

> **Lưu ý audit**: Trigger `update_kudos_star_tier` và `sync_kudos_heart_count` **đã tồn tại** trong `20260323000001_kudos_schema.sql`. Migration mới chỉ cần extend trigger hiện có để set `kudos_star_tier_updated_at`, không tạo lại từ đầu.

---

## Project Structure

### Documentation

```
.momorph/contexts/specs/kudos-live-board/
├── spec.md               ✅ Reviewed
├── plan.md               ← This file
└── tasks.md              (next step)
```

### Source Code — Affected Areas

```
src/
├── app/
│   └── (dashboard)/
│       └── kudos/
│           ├── page.tsx                    # Cần: pass liked_by_me, sender check
│           └── [id]/
│               └── page.tsx                # Kudo detail (hiện tại cần kiểm tra)
├── app/api/
│   └── kudos/
│       ├── route.ts                        # GET (feed) + POST (send) — kiểm tra self-send guard
│       ├── highlight/
│       │   └── route.ts                    # NEW: GET /api/kudos/highlight
│       ├── spotlight/
│       │   └── route.ts                    # Đã có; kiểm tra realtime count
│       └── [id]/
│           └── like/
│               └── route.ts                # Cập nhật: is_special_day + hearts_received
├── components/
│   └── kudos/
│       ├── KudosClient.tsx                 # Cập nhật: shared filter state
│       ├── KudoCard.tsx                    # Cập nhật: self-like disable, 5-line clamp
│       ├── KudoHighlightCard.tsx           # Cập nhật: 3-line clamp, "Xem chi tiết" button
│       ├── KudosSidebar.tsx                # Cập nhật: D.2 leaderboard "Thăng hạng mới nhất"
│       ├── HighlightSection.tsx            # Cập nhật: hashtag click → filter propagation
│       ├── AllKudosSection.tsx             # Cập nhật: hashtag click → filter propagation
│       ├── SpotlightBoard.tsx              # Kiểm tra: click → latest kudos of receiver
│       └── ProfilePreviewPopover.tsx       # NEW: hover preview (FR-016)
├── services/
│   └── kudos.service.ts                    # NEW (hoặc refactor từ route handlers)
└── types/
    └── kudos.ts                            # Cập nhật types với trường mới

supabase/migrations/
└── 20260327000000_kudos_special_days.sql   # NEW migration
```

---

## Implementation Strategy

### Phase Breakdown

#### Phase 0 — DB Migration (Prerequisite)

Tạo migration `20260327000000_kudos_special_days.sql` với:

1. Tạo bảng `special_days`
2. Thêm column `kudos_likes.is_special_day`
3. Thêm column `profiles.hearts_received`
4. Thêm column `profiles.kudos_star_tier_updated_at`
5. Tạo RPC `toggle_kudos_like(p_kudos_id, p_user_id)` — atomic:
   - Check `special_days` → `is_special_day`
   - UPSERT `kudos_likes`
   - UPDATE `kudos.heart_count`
   - UPDATE `profiles.hearts_received` của sender (+1/+2 like, -1/-2 unlike dùng stored `is_special_day`)
   - Self-like guard: nếu `sender_id = user_id` → raise exception
6. Tạo/update DB trigger `on_kudos_insert_update_star_tier` — cập nhật `kudos_star_tier` + `kudos_star_tier_updated_at` của receiver
7. Tạo RPC `get_kudos_stats(p_user_id)` → trả về `kudos_received, kudos_sent, hearts_received, secret_box_opened, secret_box_unopened`

#### Phase 1 — API Layer (Priority: P1)

**Mục tiêu**: Đảm bảo tất cả API trả về đúng data cho FR P1.

1. **`/api/kudos` (POST)** — Verify `create_kudos()` RPC đã có `sender ≠ receiver` guard; xác nhận department denormalization hoạt động.
2. **`/api/kudos/highlight` (GET)** — Tạo mới (nếu chưa có): query `kudos ORDER BY heart_count DESC LIMIT 5` với filter optional `hashtag`, `department_id`.
3. **`/api/kudos/[id]/like` (POST/DELETE)** — Refactor sang gọi `toggle_kudos_like()` RPC; trả về `{ liked: boolean, count: number }`.
4. **`/api/me/kudos-stats` (GET)** — Refactor sang gọi `get_kudos_stats()` RPC.

#### Phase 2 — Core Components (Priority: P1 → P2)

**Thứ tự implement**:

1. **`KudoCard.tsx`** — Thêm prop `isSender: boolean`; disable heart button nếu `isSender = true`. Đổi `line-clamp-3` → `line-clamp-5` cho nội dung. Xác nhận hashtag click gọi `onFilterChange`.
2. **`KudoHighlightCard.tsx`** — Confirm `line-clamp-3`. Confirm "Xem chi tiết" button tồn tại. `aria-hidden="true"` cho icon sent.
3. **`page.tsx`** — Pass `isSender` flag khi map data: `isSender: kudo.sender_id === user.id`.
4. **`KudosClient.tsx`** — Đảm bảo shared filter state (`hashtag`, `department`) được truyền xuống cả `HighlightSection` và `AllKudosSection`.
5. **`HighlightSection.tsx`** — Nhận filter state từ parent; fetch `/api/kudos/highlight?hashtag=X&department=Y` khi filter thay đổi.
6. **`AllKudosSection.tsx`** — Nhận filter state từ parent; reset cursor khi filter thay đổi (FR-003).
7. **`KudosSidebar.tsx`** — Thêm section D.2 "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT"; fetch `profiles ORDER BY kudos_star_tier_updated_at DESC LIMIT 10`.

#### Phase 3 — P2/P3 Features

1. **`ProfilePreviewPopover.tsx`** (NEW) — Hover card component. Props: `userId`, `anchorElement`. Fetch `/api/profiles/search?id={userId}` hoặc dùng data đã có. Dùng Radix UI Tooltip/Popover hoặc đơn giản là `position: absolute` tooltip.
2. **`SpotlightBoard.tsx`** — Verify click node navigate đến kudos mới nhất của receiver; verify realtime total count update (polling 30s hoặc Supabase Realtime channel).
3. **`SecretBoxDialog.tsx`** — Verify disabled state khi `secret_box_unopened = 0`.
4. **Accessibility pass** — `aria-hidden="true"` cho tất cả decorative icons (sent arrow, dividers); đảm bảo heart button có `aria-label`, `aria-pressed`.

#### Phase 4 — i18n & Polish

1. Thêm translation keys VN/EN cho tất cả strings mới (D.2 title, "Thăng hạng", empty states, toast messages).
2. Verify responsive: Desktop (2-col) → Tablet 768px (sidebar collapse) → Mobile 375px (single column).
3. Verify `position: sticky` sidebar không bị overflow trên viewport thấp.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| RPC `toggle_kudos_like` có race condition | Low | High | Trigger `sync_kudos_heart_count` đã dùng `UPDATE ... SET heart_count = heart_count ± 1` (atomic); thêm `FOR NO KEY UPDATE` lock trong RPC nếu cần |
| **`sort` param bị ignore → Highlight sort sai** ✅ Đã xác nhận bug | High | High | Fix `GET /api/kudos` để handle `sort=heart_count` là việc đầu tiên Phase 1 |
| **`IntersectionObserver` re-attach mỗi render** ✅ Đã xác nhận bug | High | Medium | Wrap `fetchMore` trong `useCallback`, fix deps array — Phase 2 |
| **Backfill `hearts_received` trên rows cũ** | Medium | Medium | Migration script: `UPDATE profiles SET hearts_received = (SELECT COUNT(*) FROM kudos_likes kl JOIN kudos k ON k.id = kl.kudos_id WHERE k.sender_id = profiles.id)` |
| `d3-cloud` không preserve input order → `kudos_id` mismatch | High | Medium | Map bằng `text` key trong `layoutWords`, không bằng array index |
| Drop + recreate trigger `update_kudos_star_tier` có thể xung đột với migration 001 | Medium | High | Dùng `CREATE OR REPLACE FUNCTION` cho trigger function; `DROP TRIGGER IF EXISTS` trước khi tạo lại |
| Cloudflare Worker CPU timeout với Spotlight realtime | Low | Medium | Polling 30s đã được implement; không dùng WebSocket |
| `next-intl` missing keys → runtime error | Medium | Medium | Thêm fallback `defaultTranslationValues`, validate với `vitest` |
| `ProfilePreviewPopover` layout shift | Low | Low | Fixed width/height; lazy load avatar |

---

## Integration Testing Strategy

### Test Scope

- [x] **Component interactions**: `KudosClient` filter state → `HighlightSection` + `AllKudosSection` đồng bộ
- [x] **External dependencies**: Supabase RPC (`toggle_kudos_like`, `get_kudos_stats`)
- [x] **Data layer**: Migration chạy thành công, RLS policy hoạt động đúng
- [x] **User workflows**: Gửi kudos → feed update; Like → count update + rollback on error

### Test Categories

| Category | Applicable | Key Scenarios |
|---|---|---|
| UI ↔ Logic | Yes | Filter change → cả Highlight + All Kudos update; Like optimistic + rollback |
| App ↔ Data Layer | Yes | `toggle_kudos_like` RPC atomic; self-like guard; special day double-heart |
| Service ↔ Service | Yes | `create_kudos` trigger → `kudos_star_tier` update |
| Cross-platform | Yes | Responsive layout Desktop/Tablet/Mobile |

### Test Environment

- **Environment**: Local với `supabase start` + `yarn dev` (Cloudflare binding emulation via `initOpenNextCloudflareForDev`)
- **Test data**: Seed scripts trong `supabase/seeds/dev/` — extend với `special_days` entries
- **Isolation**: Fresh DB state per test run via `supabase db reset`

### Mocking Strategy

| Dependency | Strategy | Rationale |
|---|---|---|
| Supabase RPC | Real (local emulator) | Cần test DB trigger/RPC chính xác |
| `navigator.clipboard` | Mock/Stub | Không khả dụng trong JSDOM |
| `d3-cloud` rendering | Stub | Không test visual output của canvas |
| Supabase Auth | Real session (seed user) | Test middleware auth guard |

### Key Integration Test Scenarios

**Happy Path**:
- [ ] User A like kudos của User B → `heart_count` +1, `profiles[B sender].hearts_received` +1
- [ ] User A like trong `special_days` → `profiles[B sender].hearts_received` +2
- [ ] User A unlike → thu hồi đúng 1 hoặc 2 (theo `kudos_likes.is_special_day`)
- [ ] User A filter Hashtag "Dedicated" → Highlight + All Kudos đều filter; pagination reset về 1
- [ ] User A gửi kudos → feed hiển thị kudos mới ở đầu (không phải stale SSR data)
- [ ] User A gửi kudos → sidebar "Số Kudos đã gửi" +1
- [ ] User reaches 10 kudos received → `kudos_star_tier = 1`, `kudos_star_tier_updated_at` set

**Error / Guard**:
- [ ] User A self-like kudos → API 403 (`SELF_LIKE_NOT_ALLOWED`), button disabled trên UI
- [ ] User A gửi kudos cho chính mình → form blocked (client) + `create_kudos` RPC guard (server, đã có)
- [ ] Like khi offline → optimistic update rollback, count trở về cũ
- [ ] Unlike kudos không tồn tại trong `kudos_likes` → `toggle_kudos_like` RPC xử lý gracefully (no-op)

**Edge Cases**:
- [ ] Carousel filter trả về 2 kudos → pagination "2/2", nút tiến disabled ở slide 2
- [ ] `secret_box_unopened = 0` → nút "Mở quà" disabled
- [ ] D.2/D.3 rỗng → hiển thị "Chưa có dữ liệu"
- [ ] Spotlight với 0 kudos → empty state

### Coverage Goals

| Area | Target |
|---|---|
| Like toggle (RPC + UI optimistic) | 100% |
| Filter synchronization (B + C) | 100% |
| Self-like guard (client + server) | 100% |
| Sidebar stats accuracy | 90%+ |
| Responsive layout | Manual QA |

---

## Detailed Task Breakdown (by Phase)

### Phase 0 — Migration

| Task | File | Notes |
|---|---|---|
| Create `special_days` table + RLS policies | `supabase/migrations/20260327000000_kudos_special_days.sql` | Admin write + authenticated read |
| Add `kudos_likes.is_special_day BOOLEAN DEFAULT false` | Same migration | Backfill existing rows as false |
| Add `profiles.hearts_received INTEGER DEFAULT 0` | Same migration | Backfill: count existing likes per sender |
| Add `profiles.kudos_star_tier_updated_at TIMESTAMPTZ` | Same migration | Set via UPDATE from existing `kudos_star_tier` IS NOT NULL rows |
| **Replace** `update_kudos_star_tier` trigger to also set `kudos_star_tier_updated_at` | Same migration | DROP + recreate trigger function; must handle tier-change detection |
| Add index `kudos(sender_id)`, `kudos(receiver_id)`, `kudos(receiver_id, created_at DESC)` | Same migration | Performance for stats queries |
| Create `toggle_kudos_like(p_kudos_id uuid, p_user_id uuid)` RPC | Same migration | SECURITY DEFINER; atomic; self-like guard; replaces existing manual toggle logic |
| Create `get_kudos_stats(p_user_id uuid)` RPC | Same migration | Replace broken PostgREST join in `kudos-stats` route |
| Run `supabase db reset` + verify all triggers + verify backfill | Local | — |

### Phase 1 — API

| Task | File | Notes |
|---|---|---|
| **Fix `GET /api/kudos` to handle `sort=heart_count`** | `src/app/api/kudos/route.ts` | Add `if (sort === 'heart_count') .order('heart_count', {ascending: false})` branch; Highlight re-fetches depend on this |
| Create `GET /api/kudos/highlight` route | `src/app/api/kudos/highlight/route.ts` | New dedicated endpoint; `ORDER BY heart_count DESC LIMIT 5`; optional `hashtag`, `department` |
| **Add self-like guard** to `POST /api/kudos/[id]/like` | `src/app/api/kudos/[id]/like/route.ts` | Check `kudos.sender_id === user.id` → 403 before toggle; then call `toggle_kudos_like` RPC |
| Update `/api/me/kudos-stats` to call `get_kudos_stats` RPC | `src/app/api/me/kudos-stats/route.ts` | Replaces broken PostgREST join for `hearts_received`; remove dead `_` slot |
| Add `GET /api/profiles/leaderboard/tier-upgrades` | `src/app/api/profiles/leaderboard/route.ts` | `SELECT ... FROM profiles WHERE kudos_star_tier IS NOT NULL ORDER BY kudos_star_tier_updated_at DESC LIMIT 10` |
| Create `src/services/kudos.service.ts` | New file | Centralize business logic; move heavy query building out of route handlers |

### Phase 2 — Components

| Task | Component | Priority | Audit Finding |
|---|---|---|---|
| **Pass `currentUserId` from page → KudosClient → cards** | `kudos/page.tsx`, `KudosClient.tsx` | P1 | `currentUserId` never propagated anywhere |
| **Fix SSR query to include `danh_hieu`, `image_urls`, `is_anonymous`, `anonymous_name`** | `kudos/page.tsx` (`KUDOS_QUERY`) | P1 | Initial render missing these fields |
| Add `currentUserId` prop + disable heart button when `isSender` | `KudoCard.tsx` | P1 | No self-like guard exists |
| Fix content truncation: confirm `line-clamp-3` → change to `line-clamp-5` | `KudoCard.tsx` | P1 | Currently `line-clamp-3` |
| **Add `onClick` handler on hashtag `<span>` elements** | `KudoCard.tsx` | P2 | Hashtags are plain `<span>`, no filter action |
| `line-clamp-3` already correct; **fix message rendering to use `dangerouslySetInnerHTML`+DOMPurify** | `KudoHighlightCard.tsx` | P1 | Plain text loses rich editor HTML |
| **Add `danh_hieu` badge display** | `KudoHighlightCard.tsx` | P2 | Missing from Highlight card |
| Add `currentUserId` prop + disable heart | `KudoHighlightCard.tsx` | P1 | No self-like guard |
| **Add sender/receiver `<Link>` navigation** | `KudoHighlightCard.tsx` | P2 | Avatar/name not clickable |
| Confirm `Xem chi tiết` button present ✅ | `KudoHighlightCard.tsx` | — | Already exists |
| Shared `currentUserId` state + pass to cards | `KudosClient.tsx` | P1 | Missing entirely |
| Shared filter state (hashtag + department) flow to both sections | `KudosClient.tsx` | P2 | Already done for AllKudos; HighlightSection drives parent |
| **Fix post-send stale feed**: after `handleSendSuccess` do a fresh cursor-reset fetch | `KudosClient.tsx` / `AllKudosSection.tsx` | P2 | Currently remounts with old SSR data |
| Fetch `GET /api/kudos/highlight` on filter change (after `sort` API fix) | `HighlightSection.tsx` | P2 | Current call ignores sort |
| **Fix `IntersectionObserver` useEffect dependency array** (`[fetchMore]`) | `AllKudosSection.tsx` | P1 | Missing deps → re-attach every render |
| **Wrap `fetchMore` in `useCallback`** | `AllKudosSection.tsx` | P1 | Unstable reference causes infinite re-render |
| **Fix filter change to trigger immediate re-fetch** (not rely on next scroll) | `AllKudosSection.tsx` | P2 | Filter change resets to stale SSR data |
| Add D.2 "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" list | `KudosSidebar.tsx` | P2 | Entirely absent |
| Verify disabled state "Mở quà" when `secret_box_unopened = 0` | `KudosSidebar.tsx` | P2 | — |
| **Fix `kudos_id` mapping to use `text` key not array index** | `SpotlightBoard.tsx` | P2 | d3-cloud doesn't preserve input order |
| `aria-hidden="true"` on decorative icons | `KudoHighlightCard.tsx` / `KudoCard.tsx` | P3 | — |
| Create `ProfilePreviewPopover` | `ProfilePreviewPopover.tsx` (NEW) | P3 | — |
| Add hover on avatars/names | `KudoCard.tsx`, `KudoHighlightCard.tsx` | P3 | — |

### Phase 3 — i18n + Polish

| Task | File | Priority |
|---|---|---|
| Add VN/EN keys: D.2 title, "Thăng hạng", empty states | `messages/vi.json`, `messages/en.json` | P2 |
| Verify responsive CSS (sidebar collapse tablet/mobile) | `KudosSidebar.tsx`, `AllKudosSection.tsx` | P2 |
| Verify `position: sticky` sidebar | `KudosSidebar.tsx` | P2 |
| `aria-label` for heart buttons, `aria-pressed` state | `KudoCard.tsx`, `KudoHighlightCard.tsx` | P3 |

---

## API Contracts

### `GET /api/kudos/highlight`

```typescript
// Query params
{ hashtag?: string, department?: string }

// Response 200
{
  data: KudoWithLike[]  // max 5 items, ORDER BY heart_count DESC
}

type KudoWithLike = {
  id: string
  sender: { id: string; full_name: string; avatar_url: string; kudos_star_tier: number | null; department: string }
  receiver: { id: string; full_name: string; avatar_url: string; kudos_star_tier: number | null; department: string }
  message: string
  hashtags: string[]
  heart_count: number
  liked_by_me: boolean
  created_at: string
  image_urls: string[]
  danh_hieu: string | null
}
```

### `POST /api/kudos/:id/like`

```typescript
// Request: no body (uses session for user_id)

// Response 200
{ liked: boolean; count: number }

// Response 403 — self-like attempt
{ error: 'SELF_LIKE_NOT_ALLOWED' }
```

### `GET /api/me/kudos-stats`

```typescript
// Response 200
{
  kudos_received: number
  kudos_sent: number
  hearts_received: number
  secret_box_opened: number
  secret_box_unopened: number
}
```

### `GET /api/profiles/leaderboard/tier-upgrades`

```typescript
// Response 200
{
  data: Array<{
    id: string
    full_name: string
    avatar_url: string
    kudos_star_tier: 1 | 2 | 3
    kudos_star_tier_updated_at: string
    department: string
  }>  // max 10 items
}
```

---

## DB Migration Skeleton

```sql
-- supabase/migrations/20260327000000_kudos_special_days.sql

-- 1. special_days table
CREATE TABLE public.special_days (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL UNIQUE,
  created_by  uuid REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.special_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage special_days"
  ON public.special_days FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Authenticated can read special_days"
  ON public.special_days FOR SELECT
  USING (auth.role() = 'authenticated');

-- 2. kudos_likes.is_special_day
ALTER TABLE public.kudos_likes
  ADD COLUMN IF NOT EXISTS is_special_day BOOLEAN NOT NULL DEFAULT false;

-- 3. profiles.hearts_received + kudos_star_tier_updated_at
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hearts_received INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kudos_star_tier_updated_at timestamptz;

-- 3a. Backfill hearts_received from existing likes
-- (each like on a kudos adds 1 heart to that kudos's sender)
UPDATE public.profiles p
SET hearts_received = (
  SELECT COUNT(*)::INTEGER
  FROM public.kudos_likes kl
  JOIN public.kudos k ON k.id = kl.kudos_id
  WHERE k.sender_id = p.id
);

-- 3b. Backfill kudos_star_tier_updated_at for profiles that already have a tier
UPDATE public.profiles
SET kudos_star_tier_updated_at = now()
WHERE kudos_star_tier IS NOT NULL AND kudos_star_tier_updated_at IS NULL;

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS idx_kudos_sender_id ON public.kudos(sender_id);
CREATE INDEX IF NOT EXISTS idx_kudos_receiver_id ON public.kudos(receiver_id);
CREATE INDEX IF NOT EXISTS idx_kudos_receiver_created ON public.kudos(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kudos_heart_count ON public.kudos(heart_count DESC);

-- 5. toggle_kudos_like RPC
CREATE OR REPLACE FUNCTION public.toggle_kudos_like(
  p_kudos_id UUID,
  p_user_id  UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id       UUID;
  v_is_special_day  BOOLEAN;
  v_existing_like   public.kudos_likes%ROWTYPE;
  v_new_count       INTEGER;
  v_liked           BOOLEAN;
  v_heart_delta     INTEGER;
BEGIN
  -- Self-like guard
  SELECT sender_id INTO v_sender_id FROM public.kudos WHERE id = p_kudos_id FOR NO KEY UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'KUDOS_NOT_FOUND';
  END IF;
  IF v_sender_id = p_user_id THEN
    RAISE EXCEPTION 'SELF_LIKE_NOT_ALLOWED';
  END IF;

  -- Check special day
  SELECT EXISTS(SELECT 1 FROM public.special_days WHERE date = CURRENT_DATE)
    INTO v_is_special_day;

  -- Check existing like
  SELECT * INTO v_existing_like
    FROM public.kudos_likes
    WHERE kudos_id = p_kudos_id AND user_id = p_user_id;

  IF FOUND THEN
    -- Unlike: remove and reverse heart delta using STORED is_special_day
    v_heart_delta := CASE WHEN v_existing_like.is_special_day THEN -2 ELSE -1 END;
    DELETE FROM public.kudos_likes WHERE kudos_id = p_kudos_id AND user_id = p_user_id;
    v_liked := false;
  ELSE
    -- Like: insert with current special-day status
    v_heart_delta := CASE WHEN v_is_special_day THEN 2 ELSE 1 END;
    INSERT INTO public.kudos_likes (kudos_id, user_id, is_special_day)
      VALUES (p_kudos_id, p_user_id, v_is_special_day);
    v_liked := true;
  END IF;

  -- Update kudos.heart_count
  UPDATE public.kudos SET heart_count = heart_count + v_heart_delta WHERE id = p_kudos_id
    RETURNING heart_count INTO v_new_count;

  -- Update sender's hearts_received (floor at 0)
  UPDATE public.profiles
    SET hearts_received = GREATEST(0, hearts_received + v_heart_delta)
    WHERE id = v_sender_id;

  RETURN json_build_object('liked', v_liked, 'count', v_new_count);
END;
$$;

-- 6. get_kudos_stats RPC
CREATE OR REPLACE FUNCTION public.get_kudos_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'kudos_received',     (SELECT COUNT(*) FROM public.kudos WHERE receiver_id = p_user_id),
    'kudos_sent',         (SELECT COUNT(*) FROM public.kudos WHERE sender_id = p_user_id),
    'hearts_received',    (SELECT hearts_received FROM public.profiles WHERE id = p_user_id),
    'secret_box_opened',  (SELECT COUNT(*) FROM public.secret_boxes WHERE user_id = p_user_id AND is_opened = true),
    'secret_box_unopened',(SELECT COUNT(*) FROM public.secret_boxes WHERE user_id = p_user_id AND is_opened = false)
  );
$$;

-- 7. Extend existing trigger to also update kudos_star_tier_updated_at
-- NOTE: Trigger function already exists from migration 20260323000001.
-- We DROP + recreate to add kudos_star_tier_updated_at logic.
CREATE OR REPLACE FUNCTION public.update_kudos_star_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_tier  INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.kudos WHERE receiver_id = NEW.receiver_id;
  v_tier := CASE
    WHEN v_count >= 50 THEN 3
    WHEN v_count >= 20 THEN 2
    WHEN v_count >= 10 THEN 1
    ELSE NULL
  END;
  UPDATE public.profiles
    SET
      kudos_star_tier = v_tier,
      -- Only update timestamp when tier actually changes
      kudos_star_tier_updated_at = CASE
        WHEN v_tier IS DISTINCT FROM kudos_star_tier THEN now()
        ELSE kudos_star_tier_updated_at
      END
    WHERE id = NEW.receiver_id;
  RETURN NEW;
END;
$$;
-- Trigger already exists; replacing function is sufficient (trigger binds to function by name)
```

---

## Implementation Order (recommended)

```
Phase 0 → Migration
  (special_days table, is_special_day col, hearts_received col, kudos_star_tier_updated_at col,
   backfill data, extend trigger, add indexes, create RPCs)
    ↓
Phase 1a → Fix GET /api/kudos sort=heart_count    [unblocks HighlightSection correct sort]
Phase 1b → Add self-like guard to /api/kudos/[id]/like + call toggle_kudos_like RPC  [P1 guard]
Phase 1c → Fix /api/me/kudos-stats → get_kudos_stats RPC  [fixes broken hearts_received query]
Phase 1d → Create /api/kudos/highlight            [dedicated highlight endpoint]
Phase 1e → Create /api/profiles/leaderboard/tier-upgrades  [D.2 data]
    ↓
Phase 2a → page.tsx: fix KUDOS_QUERY + propagate currentUserId
Phase 2b → KudosClient: pass currentUserId to cards; fix stale post-send feed
Phase 2c → AllKudosSection: fix IntersectionObserver deps + useCallback fetchMore + filter re-fetch
Phase 2d → KudoCard: currentUserId prop + self-like disable + hashtag onClick
Phase 2e → KudoHighlightCard: DOMPurify message render + danh_hieu + sender/receiver links + self-like
Phase 2f → HighlightSection: switch to /api/kudos/highlight endpoint
Phase 2g → KudosSidebar: add D.2 leaderboard section
Phase 2h → SpotlightBoard: fix kudos_id mapping by text key (not array index)
    ↓
Phase 3a → i18n keys (D.2 title, empty states, new toasts)
Phase 3b → ProfilePreviewPopover (NEW component)
Phase 3c → Hover integration on avatars/names
Phase 3d → Accessibility pass (aria-hidden, aria-label, aria-pressed)
Phase 3e → Responsive QA
```

---

## Review Summary (2026-03-27)

### Findings Incorporated

| # | Finding | Severity | Action Taken |
|---|---|---|---|
| R-01 | `sort=heart_count` silently ignored by GET /api/kudos | Critical | Added Phase 1a fix task |
| R-02 | No self-like guard anywhere (API + UI) | Critical | Added Phase 1b + Phase 2d/2e tasks |
| R-03 | `currentUserId` never propagated to any component | Critical | Added Phase 2a/2b tasks; updated component task table |
| R-04 | SSR query missing `danh_hieu`, `image_urls`, `is_anonymous`, `anonymous_name` | High | Added Phase 2a fix task |
| R-05 | `IntersectionObserver` missing dep array → re-attach every render | High | Added Phase 2c fix tasks |
| R-06 | Post-send remount shows stale SSR data | High | Added Phase 2b/2c note |
| R-07 | `hearts_received` PostgREST join syntax broken → returns 0 | High | Added Phase 1c fix; replaced by RPC |
| R-08 | Hashtag `<span>` has no onClick → filter doesn't work on click | High | Added Phase 2d task |
| R-09 | `KudoHighlightCard` renders message as plain text (loses HTML) | High | Added Phase 2e fix |
| R-10 | `KudoHighlightCard` missing `danh_hieu` display | Medium | Added Phase 2e task |
| R-11 | `SpotlightBoard` maps `kudos_id` by array index (unstable) | Medium | Added Phase 2h fix |
| R-12 | D.2 leaderboard entirely absent from `KudosSidebar` | Medium | Confirmed in Phase 2g |
| R-13 | `update_kudos_star_tier` trigger already exists (migration 001) | Low | Updated Phase 0 to DROP+recreate, not create-new |
| R-14 | No index on `kudos(sender_id)`, `kudos(receiver_id)` | Low | Added to Phase 0 migration tasks |
