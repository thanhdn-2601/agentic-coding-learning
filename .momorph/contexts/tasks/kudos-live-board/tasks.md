# Task Breakdown: Sun* Kudos - Live Board

**Frame ID**: `2940:13431` | **MoMorph Frame ID**: `6384`
**Plan**: `.momorph/contexts/specs/kudos-live-board/plan.md`
**Spec**: `.momorph/contexts/specs/kudos-live-board/spec.md`
**Created**: 2026-03-27

---

## Priority & Sequencing

```
P0 (Blocking)  → T01                           (migration — sequential; blocks everything)
P1 (API)       → T02, T03, T04                 (critical bug fixes — sequential or parallel)
               → T05, T06                      (new routes — parallel with each other)
P2 (Core UI)   → T07 → T08                     (data propagation — sequential)
               → T09, T10, T11 (parallel after T08)
P3 (Features)  → T12, T13, T14 (parallel after P1 routes done)
P4 (Polish)    → T15, T16, T17 (parallel after P2/P3 done)
               → T18                           (QA — after all P4 done)
```

**Dependency graph**:

```
T01 (migration)
  └→ T02 (sort fix)
  └→ T03 (self-like guard + RPC)        ← most important security fix
  └→ T04 (stats RPC)
  └→ T05 (highlight route)
  └→ T06 (leaderboard route)
T05 → T12 (HighlightSection switches to new endpoint)
T06 → T13 (KudosSidebar fetches D.2 data)
T07 (page.tsx: query fix + userId)
  └→ T08 (KudosClient: thread userId)
       └→ T09 (AllKudosSection fixes)
       └→ T10 (KudoCard fixes)
       └→ T11 (KudoHighlightCard fixes)
T09, T10, T11 → T15, T16, T17
T15, T16, T17 → T18 (QA)
```

**User Stories coverage**:

| User Story | Tasks |
|---|---|
| US1 — Xem Live Board | T01, T05, T07, T08, T11, T12 |
| US2 — Gửi Kudos (send flow) | T07, T08, T09 |
| US3 — Highlight Carousel | T01, T03, T05, T07, T10, T11, T12 |
| US3b — Special Day double-heart | T01, T03 |
| US4 — Lọc Hashtag & Phòng ban | T09, T10, T12 |
| US5 — All Kudos infinite scroll | T09, T10 |
| US6 — Sidebar stats & Secret Box | T01, T04, T06, T13 |
| US7 — Spotlight Board | T14 |
| US8 — Hover Profile Preview | T17 |

---

## P0 — Migration (must complete first, blocks everything)

### T01 · Tạo Supabase migration `20260327000000_kudos_special_days.sql`

| | |
|---|---|
| **Type** | Database |
| **File** | `supabase/migrations/20260327000000_kudos_special_days.sql` |
| **Effort** | M |
| **Blocks** | T02, T03, T04, T05, T06 |
| **Depends on** | — |

**Action**: Tạo file migration mới với nội dung sau:

```sql
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

-- 3. profiles columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hearts_received INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kudos_star_tier_updated_at timestamptz;

-- 3a. Backfill hearts_received (1 like = 1 heart, đảo tim cho sender)
UPDATE public.profiles p
SET hearts_received = (
  SELECT COUNT(*)::INTEGER
  FROM public.kudos_likes kl
  JOIN public.kudos k ON k.id = kl.kudos_id
  WHERE k.sender_id = p.id
);

-- 3b. Backfill kudos_star_tier_updated_at
UPDATE public.profiles
SET kudos_star_tier_updated_at = now()
WHERE kudos_star_tier IS NOT NULL AND kudos_star_tier_updated_at IS NULL;

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS idx_kudos_sender_id      ON public.kudos(sender_id);
CREATE INDEX IF NOT EXISTS idx_kudos_receiver_id    ON public.kudos(receiver_id);
CREATE INDEX IF NOT EXISTS idx_kudos_receiver_created ON public.kudos(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kudos_heart_count    ON public.kudos(heart_count DESC);

-- 5. toggle_kudos_like RPC (atomic — replaces manual insert/delete in like route)
CREATE OR REPLACE FUNCTION public.toggle_kudos_like(
  p_kudos_id UUID,
  p_user_id  UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sender_id       UUID;
  v_is_special_day  BOOLEAN;
  v_existing_like   public.kudos_likes%ROWTYPE;
  v_new_count       INTEGER;
  v_liked           BOOLEAN;
  v_heart_delta     INTEGER;
BEGIN
  SELECT sender_id INTO v_sender_id
    FROM public.kudos WHERE id = p_kudos_id FOR NO KEY UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'KUDOS_NOT_FOUND'; END IF;
  IF v_sender_id = p_user_id THEN RAISE EXCEPTION 'SELF_LIKE_NOT_ALLOWED'; END IF;

  SELECT EXISTS(SELECT 1 FROM public.special_days WHERE date = CURRENT_DATE) INTO v_is_special_day;

  SELECT * INTO v_existing_like
    FROM public.kudos_likes WHERE kudos_id = p_kudos_id AND user_id = p_user_id;

  IF FOUND THEN
    v_heart_delta := CASE WHEN v_existing_like.is_special_day THEN -2 ELSE -1 END;
    DELETE FROM public.kudos_likes WHERE kudos_id = p_kudos_id AND user_id = p_user_id;
    v_liked := false;
  ELSE
    v_heart_delta := CASE WHEN v_is_special_day THEN 2 ELSE 1 END;
    INSERT INTO public.kudos_likes (kudos_id, user_id, is_special_day)
      VALUES (p_kudos_id, p_user_id, v_is_special_day);
    v_liked := true;
  END IF;

  UPDATE public.kudos SET heart_count = heart_count + v_heart_delta WHERE id = p_kudos_id
    RETURNING heart_count INTO v_new_count;

  UPDATE public.profiles
    SET hearts_received = GREATEST(0, hearts_received + v_heart_delta)
    WHERE id = v_sender_id;

  RETURN json_build_object('liked', v_liked, 'count', v_new_count);
END;
$$;

-- 6. get_kudos_stats RPC (replaces broken PostgREST join in kudos-stats route)
CREATE OR REPLACE FUNCTION public.get_kudos_stats(p_user_id UUID)
RETURNS JSON LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_build_object(
    'kudos_received',      (SELECT COUNT(*) FROM public.kudos WHERE receiver_id = p_user_id),
    'kudos_sent',          (SELECT COUNT(*) FROM public.kudos WHERE sender_id = p_user_id),
    'hearts_received',     (SELECT hearts_received FROM public.profiles WHERE id = p_user_id),
    'secret_box_opened',   (SELECT COUNT(*) FROM public.secret_boxes WHERE user_id = p_user_id AND is_opened = true),
    'secret_box_unopened', (SELECT COUNT(*) FROM public.secret_boxes WHERE user_id = p_user_id AND is_opened = false)
  );
$$;

-- 7. Extend trigger update_kudos_star_tier to also set kudos_star_tier_updated_at
-- NOTE: Trigger already exists from migration 20260323000001. Only the FUNCTION needs replacing.
CREATE OR REPLACE FUNCTION public.update_kudos_star_tier()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
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
    SET kudos_star_tier = v_tier,
        kudos_star_tier_updated_at = CASE
          WHEN v_tier IS DISTINCT FROM kudos_star_tier THEN now()
          ELSE kudos_star_tier_updated_at
        END
    WHERE id = NEW.receiver_id;
  RETURN NEW;
END;
$$;
-- (Trigger binding already exists — replacing function is sufficient)
```

**Apply locally**:
```bash
supabase db reset
# hoặc: supabase migration up
```

**Done when**:
- `supabase db diff` trả về sạch (không còn unresolved)
- Bảng `special_days` tồn tại trong local Supabase
- Column `kudos_likes.is_special_day` default `false`
- Columns `profiles.hearts_received` và `profiles.kudos_star_tier_updated_at` tồn tại
- `SELECT toggle_kudos_like('<id>', '<other_user>')` trả về `{ liked: true, count: 1 }`
- `SELECT toggle_kudos_like('<id>', '<same_sender>')` raise exception `SELF_LIKE_NOT_ALLOWED`
- `SELECT get_kudos_stats('<user_id>')` trả về JSON đầy đủ 5 keys
- `EXPLAIN ANALYZE` trên query filter by `sender_id` / `receiver_id` dùng indexes mới

---

## P1 — API Bug Fixes (Priority: P1 Critical)

### T02 · Sửa `GET /api/kudos` bỏ qua param `sort=heart_count` *(R-01)*

| | |
|---|---|
| **Type** | API (MODIFY) |
| **File** | `src/app/api/kudos/route.ts` |
| **Effort** | XS |
| **Blocks** | T12 (HighlightSection gọi endpoint này cho đến khi T05 xong) |
| **Depends on** | T01 |

**Vấn đề**: Param `sort=heart_count` đang bị **silently ignore** — mọi query đều trả về `ORDER BY created_at DESC`. Highlight section do đó không bao giờ hiển thị kudos theo tim.

**Action**: Tìm đoạn build query trong GET handler và thêm branch:

```typescript
// Hiện tại — chỉ 1 dòng order:
query = query.order('created_at', { ascending: false });

// Sửa thành:
const sort = searchParams.get('sort');
if (sort === 'heart_count') {
  query = query.order('heart_count', { ascending: false }).order('created_at', { ascending: false });
} else {
  query = query.order('created_at', { ascending: false });
}
```

**Done when**: `GET /api/kudos?sort=heart_count` trả về kudos sắp xếp `heart_count DESC`; không truyền `sort` vẫn trả về `created_at DESC` như cũ.

---

### T03 · Thêm self-like guard + call `toggle_kudos_like` RPC *(R-02)*

| | |
|---|---|
| **Type** | API (MODIFY) |
| **File** | `src/app/api/kudos/[id]/like/route.ts` |
| **Effort** | S |
| **Blocks** | T10 (UI guard phụ thuộc API guard) |
| **Depends on** | T01 (RPC `toggle_kudos_like` phải tồn tại) |

**Vấn đề**: Route hiện tại (1) không có self-like guard, (2) dùng manual insert/delete thay vì RPC — không atomic, không handle special days.

**Action**: Rewrite handler thành:

```typescript
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .rpc('toggle_kudos_like', { p_kudos_id: id, p_user_id: user.id });

  if (error) {
    if (error.message?.includes('SELF_LIKE_NOT_ALLOWED')) {
      return NextResponse.json({ error: 'SELF_LIKE_NOT_ALLOWED' }, { status: 403 });
    }
    if (error.message?.includes('KUDOS_NOT_FOUND')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);   // { liked: boolean, count: number }
}
```

**Done when**:
- `POST /api/kudos/<own-kudos-id>/like` → HTTP 403 `{ error: 'SELF_LIKE_NOT_ALLOWED' }`
- `POST /api/kudos/<other-kudos-id>/like` → HTTP 200 `{ liked: true, count: N }`; gọi lại → `{ liked: false, count: N-1 }`
- Like trong ngày đặc biệt → `heart_count += 2`, `hearts_received += 2` cho sender
- Unauthenticated → HTTP 401

---

### T04 · Sửa `/api/me/kudos-stats` — gọi `get_kudos_stats` RPC *(R-07)*

| | |
|---|---|
| **Type** | API (MODIFY) |
| **File** | `src/app/api/me/kudos-stats/route.ts` |
| **Effort** | XS |
| **Blocks** | T08 (sidebar stats hiển thị đúng) |
| **Depends on** | T01 (RPC `get_kudos_stats` phải tồn tại) |

**Vấn đề**: Query hiện tại dùng sai PostgREST join syntax để tính `hearts_received` → luôn trả về 0. Còn có dead `_` slot trong `Promise.all`.

**Action**: Rewrite toàn bộ handler:

```typescript
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .rpc('get_kudos_stats', { p_user_id: user.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
  // { kudos_received, kudos_sent, hearts_received, secret_box_opened, secret_box_unopened }
}
```

**Done when**: `GET /api/me/kudos-stats` trả về `hearts_received` đúng (khác 0 nếu user có likes trên kudos đã gửi); 5 chỉ số chính xác với dữ liệu seed.

---

### T05 · Tạo `GET /api/kudos/highlight` — endpoint riêng cho Highlight section

| | |
|---|---|
| **Type** | API (CREATE) |
| **File** | `src/app/api/kudos/highlight/route.ts` |
| **Effort** | S |
| **Blocks** | T12 (HighlightSection sẽ gọi endpoint này) |
| **Depends on** | T01, T02 |

**Action**: Tạo file mới:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hashtag      = searchParams.get('hashtag');
  const departmentId = searchParams.get('department');

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase
    .from('kudos')
    .select(`
      id, message, danh_hieu, image_urls, heart_count, created_at, is_anonymous, anonymous_name,
      hashtags,
      sender:profiles!kudos_sender_id_fkey(id, full_name, avatar_url, kudos_star_tier, department),
      receiver:profiles!kudos_receiver_id_fkey(id, full_name, avatar_url, kudos_star_tier, department),
      kudos_likes!inner(user_id)
    `)
    .order('heart_count', { ascending: false })
    .limit(5);

  if (hashtag) query = query.contains('hashtags', [hashtag]);
  if (departmentId) query = query.eq('department_id', departmentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Annotate liked_by_me + anonymous masking
  const mapped = (data ?? []).map((k) => {
    const { is_anonymous, anonymous_name, kudos_likes, sender, ...rest } = k as any;
    return {
      ...rest,
      sender: is_anonymous
        ? { id: null, full_name: anonymous_name ?? 'Ẩn danh', avatar_url: null }
        : sender,
      liked_by_me: (kudos_likes ?? []).some((l: any) => l.user_id === user.id),
    };
  });

  return NextResponse.json({ data: mapped });
}
```

> **Note**: `kudos_likes!inner` join dùng để annotate `liked_by_me`; cần left join thực tế nếu muốn trả về kudos chưa có like nào. Kiểm tra với seed data.

**Done when**: `GET /api/kudos/highlight` trả về tối đa 5 kudos `ORDER BY heart_count DESC`; `?hashtag=Dedicated` filter đúng; `liked_by_me` đúng theo session; anonymous kudos masking đúng.

---

### T06 · Tạo `GET /api/profiles/leaderboard/tier-upgrades` cho sidebar D.2

| | |
|---|---|
| **Type** | API (CREATE) |
| **File** | `src/app/api/profiles/leaderboard/route.ts` |
| **Effort** | XS |
| **Blocks** | T13 (KudosSidebar D.2 cần endpoint này) |
| **Depends on** | T01 (`kudos_star_tier_updated_at` column phải tồn tại) |

**Action**: Tạo file mới:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, kudos_star_tier, kudos_star_tier_updated_at, department')
    .not('kudos_star_tier', 'is', null)
    .not('kudos_star_tier_updated_at', 'is', null)
    .order('kudos_star_tier_updated_at', { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
```

**Done when**: `GET /api/profiles/leaderboard/tier-upgrades` trả về JSON `{ data: [...] }` tối đa 10 profiles có `kudos_star_tier IS NOT NULL`, sắp xếp `kudos_star_tier_updated_at DESC`.

---

## P2 — Data Propagation & Core Bug Fixes (Priority: P1–P2)

### T07 · Sửa `page.tsx` — KUDOS_QUERY thiếu fields + propagate `currentUserId` *(R-03, R-04)*

| | |
|---|---|
| **Type** | Server Component (MODIFY) |
| **File** | `src/app/(dashboard)/kudos/page.tsx` |
| **Effort** | S |
| **Blocks** | T08 |
| **Depends on** | T01 (schema) |

**Vấn đề (R-04)**: `KUDOS_QUERY` trong file thiếu 4 fields: `danh_hieu`, `image_urls`, `is_anonymous`, `anonymous_name` → initial SSR render thiếu dữ liệu.

**Vấn đề (R-03)**: `userId` được tính từ `getUser()` trong file nhưng **không bao giờ được pass** xuống `<KudosClient>`.

**Action**:

1. Thêm 4 fields vào `KUDOS_QUERY` string (tìm đoạn `.select(...)` SSR):
```typescript
// Thêm vào danh sách SELECT của KUDOS_QUERY:
danh_hieu,
image_urls,
is_anonymous,
anonymous_name,
```

2. Pass `currentUserId` xuống `<KudosClient>`:
```typescript
// Trong JSX return:
<KudosClient
  initialKudos={initialKudos}
  initialHighlights={initialHighlights}
  currentUserId={userId}   // ← thêm prop này
/>
```

**Done when**: SSR HTML của trang `/kudos` (view-source) chứa `danh_hieu` value; TypeScript không báo lỗi prop `currentUserId` trên `KudosClient`.

---

### T08 · `KudosClient.tsx` — Thread `currentUserId` + sửa stale post-send feed *(R-03, R-06)*

| | |
|---|---|
| **Type** | Client Component (MODIFY) |
| **File** | `src/components/kudos/KudosClient.tsx` |
| **Effort** | S |
| **Blocks** | T09, T10, T11 |
| **Depends on** | T07 |

**Vấn đề (R-03)**: `KudosClient` không có prop `currentUserId` → không thể truyền xuống card components.

**Vấn đề (R-06)**: Sau khi gửi kudos thành công, code hiện tại increment `kudosKey` (remount `AllKudosSection`) → section render lại với **stale SSR data** không có kudos mới.

**Action**:

1. Thêm `currentUserId` vào props interface và truyền xuống:
```typescript
interface KudosClientProps {
  initialKudos: KudosFeedItem[];
  initialHighlights: KudosFeedItem[];
  currentUserId: string;   // ← thêm
}

export default function KudosClient({ initialKudos, initialHighlights, currentUserId }: KudosClientProps) {
  // ... pass currentUserId xuống HighlightSection và AllKudosSection
}
```

2. Sửa `handleSendSuccess` — thay vì `setKudosKey(k => k + 1)` (stale remount), trigger re-fetch fresh:
```typescript
// Thêm state để signal fresh fetch
const [feedResetToken, setFeedResetToken] = useState(0);

const handleSendSuccess = useCallback(() => {
  setFeedResetToken(t => t + 1);   // AllKudosSection watches này để reset cursor và re-fetch
}, []);

// Pass feedResetToken xuống AllKudosSection thay vì key={kudosKey}
```

**Done when**:
- TypeScript không báo lỗi prop
- Sau khi gửi kudos mới, feed hiển thị kudos vừa gửi ở đầu (không cần F5)
- `currentUserId` được pass đến `KudoCard`

---

### T09 · `AllKudosSection.tsx` — Sửa IntersectionObserver + filter re-fetch *(R-05, R-06)*

| | |
|---|---|
| **Type** | Client Component (MODIFY) |
| **File** | `src/components/kudos/AllKudosSection.tsx` |
| **Effort** | M |
| **Blocks** | — |
| **Depends on** | T08 |

**Vấn đề (R-05a)**: `fetchMore` không được bọc trong `useCallback` → reference thay đổi mỗi render.

**Vấn đề (R-05b)**: `useEffect` cho `IntersectionObserver` thiếu dependency array → re-attach mỗi render → performance degradation.

**Vấn đề (R-06 / US4)**: Khi filter thay đổi, component reset về stale SSR data thay vì làm fresh fetch với cursor=null.

**Vấn đề (R-06 / US2)**: Khi `feedResetToken` từ T08 thay đổi, cần refetch từ đầu.

**Action**:

1. Wrap `fetchMore` trong `useCallback`:
```typescript
const fetchMore = useCallback(async () => {
  if (loading || !hasMore) return;
  setLoading(true);
  // ... existing fetch logic using cursor
  setLoading(false);
}, [loading, hasMore, cursor, hashtag, department]);
```

2. Fix `useEffect` dependency array:
```typescript
useEffect(() => {
  if (!loaderRef.current) return;
  const observer = new IntersectionObserver(
    (entries) => { if (entries[0].isIntersecting) fetchMore(); },
    { threshold: 0.1 }
  );
  observer.observe(loaderRef.current);
  return () => observer.disconnect();
}, [fetchMore]);   // ← dependency array đúng
```

3. Reset và re-fetch khi filter hoặc `feedResetToken` thay đổi:
```typescript
// Theo dõi hashtag, department, feedResetToken changes
useEffect(() => {
  setCursor(null);
  setKudos([]);
  setHasMore(true);
  // Trigger fetch từ đầu
  fetchInitial();   // helper fn fetch page 1
}, [hashtag, department, feedResetToken]);
```

**Done when**:
- Click hashtag filter → All Kudos section reset về trang 1 với results mới ngay lập tức (không cần scroll)
- Infinite scroll chỉ re-attach observer khi `fetchMore` thay đổi, không mỗi render (verify với React DevTools)
- Sau gửi kudos, feed reset và hiển thị kudos mới

---

### T10 · `KudoCard.tsx` — Self-like guard + `line-clamp-5` + hashtag `onClick` *(R-02, R-08)*

| | |
|---|---|
| **Type** | Client Component (MODIFY) |
| **File** | `src/components/kudos/KudoCard.tsx` |
| **Effort** | M |
| **Blocks** | — |
| **Depends on** | T08 (currentUserId), T03 (API guard) |

**Vấn đề (R-02)**: Không có `currentUserId` prop → nút heart không biết disable khi nào.

**Vấn đề**: Content dùng `line-clamp-3` — spec yêu cầu **5 dòng** cho All Kudos card (C.3).

**Vấn đề (R-08)**: Hashtag `<span>` không có `onClick` → tính năng "click hashtag = filter" (FR-014) không hoạt động.

**Action**:

1. Thêm `currentUserId` và `onFilterChange` props:
```typescript
interface KudoCardProps {
  kudos: KudosFeedItem;
  currentUserId?: string;
  onFilterChange?: (filter: { hashtag?: string; department?: string }) => void;
}
```

2. Disable heart button khi user là sender:
```typescript
const isSender = currentUserId && kudos.sender?.id === currentUserId;

<button
  onClick={isSender ? undefined : handleLike}
  disabled={!!isSender}
  aria-label="Thích kudos này"
  aria-pressed={liked}
  className={isSender ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
>
  {/* heart icon */}
</button>
```

3. Sửa truncation:
```typescript
// Tìm className có line-clamp-3 trên message content
// Đổi thành:
className="... line-clamp-5"
```

4. Thêm `onClick` cho hashtag chips:
```typescript
{kudos.hashtags?.map((tag) => (
  <span
    key={tag}
    onClick={() => onFilterChange?.({ hashtag: tag })}
    className="cursor-pointer hover:underline ..."
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onFilterChange?.({ hashtag: tag })}
  >
    #{tag}
  </span>
))}
```

**Done when**:
- Kudos do current user gửi → heart button disabled (visual: opacity thấp, cursor-not-allowed)
- Kudos do người khác gửi → heart button active
- Message body truncate sau 5 dòng (không phải 3)
- Click hashtag chip → filter cập nhật; All Kudos + Highlight cùng filter

---

### T11 · `KudoHighlightCard.tsx` — DOMPurify message + `danh_hieu` + self-like guard *(R-09, R-10, R-02)*

| | |
|---|---|
| **Type** | Client Component (MODIFY) |
| **File** | `src/components/kudos/KudoHighlightCard.tsx` |
| **Effort** | M |
| **Blocks** | — |
| **Depends on** | T08 (currentUserId), T03 (API guard) |

**Vấn đề (R-09)**: `message` được render là **plain text** (`.textContent` hoặc trực tiếp trong `{kudos.message}`) → mất toàn bộ HTML formatting của TipTap.

**Vấn đề (R-10)**: Không render `danh_hieu` — Figma B.3 / `B.4.1` yêu cầu hiển thị danh hiệu bên dưới tên sender.

**Vấn đề (R-02)**: Không có `currentUserId` → không disable heart khi user là sender.

**Action**:

1. Sửa message render:
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Thay thế {kudos.message} hoặc `.textContent` bằng:
<div
  className="line-clamp-3 prose prose-sm max-w-none"
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(kudos.message) }}
/>
```

2. Thêm `danh_hieu` badge (Figma `B.4.1` — hiển thị như tag ngay dưới tên sender):
```typescript
{kudos.danh_hieu && (
  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300">
    {kudos.danh_hieu}
  </span>
)}
```

3. Thêm `currentUserId` prop và disable heart:
```typescript
interface KudoHighlightCardProps {
  kudos: KudosFeedItem;
  currentUserId?: string;
  onFilterChange?: (filter: { hashtag?: string; department?: string }) => void;
}

const isSender = currentUserId && kudos.sender?.id === currentUserId;
// (apply same disabled pattern as KudoCard T10)
```

4. Wrap sender/receiver name và avatar trong `<Link>`:
```typescript
import Link from 'next/link';

<Link href={`/profile/${kudos.sender?.id}`} className="hover:underline font-semibold">
  {kudos.sender?.full_name}
</Link>
```

**Done when**:
- Highlight card hiển thị **bold/italic/danh sách** từ TipTap message đúng (verify với seed kudos có HTML)
- `danh_hieu` hiển thị dưới tên sender nếu có
- Heart disabled khi user là sender; active khi người khác
- Click tên/avatar sender → navigate `/profile/[id]`

---

## P3 — Feature Completion (Priority: P2)

### T12 · `HighlightSection.tsx` — Chuyển sang gọi `/api/kudos/highlight`

| | |
|---|---|
| **Type** | Client Component (MODIFY) |
| **File** | `src/components/kudos/HighlightSection.tsx` |
| **Effort** | S |
| **Blocks** | — |
| **Depends on** | T05 (`/api/kudos/highlight` phải tồn tại), T02 (sort fix làm fallback) |

**Action**: Sửa URL fetch từ `GET /api/kudos?sort=heart_count&limit=5` thành `GET /api/kudos/highlight`:

```typescript
// Tìm fetch call trong HighlightSection, thay:
const params = new URLSearchParams({ sort: 'heart_count', limit: '5' });
if (hashtag) params.set('hashtag', hashtag);
if (department) params.set('department', department);
const res = await fetch(`/api/kudos?${params}`);

// Đổi thành:
const params = new URLSearchParams();
if (hashtag) params.set('hashtag', hashtag);
if (department) params.set('department', department);
const res = await fetch(`/api/kudos/highlight?${params}`);

const { data } = await res.json();   // new endpoint wraps in { data: [...] }
```

**Done when**: Highlight carousel hiển thị đúng top 5 tim nhất; filter hashtag/phòng ban hoạt động; trang không có network call đến `/api/kudos?sort=heart_count`.

---

### T13 · `KudosSidebar.tsx` — Thêm D.2 "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" *(R-12)*

| | |
|---|---|
| **Type** | Client Component (MODIFY) |
| **File** | `src/components/kudos/KudosSidebar.tsx` |
| **Effort** | M |
| **Blocks** | — |
| **Depends on** | T06 (`/api/profiles/leaderboard/tier-upgrades` phải tồn tại) |

**Vấn đề (R-12)**: Section D.2 "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" **hoàn toàn không tồn tại** trong file hiện tại. Figma yêu cầu list 10 người vừa thăng tier, thứ tự `kudos_star_tier_updated_at DESC`.

**Action**: Thêm vào JSX của KudosSidebar (sau D.1 stats block, trước D.3):

```typescript
// State
const [tierUpgrades, setTierUpgrades] = useState<TierUpgradeItem[]>([]);

// Fetch on mount
useEffect(() => {
  fetch('/api/profiles/leaderboard/tier-upgrades')
    .then(r => r.json())
    .then(({ data }) => setTierUpgrades(data ?? []));
}, []);

// Render D.2 section
<section aria-labelledby="d2-heading">
  <h3 id="d2-heading" className="text-xs font-bold uppercase tracking-wider mb-3">
    {t('sidebar.tierUpgradesTitle')}  {/* "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" */}
  </h3>
  {tierUpgrades.length === 0 ? (
    <p className="text-sm text-gray-500">{t('sidebar.noData')}</p>
  ) : (
    <ul className="space-y-2">
      {tierUpgrades.map((profile) => (
        <li key={profile.id} className="flex items-center gap-2">
          <Link href={`/profile/${profile.id}`}>
            <Image src={profile.avatar_url ?? '/default-avatar.png'} alt={profile.full_name}
              width={32} height={32} className="rounded-full" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${profile.id}`} className="text-sm font-medium truncate hover:underline block">
              {profile.full_name}
            </Link>
            <span className="text-xs text-yellow-400">
              {'★'.repeat(profile.kudos_star_tier)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )}
</section>
```

**Done when**:
- D.2 section hiển thị sau D.1 stats block
- Fetch `GET /api/profiles/leaderboard/tier-upgrades` khi sidebar mount
- Danh sách rỗng → "Chưa có dữ liệu"
- Click tên/avatar → navigate `/profile/[id]`

---

### T14 · `SpotlightBoard.tsx` — Sửa `kudos_id` mapping theo `text` key *(R-11)*

| | |
|---|---|
| **Type** | Client Component (MODIFY) |
| **File** | `src/components/kudos/SpotlightBoard.tsx` |
| **Effort** | S |
| **Blocks** | — |
| **Depends on** | — (không phụ thuộc API mới) |

**Vấn đề (R-11)**: Code hiện tại map `kudos_id` theo array index `layoutWords[i]?.kudos_id` — nhưng d3-cloud **không preserve input order** sau khi layout, nên index không tương ứng. Click node sẽ navigate đến sai kudos.

**Action**: Xây dựng `Map<text, kudos_id>` trước khi gọi d3-cloud, rồi tra cứu bằng `word.text` trong callback:

```typescript
// Trước khi gọi d3-cloud layout:
const wordToKudosId = new Map<string, string>(
  words.map((w) => [w.text, w.kudos_id])
);

// Trong d3-cloud end callback (khi render nodes):
cloud()
  .words(words)
  .on('end', (layoutWords) => {
    const rendered = layoutWords.map((word) => ({
      ...word,
      kudos_id: wordToKudosId.get(word.text) ?? null,  // ← lookup by text, not index
    }));
    setRenderedWords(rendered);
  })
  .start();

// Khi click node:
const handleNodeClick = (text: string) => {
  const kudosId = wordToKudosId.get(text);
  if (kudosId) router.push(`/kudos/${kudosId}`);
};
```

**Done when**: Click một node trong Spotlight → navigate đến đúng kudos của receiver đó (verify bằng seed data); không navigate nhầm khi d3-cloud reorders output.

---

## P4 — i18n, Accessibility & Polish (Priority: P2/P3)

### T15 · Thêm i18n keys cho strings mới

| | |
|---|---|
| **Type** | i18n |
| **Files** | `messages/vi.json`, `messages/en.json` |
| **Effort** | XS |
| **Blocks** | — |
| **Depends on** | T13 (biết cần keys gì) |

**Action**: Thêm vào `messages/vi.json` (và `en.json` bản dịch tương ứng):

```json
{
  "kudos": {
    "sidebar": {
      "tierUpgradesTitle": "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT",
      "giftsTitle": "10 SUNNER NHẬN QUÀ MỚI NHẤT",
      "noData": "Chưa có dữ liệu",
      "openGift": "Mở quà",
      "statsKudosReceived": "Số Kudos bạn nhận được",
      "statsKudosSent": "Số Kudos bạn đã gửi",
      "statsHeartsReceived": "Số tim bạn nhận được",
      "statsSecretBoxOpened": "Số Secret Box bạn đã mở",
      "statsSecretBoxUnopened": "Số Secret Box chưa mở"
    },
    "highlight": {
      "emptyState": "Hiện tại chưa có Kudos nào.",
      "filterHashtag": "Hashtag",
      "filterDepartment": "Phòng ban"
    },
    "feed": {
      "emptyState": "Hiện tại chưa có Kudos nào.",
      "emptyFilterState": "Hiện tại chưa có Kudos nào phù hợp.",
      "loadingMore": "Đang tải...",
      "allLoaded": "Đã xem tất cả Kudos.",
      "retryButton": "Thử lại"
    },
    "card": {
      "likeButton": "Thích kudos này",
      "copyLink": "Copy Link",
      "viewDetail": "Xem chi tiết",
      "linkCopied": "Link copied — ready to share!"
    },
    "spotlight": {
      "emptyState": "Chưa có Kudos nào.",
      "searchPlaceholder": "Tìm Sunner..."
    }
  }
}
```

**Done when**: `yarn build` không có missing translation key warning; sidebar hiển thị đúng text từ translations.

---

### T16 · Accessibility pass — `aria-hidden`, `aria-label`, `aria-pressed`

| | |
|---|---|
| **Type** | Accessibility (MODIFY) |
| **Files** | `src/components/kudos/KudoCard.tsx`, `src/components/kudos/KudoHighlightCard.tsx` |
| **Effort** | XS |
| **Blocks** | — |
| **Depends on** | T10, T11 |

**Action**:

1. Icon mũi tên "→" giữa sender và receiver:
```typescript
<span aria-hidden="true">→</span>
```

2. Icon tim (decorative SVG):
```typescript
<HeartIcon aria-hidden="true" />
```

3. Heart button đã xử lý ở T10/T11. Xác nhận cuối:
```typescript
<button
  aria-label={t('kudos.card.likeButton')}
  aria-pressed={liked}
  disabled={isSender}
  ...
>
```

4. Divider D.1.5 trong sidebar:
```typescript
<hr aria-hidden="true" />
```

5. Copy Link button:
```typescript
<button aria-label={t('kudos.card.copyLink')} ...>
  <CopyIcon aria-hidden="true" />
  <span className="sr-only">{t('kudos.card.copyLink')}</span>
</button>
```

**Done when**: Không có `aria-*` violations trong axe/lighthouse; heart button đọc đúng trạng thái; decorative icons ẩn với screen reader.

---

### T17 · Tạo `ProfilePreviewPopover` component (US8 — P3)

| | |
|---|---|
| **Type** | Component (CREATE) |
| **File** | `src/components/kudos/ProfilePreviewPopover.tsx` |
| **Effort** | M |
| **Blocks** | — |
| **Depends on** | T10, T11 (hover binding trong card components) |

**Design**: Figma frame `721:5827` — popover nhỏ hiển thị: avatar lớn, tên, phòng ban, số ★ tier.

**Props interface**:
```typescript
interface ProfilePreviewPopoverProps {
  userId: string;
  children: React.ReactNode;   // the trigger element (avatar/name)
}
```

**Action**: Tạo component dùng CSS position absolute (hoặc Radix `@radix-ui/react-hover-card` nếu đã có trong deps):

```typescript
'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';

interface ProfileData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department?: string;
  kudos_star_tier?: number | null;
}

export function ProfilePreviewPopover({ userId, children }: ProfilePreviewPopoverProps) {
  const [profile, setProfile]   = useState<ProfileData | null>(null);
  const [visible, setVisible]   = useState(false);
  const timeoutRef               = useRef<NodeJS.Timeout>();

  const handleMouseEnter = async () => {
    timeoutRef.current = setTimeout(async () => {
      if (!profile) {
        const res  = await fetch(`/api/profiles/search?id=${userId}`);
        const data = await res.json();
        setProfile(data?.data?.[0] ?? null);
      }
      setVisible(true);
    }, 300);   // small delay prevents flicker on fast mouse movements
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <span className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {visible && profile && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-48 rounded-lg shadow-lg bg-[var(--Details-Container)] border border-[var(--Details-Border)] p-3">
          <div className="flex items-center gap-2">
            <Image
              src={profile.avatar_url ?? '/default-avatar.png'}
              alt={profile.full_name}
              width={40} height={40}
              className="rounded-full flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-[var(--Details-Text-Secondary-1)]">
                {profile.full_name}
              </p>
              {profile.department && (
                <p className="text-xs text-[var(--Details-Text-Secondary-2)] truncate">
                  {profile.department}
                </p>
              )}
              {profile.kudos_star_tier && (
                <span className="text-xs text-yellow-400">
                  {'★'.repeat(profile.kudos_star_tier)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
```

**Tích hợp** (sau khi tạo component) — sửa `KudoCard.tsx` và `KudoHighlightCard.tsx`:
```typescript
<ProfilePreviewPopover userId={kudos.sender.id}>
  <Link href={`/profile/${kudos.sender.id}`}>
    <Image src={kudos.sender.avatar_url} ... />
  </Link>
</ProfilePreviewPopover>
```

**Done when**:
- Hover lên avatar/tên sender hoặc receiver → popover xuất hiện sau ~300ms
- Popover hiển thị avatar, tên, phòng ban, số sao ★
- Di chuột ra → popover ẩn
- Click avatar/tên vẫn navigate đến profile

---

### T18 · Responsive QA & `position: sticky` verify

| | |
|---|---|
| **Type** | QA (Manual) |
| **Files** | `src/components/kudos/KudosSidebar.tsx`, layout CSS |
| **Effort** | S |
| **Blocks** | — |
| **Depends on** | T13, T15, T16, T17 |

**Checklist**:

| Breakpoint | Check |
|---|---|
| Desktop 1440px | 2-column layout: feed bên trái, sidebar bên phải; sidebar sticky |
| Desktop 1280px | Layout 2-col vẫn ổn; không overflow horizontal |
| Tablet 768px | Sidebar ẩn hoặc thu gọn xuống dưới feed |
| Mobile 375px | Single column; carousel không bị clipped; cards full-width |
| Short viewport (600px height) | Sidebar sticky không overflow; scroll đúng |

**Action**: Mở DevTools responsive, check từng breakpoint. Sửa CSS nếu cần (Tailwind breakpoint classes).

**Done when**: Tất cả checkpoints ở trên pass; không có horizontal scroll trên mobile 375px.

---

## Summary

| Phase | Tasks | Priority | Effort |
|---|---|---|---|
| P0 — Migration | T01 | Critical / blocks all | M |
| P1 — API fix | T02, T03, T04 | P1 Critical (bugs) | XS + S + XS |
| P1 — API new | T05, T06 | P1 (features) | S + XS |
| P2 — Data propagation | T07, T08 | P1 (critical bugs) | S + S |
| P2 — Component bugs | T09, T10, T11 | P1 (critical bugs) | M + M + M |
| P3 — Feature completion | T12, T13, T14 | P2 | S + M + S |
| P4 — i18n + a11y + polish | T15, T16, T17, T18 | P2 / P3 | XS + XS + M + S |

**Total**: 18 tasks | Estimated effort: ~4 engineering-days
