# Tasks: Sun* Kudos - Live Board

**Frame**: `2940:13431 — Sun* Kudos - Live Board`
**MoMorph Frame ID**: `6384`
**Prerequisites**: plan.md ✅ (Reviewed), spec.md ✅ (Reviewed)
**Stack**: Next.js 15 App Router · React 19 · Supabase · Cloudflare Workers

---

## Task Format

```
- [ ] T### [P?] [US?] Description | file/path.ts
```

- **[P]**: Can run in parallel with other `[P]` tasks in the same phase (different files, no dependencies)
- **[US#]**: Which user story this belongs to (mirrors `spec.md`)
- **|**: Primary file affected by this task

---

## Phase 0: DB Migration (Prerequisite — blocks everything)

**Purpose**: Add the DB objects that all API and component work depends on.

**⚠️ CRITICAL**: No Phase 1+ work can begin until this migration is applied and verified.

- [ ] T001 Create migration file `20260327000000_kudos_special_days.sql` | `supabase/migrations/20260327000000_kudos_special_days.sql`
- [ ] T002 Add `special_days` table + RLS (admin write / authenticated read) | same migration
- [ ] T003 [P] Add `kudos_likes.is_special_day BOOLEAN DEFAULT false` | same migration
- [ ] T004 [P] Add `profiles.hearts_received INTEGER DEFAULT 0` | same migration
- [ ] T005 [P] Add `profiles.kudos_star_tier_updated_at TIMESTAMPTZ` | same migration
- [ ] T006 Backfill `hearts_received` from existing `kudos_likes JOIN kudos` | same migration
- [ ] T007 Backfill `kudos_star_tier_updated_at = now()` for profiles with existing tier | same migration
- [ ] T008 Add indexes: `kudos(sender_id)`, `kudos(receiver_id)`, `kudos(receiver_id, created_at DESC)`, `kudos(heart_count DESC)` | same migration
- [ ] T009 Create `toggle_kudos_like(p_kudos_id, p_user_id)` RPC — atomic like/unlike; self-like guard; special-day double-heart; updates `kudos.heart_count` + `profiles.hearts_received` | same migration
- [ ] T010 Create `get_kudos_stats(p_user_id)` RPC — returns `kudos_received`, `kudos_sent`, `hearts_received`, `secret_box_opened`, `secret_box_unopened` | same migration
- [ ] T011 `CREATE OR REPLACE FUNCTION update_kudos_star_tier()` to also set `kudos_star_tier_updated_at` (tier-change detection) — trigger already exists, only function needs replacing | same migration
- [ ] T012 Run `supabase db reset`; verify all triggers fire; verify backfill row counts; smoke-test RPCs via Supabase Studio

**Checkpoint**: Migration applied — all Phase 1+ tasks can now begin in parallel

---

## Phase 1: API Layer (Priority: P1 — fix bugs before touching UI)

**Purpose**: Ensure all API routes return correct, secure data.

### Phase 1a — Critical Bug Fixes (R-01, R-02, R-07)

- [ ] T013 [US1] **Fix `GET /api/kudos` to handle `sort=heart_count` param** — add `.order('heart_count', { ascending: false })` branch; currently silently ignored | `src/app/api/kudos/route.ts`
- [ ] T014 [US3] **Add self-like guard to `POST /api/kudos/[id]/like`** — fetch `kudos.sender_id` → return 403 `{ error: 'SELF_LIKE_NOT_ALLOWED' }` if `sender_id === user.id`; then refactor to call `toggle_kudos_like` RPC | `src/app/api/kudos/[id]/like/route.ts`
- [ ] T015 [US6] **Fix `/api/me/kudos-stats` to call `get_kudos_stats` RPC** — replaces broken PostgREST join syntax for `hearts_received`; remove dead `_` slot in `Promise.all` | `src/app/api/me/kudos-stats/route.ts`

### Phase 1b — New Endpoints

- [ ] T016 [P] [US1] Create `GET /api/kudos/highlight` route — `ORDER BY heart_count DESC LIMIT 5`; optional `hashtag`, `department` query params; returns `KudoWithLike[]` | `src/app/api/kudos/highlight/route.ts`
- [ ] T017 [P] [US6] Create `GET /api/profiles/leaderboard/tier-upgrades` route — `SELECT * FROM profiles WHERE kudos_star_tier IS NOT NULL ORDER BY kudos_star_tier_updated_at DESC LIMIT 10` | `src/app/api/profiles/leaderboard/route.ts`

### Phase 1c — Service Layer

- [ ] T018 [P] Create `src/services/kudos.service.ts` — centralize query-building logic extracted from route handlers | `src/services/kudos.service.ts`

**Checkpoint**: API layer correct — UI work can now proceed

---

## Phase 2: Core Components — P1 Bugs (Priority: P1)

**Purpose**: Fix critical rendering and data propagation bugs that break core functionality.

### Phase 2a — Data Propagation (R-03, R-04)

- [ ] T019 [US1] [US2] [US3] **Fix `KUDOS_QUERY` in `page.tsx`** — add missing fields `danh_hieu`, `image_urls`, `is_anonymous`, `anonymous_name` to SSR query | `src/app/(dashboard)/kudos/page.tsx`
- [ ] T020 [US3] **Propagate `currentUserId` from `page.tsx` → `KudosClient`** — compute `userId` from `getUser()` (already done in file) and pass as `currentUserId` prop | `src/app/(dashboard)/kudos/page.tsx`
- [ ] T021 [US3] **Add `currentUserId` prop to `KudosClient.tsx`** — thread it down to `KudoCard` and `KudoHighlightCard` through `HighlightSection` and `AllKudosSection` | `src/components/kudos/KudosClient.tsx`

### Phase 2b — KudoCard Fixes (R-02, R-08)

- [ ] T022 [US2] [US3] **Add `currentUserId` prop to `KudoCard`**; disable heart button when `kudos.sender_id === currentUserId` | `src/components/kudos/KudoCard.tsx`
- [ ] T023 [US2] Fix content truncation: change `line-clamp-3` → `line-clamp-5` for message body | `src/components/kudos/KudoCard.tsx`
- [ ] T024 [US4] **Add `onClick` handler on hashtag `<span>` elements** — call `onFilterChange({ hashtag })` on click | `src/components/kudos/KudoCard.tsx`

### Phase 2c — KudoHighlightCard Fixes (R-09, R-10)

- [ ] T025 [US1] [US3] **Fix message rendering: use `dangerouslySetInnerHTML` + `DOMPurify.sanitize()`** — currently plain text loses TipTap HTML | `src/components/kudos/KudoHighlightCard.tsx`
- [ ] T026 [US1] **Add `danh_hieu` badge display** — render below sender name using same badge style as `KudoCard` | `src/components/kudos/KudoHighlightCard.tsx`
- [ ] T027 [US1] [US3] **Add `currentUserId` prop**; disable heart button when `kudos.sender_id === currentUserId` | `src/components/kudos/KudoHighlightCard.tsx`
- [ ] T028 [US1] Add `<Link>` wrapper around sender and receiver avatar/name for profile navigation | `src/components/kudos/KudoHighlightCard.tsx`

### Phase 2d — AllKudosSection Bug Fixes (R-05, R-06)

- [ ] T029 [US2] **Wrap `fetchMore` in `useCallback`** — current unstable reference causes `useEffect` to re-subscribe every render | `src/components/kudos/AllKudosSection.tsx`
- [ ] T030 [US2] **Fix `useEffect` dependency array for `IntersectionObserver`** — add `[fetchMore]` dep; currently re-attaches on every render | `src/components/kudos/AllKudosSection.tsx`
- [ ] T031 [US2] [US4] **Fix filter change to trigger fresh cursor-reset fetch** — currently resets to stale SSR data; should call `fetchMore` with `cursor=null` when `hashtag`/`department` props change | `src/components/kudos/AllKudosSection.tsx`

### Phase 2e — Post-send Stale Feed (R-06)

- [ ] T032 [US5] [US2] **Fix post-send stale feed in `KudosClient`** — after `handleSendSuccess` do a fresh cursor-reset fetch instead of relying on SSR remount (`kudosKey++`) | `src/components/kudos/KudosClient.tsx`

**Checkpoint**: All P1 bugs fixed — test like, filter, send flows end-to-end

---

## Phase 3: Core Components — P2 Features

**Purpose**: Implement remaining required features from spec (D.2 sidebar, Spotlight fix, Highlight update).

### Phase 3a — Highlight Section

- [ ] T033 [US1] [US4] **Switch `HighlightSection` to fetch `GET /api/kudos/highlight`** on mount and filter change — replace existing call to `/api/kudos?sort=heart_count` | `src/components/kudos/HighlightSection.tsx`

### Phase 3b — Sidebar D.2 (R-12)

- [ ] T034 [US6] **Add D.2 "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" section to `KudosSidebar`** — fetch `GET /api/profiles/leaderboard/tier-upgrades`; render list of 10 profiles with name, avatar, tier badge; empty state: "Chưa có dữ liệu" | `src/components/kudos/KudosSidebar.tsx`
- [ ] T035 [US6] Verify "Mở quà" button disabled state when `secret_box_unopened === 0` | `src/components/kudos/KudosSidebar.tsx`

### Phase 3c — SpotlightBoard (R-11)

- [ ] T036 [US7] **Fix `SpotlightBoard` `kudos_id` mapping** — build a `Map<text, kudos_id>` from input words before `d3-cloud` layout, then look up by `word.text` in the rendered callback (not array index) | `src/components/kudos/SpotlightBoard.tsx`

**Checkpoint**: All P2 features complete — full spec feature-coverage achieved

---

## Phase 4: i18n + Accessibility + Polish (Priority: P2/P3)

**Purpose**: Translation completeness, a11y compliance, responsive verification.

### Phase 4a — i18n

- [ ] T037 [P] Add VN translation keys for D.2 section title ("SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT"), empty state, new toast messages | `messages/vi.json`
- [ ] T038 [P] Add EN translation keys (matching VN additions) | `messages/en.json`

### Phase 4b — Accessibility

- [ ] T039 [P] Add `aria-hidden="true"` to all decorative icons (sent arrow, dividers) in `KudoCard` + `KudoHighlightCard` | `src/components/kudos/KudoCard.tsx`, `src/components/kudos/KudoHighlightCard.tsx`
- [ ] T040 [P] Add `aria-label` ("Thích kudos này") + `aria-pressed={liked}` to heart buttons in `KudoCard` + `KudoHighlightCard` | same files

### Phase 4c — Profile Hover Preview (US8 — P3)

- [ ] T041 [P] [US8] Create `ProfilePreviewPopover` component — props: `userId`, `anchorElement`; fetch `/api/profiles/search?id={userId}`; render avatar, name, tier, dept, stats snippet | `src/components/kudos/ProfilePreviewPopover.tsx`
- [ ] T042 [US8] Add `onMouseEnter`/`onMouseLeave` hover trigger on avatar + name in `KudoCard` and `KudoHighlightCard` to open `ProfilePreviewPopover` | `src/components/kudos/KudoCard.tsx`, `src/components/kudos/KudoHighlightCard.tsx`

### Phase 4d — Responsive QA

- [ ] T043 Verify Desktop (≥1280px) layout: 2-column (main + sidebar), sidebar sticky | Manual QA
- [ ] T044 Verify Tablet (768px) layout: sidebar collapses or moves below | Manual QA
- [ ] T045 Verify Mobile (375px) layout: single column, horizontal scroll-safe | Manual QA
- [ ] T046 Verify `position: sticky` sidebar does not overflow on short viewport heights | Manual QA

**Checkpoint**: All tasks complete — ready for E2E test pass

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 0 (Migration)
    ↓  BLOCKS all downstream
Phase 1a (sort fix, self-like guard, stats RPC)  ← fix bugs before touching UI
Phase 1b (highlight route, leaderboard route)    ← can run in parallel with 1a
Phase 1c (kudos.service.ts)                      ← can run in parallel with 1a/1b
    ↓
Phase 2a (KUDOS_QUERY + currentUserId propagation)  ← unblocks 2b/2c/2d
Phase 2b (KudoCard fixes)          [P] ← can run parallel with 2c once 2a done
Phase 2c (KudoHighlightCard fixes) [P] ← can run parallel with 2b once 2a done
Phase 2d (AllKudosSection fixes)   [P] ← can run parallel with 2b/2c
Phase 2e (Post-send stale fix)     [P] ← can run parallel with 2b/2c/2d
    ↓
Phase 3a (HighlightSection → /api/kudos/highlight)  ← requires T016 (Phase 1b)
Phase 3b (KudosSidebar D.2)        ← requires T017 (Phase 1b)
Phase 3c (SpotlightBoard kudos_id) ← no API dependency
    ↓
Phase 4a (i18n)         [P] ← can run parallel with 4b/4c
Phase 4b (a11y)         [P]
Phase 4c (hover popover)[P]
Phase 4d (Responsive QA)           ← after all 4a/4b/4c done
```

### Critical Path

The critical path is: **T001–T012 (migration) → T013 (sort fix) → T019–T021 (currentUserId) → T029–T031 (AllKudos deps) → T033 (HighlightSection re-fetch) → T034 (D.2 sidebar)**

### Review Findings Traceability

| Finding | Related Tasks |
|---|---|
| R-01: `sort` ignored | T013, T033 (T016 enables dedicated route) |
| R-02: No self-like guard | T014, T022, T023, T027 |
| R-03: `currentUserId` not propagated | T019, T020, T021, T022, T027 |
| R-04: SSR query missing fields | T019 |
| R-05: IntersectionObserver bug | T029, T030, T031 |
| R-06: Stale post-send feed | T032 |
| R-07: Broken `hearts_received` query | T010, T015 |
| R-08: Hashtag no onClick | T024 |
| R-09: Highlight plain text message | T025 |
| R-10: Highlight missing `danh_hieu` | T026 |
| R-11: Spotlight index mapping | T036 |
| R-12: D.2 sidebar absent | T034 |
| R-13: Trigger already exists | T011 (CREATE OR REPLACE only) |
| R-14: Missing DB indexes | T008 |
