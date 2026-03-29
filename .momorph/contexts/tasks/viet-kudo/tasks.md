# Task Breakdown: Viết Kudo Modal

**Frame ID**: `520:11602` | **MoMorph Frame ID**: `6398`
**Plan**: `.momorph/contexts/plans/viet-kudo/plan.md`
**Spec**: `.momorph/contexts/specs/viet-kudo/spec.md`
**Created**: 2026-03-25

---

## Priority & Sequencing

```
P0 (Blocking)  → T01, T02, T03               (sequential — must finish before anything else)
P1 (Core)      → T04, T05, T06, T07          (T04 → T07; T05/T06 independent of each other)
P2 (Supporting) → T08, T09                   (can run in parallel after T07 done)
P3 (QA)        → T10, T11                    (after all P0–P2 complete)
```

**Dependency graph**:
```
T01 (packages)
  └→ T04 (KudoRichEditor)
       └→ T07 (SendKudosDialog)
T02 (migration + storage)
  └→ T05 (POST API)
  └→ T06 (GET API)
  └→ T03 (types)
       └→ T05, T06, T07, T08
T07 (dialog) → T09 (KudosClient check)
T07, T08 → T10, T11 (QA)
```

**User Stories coverage**:
| User Story | Tasks |
|---|---|
| US1 — Mở form modal | T07, T09 |
| US2 — Chọn người nhận | T07 |
| US3 — Điền danh hiệu | T02, T03, T05, T07 |
| US4 — Rich text + @mention | T01, T04, T07 |
| US5 — Hashtag | T07 |
| US6 — Đính kèm ảnh | T02, T05, T07 |
| US7 — Gửi ẩn danh | T02, T03, T05, T06, T07 |
| US8 — Submit & feedback | T05, T07 |

---

## P0 — Prerequisites (must complete first, sequential)

### T01 · Install packages: TipTap + isomorphic-dompurify

| | |
|---|---|
| **Type** | Dependency |
| **File** | `package.json` |
| **Effort** | XS |
| **Blocks** | T04 (KudoRichEditor cannot be built without TipTap) |

**Action**:
```bash
yarn add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-mention @tiptap/extension-placeholder @tiptap/extension-character-count isomorphic-dompurify
yarn add -D @types/dompurify
```

**Packages installed**:
- `@tiptap/react` — React binding
- `@tiptap/pm` — ProseMirror peer dep
- `@tiptap/starter-kit` — Bold, Italic, Strike, OrderedList, Blockquote, History
- `@tiptap/extension-link` — Chèn hyperlink
- `@tiptap/extension-mention` — @mention dropdown
- `@tiptap/extension-placeholder` — Placeholder text khi editor rỗng
- `@tiptap/extension-character-count` — Bộ đếm ký tự (Figma D.1)
- `isomorphic-dompurify` — Sanitize HTML (chống XSS trên `KudoCard`)

**Done when**: Các packages xuất hiện trong `package.json` dependencies; `yarn build` không lỗi.

---

### T02 · Supabase Migration: Thêm 4 cột + Storage bucket

| | |
|---|---|
| **Type** | Database |
| **File** | `supabase/migrations/20260325000000_kudos_viet_kudo_fields.sql` |
| **Effort** | S |
| **Blocks** | T03, T05, T06, T08 |

**Action**: Tạo file migration mới:

```sql
-- 1. Thêm 4 cột mới vào bảng kudos
ALTER TABLE public.kudos
  ADD COLUMN IF NOT EXISTS title          text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_anonymous   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymous_name text,
  ADD COLUMN IF NOT EXISTS image_urls     text[]  NOT NULL DEFAULT '{}';

-- Thêm CHECK riêng để không vi phạm rows cũ có DEFAULT ''
ALTER TABLE public.kudos
  ADD CONSTRAINT kudos_title_max_length CHECK (char_length(title) <= 200);

COMMENT ON COLUMN public.kudos.title          IS 'Danh hiệu — tiêu đề của Kudo; bắt buộc cho row mới, legacy rows có empty string';
COMMENT ON COLUMN public.kudos.is_anonymous   IS 'Nếu true, ẩn thông tin sender trong API và UI';
COMMENT ON COLUMN public.kudos.anonymous_name IS 'Tên hiển thị thay thế khi gửi ẩn danh (nullable)';
COMMENT ON COLUMN public.kudos.image_urls     IS 'Mảng public URL ảnh đính kèm từ Supabase Storage (tối đa 5)';

-- 2. Tạo Storage bucket kudo-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('kudo-images', 'kudo-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS: Authenticated users có thể upload
CREATE POLICY "Authenticated users can upload kudo images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kudo-images');

-- 4. Public read
CREATE POLICY "Public can view kudo images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kudo-images');
```

**Apply locally**:
```bash
supabase db reset
# hoặc nếu không muốn reset toàn bộ:
supabase migration up
```

**Done when**: `supabase db diff` sạch; local DB có 4 cột mới trên bảng `kudos`; bucket `kudo-images` tồn tại trong Supabase Storage UI.

---

### T03 · Cập nhật `src/types/database.ts` — Thêm 4 fields mới

| | |
|---|---|
| **Type** | Types |
| **File** | `src/types/database.ts` |
| **Effort** | XS |
| **Blocks** | T05, T06, T07, T08 |
| **Depends on** | T02 (cần biết schema DB mới) |

**Action**: Tìm type `Kudos` (hoặc row type tương ứng) và thêm 4 fields:

```typescript
// Trong type Kudos (DB row)
title: string;
is_anonymous: boolean;
anonymous_name: string | null;  // nullable — chỉ có value khi is_anonymous = true
image_urls: string[];

// Trong KudosFeedItem / KudosWithProfiles: sender có thể là masked
// Cập nhật sender type để cho phép { id: null; full_name: string; avatar_url: null }
```

**Done when**: Không có TypeScript error sau khi thêm fields; `yarn build` hoặc `tsc --noEmit` sạch.

---

## P1 — Core Implementation

### T04 · Tạo `KudoRichEditor` component (TipTap)

| | |
|---|---|
| **Type** | Component (CREATE) |
| **File** | `src/components/kudos/KudoRichEditor.tsx` |
| **Effort** | M |
| **Blocks** | T07 |
| **Depends on** | T01 (TipTap packages) |

**Props interface**:
```typescript
interface KudoRichEditorProps {
  value: string;           // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  mentionSuggestions?: Array<{ id: string; label: string }>;
  maxLength?: number;      // default 1000
  error?: string;
}
```

**Sub-elements** (theo Figma C, D, D.1):
- **Toolbar** (Figma C): Bold (C.1) | Italic (C.2) | Strike (C.3) | Number/OrderedList (C.4) | Link (C.5) | Quote (C.6) — mỗi nút là `ToolbarButton` với active state
- **Editor area** (Figma D): TipTap `EditorContent`, placeholder text từ Figma D
- **Footer** (Figma D.1): Hint text trái `'Bạn có thể "@+tên" để nhắc tới đồng nghiệp khác'` + bộ đếm ký tự phải `{current}/{maxLength}`
- **LinkDialog**: Popover nhỏ nhập URL khi click C.5
- **MentionList**: Dropdown suggestions khi gõ `@`

**TipTap setup**:
```typescript
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false }),
    Mention.configure({ suggestion: { items: ({ query }) => ... } }),
    Placeholder.configure({ placeholder }),
    CharacterCount.configure({ limit: maxLength ?? 1000 }),
  ],
  content: value,
  onUpdate: ({ editor }) => onChange(editor.getHTML()),
});
```

**Styling notes**:
- Editor wrapper: `border rounded-lg focus-within:ring-2`; nền trắng
- Toolbar: flex row, gap-1, border-bottom
- ToolbarButton active: border hoặc background highlight
- `prose` class trên EditorContent content area

**Done when**:
- Bold/Italic/Strike toggle khi click trên selected text
- OrderedList tạo `1. 2. 3.` khi click C.4
- Link dialog mở khi click C.5; chèn link thành công
- Blockquote áp dụng khi click C.6
- `@name` → dropdown → mention được chèn
- Placeholder hiển thị khi rỗng
- Counter hiển thị `0/1000` → cập nhật khi gõ
- Hint text "Bạn có thể..." luôn hiển thị dưới editor

---

### T05 · Cập nhật `POST /api/kudos` — Accept 4 fields mới

| | |
|---|---|
| **Type** | API (MODIFY) |
| **File** | `src/app/api/kudos/route.ts` |
| **Effort** | S |
| **Blocks** | T07 (dialog submit cần API hoạt động đúng) |
| **Depends on** | T02, T03 |

**Thay đổi**:

1. **Destructure thêm fields** từ body:
```typescript
const { receiver_id, message, title, hashtags, is_anonymous, anonymous_name, image_urls } = body as {
  receiver_id: string;
  message: string;
  title: string;
  hashtags: string[];
  is_anonymous?: boolean;
  anonymous_name?: string;
  image_urls?: string[];
};
```

2. **Validate mới**:
```typescript
if (!receiver_id || !message?.trim() || !title?.trim()) {
  return NextResponse.json({ error: 'receiver_id, message và title là bắt buộc' }, { status: 400 });
}
if (image_urls && image_urls.length > 5) {
  return NextResponse.json({ error: 'Tối đa 5 ảnh' }, { status: 400 });
}
// Whitelist URL: chỉ accept Supabase Storage URLs
const SUPABASE_STORAGE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/';
if (image_urls?.some(url => !url.startsWith(SUPABASE_STORAGE_ORIGIN))) {
  return NextResponse.json({ error: 'URL ảnh không hợp lệ' }, { status: 400 });
}
```

3. **Insert thêm 4 fields** vào Supabase insert query.

**Done when**: `POST /api/kudos` với body đầy đủ trả `201`; thiếu `title` trả `400`; image URL ngoài whitelist trả `400`.

---

### T06 · Cập nhật `GET /api/kudos` — Anonymous masking + fields mới

| | |
|---|---|
| **Type** | API (MODIFY) |
| **File** | `src/app/api/kudos/route.ts` |
| **Effort** | S |
| **Blocks** | T10 (QA) |
| **Depends on** | T02, T03 |

**Thay đổi**:

1. **Thêm vào SELECT**: `title`, `is_anonymous`, `anonymous_name`, `image_urls`.

2. **Anonymous masking trong map**:
```typescript
const kudos = (data ?? []).map((k) => {
  const { is_anonymous, anonymous_name, sender, kudos_likes, ...rest } = k;
  return {
    ...rest,
    sender: is_anonymous
      ? { id: null, full_name: anonymous_name ?? 'Ẩn danh', avatar_url: null }
      : sender,
    liked_by_me: kudos_likes?.some((l) => l.user_id === user.id) ?? false,
  };
});
```

> `anonymous_name` KHÔNG được trả về trong response khi `is_anonymous = true` — chỉ dùng để tạo `full_name` rồi drop.

**Done when**: Feed kudo `is_anonymous=true` → `sender.full_name` là `anonymous_name` hoặc `"Ẩn danh"`; `sender.id = null`; `sender.avatar_url = null`. Kudo `is_anonymous=false` → sender thật.

---

### T07 · Rewrite `SendKudosDialog.tsx` theo Figma design

| | |
|---|---|
| **Type** | Component (REWRITE) |
| **File** | `src/components/kudos/SendKudosDialog.tsx` |
| **Effort** | L |
| **Blocks** | T09, T10 |
| **Depends on** | T01 (packages), T03 (types), T04 (KudoRichEditor) |

**Design thay đổi lớn**:
- Background: light cream `#FFF8E7` (không phải dark theme hiện tại)
- Layout: modal centered, `max-w-[600px]`, padding `p-6 md:p-8`
- Title (Figma A): `text-xl font-bold text-center` — `"Gửi lời cám ơn và ghi nhận đến đồng đội"`

**Form fields theo đúng thứ tự Figma**:

| No | Field | Component | Required |
|---|---|---|---|
| B | Người nhận | Search input + dropdown | ✅ |
| B' | Danh hiệu | `<input type="text">` | ✅ |
| C+D | Nội dung | `<KudoRichEditor>` (dynamic import) | ✅ |
| E | Hashtag | Chip selector `+Hashtag` button | ✅ |
| F | Image | Thumbnail grid + `+Image` button | ❌ |
| G | Gửi ẩn danh | Checkbox + conditional name input | ❌ |
| H | Actions | Ghost `Hủy` + Primary yellow `Gửi` | — |

**State**:
```typescript
const [receiverId, setReceiverId]     = useState('');
const [title, setTitle]               = useState('');
const [messageHtml, setMessageHtml]   = useState('');
const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
const [images, setImages]             = useState<File[]>([]);         // pre-upload files
const [imageUrls, setImageUrls]       = useState<string[]>([]);       // post-upload URLs
const [isAnonymous, setIsAnonymous]   = useState(false);
const [anonymousName, setAnonymousName] = useState('');               // filled when isAnonymous = true
const [submitting, setSubmitting]     = useState(false);
const [errors, setErrors]             = useState<Record<string, string>>({});
```

**Submit flow**:
1. `validate()` → nếu có errors: set + return (không gọi API)
2. Upload `images[]` tuần tự → `supabase.storage.from('kudo-images').upload(...)` → collect `imageUrls[]`
3. Nếu upload lỗi giữa chừng: xóa các ảnh đã upload + hiện toast lỗi + return
4. `POST /api/kudos` với `{ receiver_id, title, message: messageHtml, hashtags, is_anonymous, anonymous_name, image_urls: imageUrls }`
5. Success: `onSuccess()` → `onClose()` → reset state
6. Error: set error message, re-enable Gửi button

**Validation trước submit**:
```typescript
const validate = () => {
  const e: Record<string, string> = {};
  if (!receiverId)      e.receiver  = 'Vui lòng chọn người nhận';
  if (!title.trim())    e.title     = 'Danh hiệu không được để trống';
  if (!messageHtml || messageHtml === '<p></p>') e.message = 'Vui lòng nhập nội dung';
  if (selectedHashtags.length === 0) e.hashtags = 'Chọn ít nhất 1 hashtag';
  return e;
};
```

**H.2 "Gửi" button disabled** khi: `!receiverId || !title.trim() || !messageHtml || messageHtml === '<p></p>' || selectedHashtags.length === 0` (Figma H.2 spec).

**Accessibility**:
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Focus trap khi modal mở
- `Escape` → close; click backdrop → close

**Done when**: Tất cả User Stories US1–US8 trong spec pass.

---

## P2 — Supporting

### T08 · Cập nhật `KudoCard.tsx` — Render fields mới

| | |
|---|---|
| **Type** | Component (MODIFY) |
| **File** | `src/components/kudos/KudoCard.tsx` |
| **Effort** | S |
| **Blocks** | T10 |
| **Depends on** | T03 (types) |

**Thay đổi**:

1. **Render `title` (Danh hiệu)**: Hiển thị nổi bật phía trên `message`, ví dụ `<h3 className="font-bold text-lg">{kudo.title}</h3>`.

2. **Render `message` dạng HTML** (TipTap output):
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Trong component
const sanitizedMessage = DOMPurify.sanitize(kudo.message);
<div
  className="prose prose-sm"
  dangerouslySetInnerHTML={{ __html: sanitizedMessage }}
/>
```

3. **Render `image_urls[]`**: Grid ảnh thumbnail nếu `image_urls.length > 0`; click ảnh → lightbox hoặc mở tab mới.

4. **Anonymous sender**: Khi `sender.id === null` → hiện avatar placeholder ẩn danh + `sender.full_name` ("Ẩn danh" hoặc custom name).

**Done when**: Card hiển thị `title`, HTML message (styled), ảnh đính kèm, và đúng sender kể cả trường hợp ẩn danh.

---

### T09 · Verify `KudosClient.tsx` — Kiểm tra integration

| | |
|---|---|
| **Type** | Integration check (MODIFY nếu cần) |
| **File** | `src/components/kudos/KudosClient.tsx` |
| **Effort** | XS |
| **Depends on** | T07 |

**Việc cần làm**:
- Mở `KudosClient.tsx`, kiểm tra `<SendKudosDialog>` đang nhận props gì.
- Nếu props thay đổi sau T07 (tên, signature) → cập nhật call site.
- Đảm bảo `onSuccess` callback reload/refetch feed sau khi gửi kudo.

**Done when**: Trang `/kudos` load bình thường; mở dialog → submit → feed reload; không có TypeScript error.

---

## P3 — QA & Verification

### T10 · Manual QA — End-to-end flows

| | |
|---|---|
| **Type** | QA |
| **Effort** | M |
| **Depends on** | T05, T06, T07, T08, T09 |

**Test matrix**:

| # | Scenario | Expected |
|---|---|---|
| 1 | Mở modal → điền đầy đủ B, B', C+D, E → Gửi | 201, modal đóng, feed reload có card mới |
| 2 | Nhấn "Gửi" khi form rỗng | Errors highlight; không gọi API |
| 3 | Thiếu title (B') → Gửi | Lỗi "Danh hiệu không được để trống" |
| 4 | Thiếu hashtag → Gửi | Lỗi required hashtag |
| 5 | Upload 5 ảnh → thêm ảnh thứ 6 | Nút "+ Image" ẩn; chỉ có 5 thumbnails |
| 6 | Click X trên thumbnail | Ảnh bị xóa |
| 7 | Upload ảnh → submit → xem card | Ảnh xuất hiện trên KudoCard |
| 8 | Tick ẩn danh → bỏ trống anonymousName → Gửi | Feed hiện sender = "Ẩn danh" |
| 9 | Tick ẩn danh → điền anonymousName → Gửi | Feed hiện sender = anonymousName đã điền |
| 10 | Bold text → submit → xem card | Text in đậm hiển thị đúng trên card |
| 11 | Gõ `@Thanh` trong editor → chọn suggestion | Mention được chèn |
| 12 | Nhấn Escape | Modal đóng |
| 13 | Click overlay | Modal đóng |
| 14 | Gửi kudo normal → xem feed | Sender name + avatar thật hiển thị |
| 15 | Button "Gửi" disabled khi missing required fields | Disabled state đúng |

---

### T11 · Cloudflare Workers compatibility check

| | |
|---|---|
| **Type** | QA — Deployment |
| **Effort** | S |
| **Depends on** | T10 |

**Checklist**:
- [ ] Chạy `make preview` (hoặc `wrangler dev`) — không có lỗi Edge runtime
- [ ] `KudoRichEditor` được `dynamic(() => import(...), { ssr: false })` → không import server-side
- [ ] `isomorphic-dompurify` hoạt động đúng trong Cloudflare environment
- [ ] Supabase Storage URL public reachable từ Cloudflare edge
- [ ] Image upload từ browser → phát request thẳng đến Supabase, không qua Next.js route

**Done when**: `wrangler deploy --dry-run` không lỗi; preview environment hoạt động end-to-end.

---

## Summary

| Task | Type | Effort | Priority | User Stories |
|---|---|---|---|---|
| T01 · Install packages | Dependency | XS | P0 | US4 |
| T02 · DB Migration + Storage | Database | S | P0 | US3, US6, US7 |
| T03 · Update types | Types | XS | P0 | US3, US6, US7, US8 |
| T04 · KudoRichEditor | Component CREATE | M | P1 | US4 |
| T05 · POST /api/kudos | API MODIFY | S | P1 | US3, US6, US7, US8 |
| T06 · GET /api/kudos | API MODIFY | S | P1 | US7 |
| T07 · SendKudosDialog | Component REWRITE | L | P1 | US1–US8 |
| T08 · KudoCard | Component MODIFY | S | P2 | US4, US6, US7 |
| T09 · KudosClient check | Integration | XS | P2 | US1, US8 |
| T10 · Manual QA | QA | M | P3 | US1–US8 |
| T11 · CF Workers compat | QA | S | P3 | — |

**Total**: 11 tasks | ~2–3 ngày dev (1 engineer)

**Estimated effort breakdown**:
- XS = < 30 min → T01, T03, T09: ~1.5h
- S = 30 min–2h → T02, T05, T06, T08, T11: ~6h
- M = 2–4h → T04, T10: ~6h
- L = 4–8h → T07: ~6h
- **Total estimate**: ~19–20h
