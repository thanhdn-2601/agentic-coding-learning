# Development Plan: Viết Kudo Modal

**Frame ID**: `520:11602` | **MoMorph Frame ID**: `6398`
**Stack**: Next.js 15.5.9 + Supabase Auth/DB/Storage + Cloudflare Workers
**Spec**: `.momorph/contexts/specs/viet-kudo/spec.md`
**Created**: 2026-03-25

---

## Gap Analysis — Current vs. Required

| Thành phần | Trạng thái hiện tại | Cần làm |
|---|---|---|
| `kudos.title` (Danh hiệu) | ❌ Không có trong DB | Migration thêm cột |
| `kudos.is_anonymous` | ❌ Không có trong DB | Migration thêm cột |
| `kudos.image_urls` | ❌ Không có trong DB | Migration + Storage bucket |
| `SendKudosDialog` — UI | ⚠️ Có nhưng sai design (dark theme, không có title/image/anonymous) | Rewrite theo Figma (light cream) |
| `SendKudosDialog` — Danh hiệu | ❌ Thiếu hoàn toàn | Thêm field `title` |
| Rich text editor (B/I/S/List/Link/Quote) | ❌ Plain `<textarea>` | Tích hợp TipTap |
| @mention | ❌ Không có | TipTap Mention extension |
| Image upload + thumbnails | ❌ Không có | Supabase Storage + UI |
| Gửi ẩn danh (checkbox + text field) | ❌ Không có | UI + DB field + API |
| `POST /api/kudos` — title, is_anonymous, image_urls | ❌ Thiếu | Cập nhật API |
| Mask sender khi is_anonymous | ❌ Không có | Logic trong GET API |
| Figma design — light cream modal, layout 2 cột label/input | ❌ Sai (dark theme) | Rewrite UI layout |

---

## Architecture Decisions

### Rich Text Editor: TipTap
- **Lý do**: React-first, modular, có đủ extensions cần thiết (Bold, Italic, Strike, OrderedList, Link, Blockquote, Mention), hoạt động tốt với Next.js `'use client'`, tương thích Cloudflare
- **Extensions cần dùng**: `@tiptap/starter-kit` (bold, italic, strike, orderedList, blockquote), `@tiptap/extension-link`, `@tiptap/extension-mention`, `@tiptap/extension-placeholder`, `@tiptap/extension-character-count`
- **Note**: TipTap là client-side only → không ảnh hưởng Cloudflare Workers runtime

### Image Upload: Supabase Storage (Client-side)
- **Bucket**: `kudo-images` (public read, authenticated write)
- **Flow**: Client upload trực tiếp từ browser lên Supabase Storage → lấy public URL → gửi `image_urls[]` trong body `POST /api/kudos`
- **Tại sao không qua Next.js API route**: Tránh giới hạn request body size của Cloudflare Workers (100MB limit nhưng CPU limit 10ms); upload thẳng Supabase Storage an toàn hơn
- **RLS Policy**: Authenticated users có thể INSERT vào bucket; public SELECT

### Form Validation: React State (không dùng thư viện mới)
- Giữ pattern hiện tại của codebase (controlled state, không có react-hook-form/zod)

### Anonymous Masking: Server-side trong GET API
- Khi `is_anonymous = true`: GET `/api/kudos` trả về `sender: null`, `sender_name: "Ẩn danh"` thay vì thông tin thật

---

## Task Breakdown

### Phase 1 — Database & Storage (Prerequisites)

#### Task 1.1 — Supabase Migration: Thêm cột mới vào `kudos`
**File**: `supabase/migrations/20260325000000_kudos_viet_kudo_fields.sql`

```sql
ALTER TABLE public.kudos
  -- title: DEFAULT '' để không break rows cũ; CHECK >= 1 chỉ enforce từ migration này trở đi
  -- (rows cũ đã có message nên backfill title = '' là acceptable)
  ADD COLUMN IF NOT EXISTS title          text      NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_anonymous   boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymous_name text,
  ADD COLUMN IF NOT EXISTS image_urls     text[]    NOT NULL DEFAULT '{}';

-- Thêm CHECK sau khi ADD COLUMN (không vi phạm rows cũ có DEFAULT '')
ALTER TABLE public.kudos
  ADD CONSTRAINT kudos_title_max_length CHECK (char_length(title) <= 200);

COMMENT ON COLUMN public.kudos.title          IS 'Danh hiệu — tiêu đề của Kudo; bắt buộc cho row mới, legacy rows có empty string';
COMMENT ON COLUMN public.kudos.is_anonymous   IS 'Nếu true, ẩn thông tin sender trong API và UI';
COMMENT ON COLUMN public.kudos.anonymous_name IS 'Tên hiển thị thay thế khi gửi ẩn danh (nullable)';
COMMENT ON COLUMN public.kudos.image_urls     IS 'Mảng public URL ảnh đính kèm từ Supabase Storage (tối đa 5)';
```

**Constraint note**: `title` dùng `DEFAULT ''` để không phá vỡ rows cũ. `anonymous_name` là nullable — chỉ có giá trị khi `is_anonymous = true` và user tự điền tên muốn hiển thị.

**Acceptance**: `supabase db diff` không có lỗi; local DB có 4 cột mới.

---

#### Task 1.2 — Supabase Storage: Tạo bucket `kudo-images`
**File**: Thêm vào migration hoặc tạo qua Supabase Dashboard

```sql
-- Trong migration hoặc seed
INSERT INTO storage.buckets (id, name, public)
VALUES ('kudo-images', 'kudo-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users có thể upload
CREATE POLICY "Authenticated users can upload kudo images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kudo-images');

-- Public read
CREATE POLICY "Public can view kudo images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kudo-images');
```

**Acceptance**: Upload test ảnh thành công; public URL truy cập được.

---

### Phase 2 — API Layer

#### Task 2.1 — Cập nhật `POST /api/kudos`
**File**: `src/app/api/kudos/route.ts`

**Thay đổi**:
- Accept thêm `title: string`, `is_anonymous: boolean`, `image_urls: string[]` từ request body
- Validate: `title` required, không rỗng, tối đa 200 ký tự
- Validate: `image_urls` max 5 items; mỗi URL phải là Supabase Storage URL (whitelist domain)
- Insert vào DB với các field mới

```typescript
// Body interface cần cập nhật
const { receiver_id, message, title, hashtags, is_anonymous, image_urls } = body as {
  receiver_id: string;
  message: string;
  title: string;
  hashtags: string[];
  is_anonymous?: boolean;
  image_urls?: string[];
};

if (!receiver_id || !message?.trim() || !title?.trim()) {
  return NextResponse.json({ error: 'receiver_id, message và title là bắt buộc' }, { status: 400 });
}
if (image_urls && image_urls.length > 5) {
  return NextResponse.json({ error: 'Tối đa 5 ảnh' }, { status: 400 });
}
```

**Acceptance**: `POST /api/kudos` với body đầy đủ trả về `201`; thiếu `title` trả về `400`.

---

#### Task 2.2 — Cập nhật `GET /api/kudos` — Anonymous masking
**File**: `src/app/api/kudos/route.ts`

**Thay đổi**:
- Thêm `title`, `is_anonymous`, `image_urls` vào SELECT query
- Khi `is_anonymous = true`: thay thế sender data bằng `{ id: null, full_name: 'Ẩn danh', avatar_url: null }`

```typescript
// Sau khi map kudos
const kudos = (data ?? []).map((k) => ({
  ...rest,
  sender: k.is_anonymous
    ? { id: null, full_name: k.anonymous_name ?? 'Ẩn danh', avatar_url: null }
    : k.sender,
  liked_by_me: k.kudos_likes?.some((l) => l.user_id === user.id) ?? false,
}));
```

> **Note**: Khi `is_anonymous = true` và `anonymous_name` không null → dùng `anonymous_name` làm display name. Khi `anonymous_name = null` → fallback `'Ẩn danh'`.

**Acceptance**: Kudo với `is_anonymous=true` trả về `sender.full_name = "Ẩn danh"` trong feed.

---

#### ~~Task 2.3~~ — Upload ảnh: KHÔNG cần API route riêng
> **Decision**: Upload trực tiếp từ browser qua Supabase Storage SDK. Không tạo `POST /api/kudos/upload-image` — tránh giới hạn Cloudflare Workers body/CPU.

```typescript
// Trong SendKudosDialog (client component) — Task 4.1
import { createClient } from '@/libs/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.storage
  .from('kudo-images')
  .upload(`${userId}/${Date.now()}_${file.name}`, file, { upsert: false });
if (error) throw error;
const publicUrl = supabase.storage.from('kudo-images').getPublicUrl(data.path).data.publicUrl;
```

**Không tính là task riêng** — logic này thuộc Task 4.1 (SendKudosDialog submit flow).

---

### Phase 3 — Frontend: Install & Configure TipTap

#### Task 3.1 — Cài đặt TipTap dependencies
```bash
yarn add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-mention @tiptap/extension-placeholder @tiptap/extension-character-count isomorphic-dompurify
yarn add -D @types/dompurify
```

**Packages**:
- `@tiptap/react` — React binding
- `@tiptap/pm` — ProseMirror peer dependency
- `@tiptap/starter-kit` — Bold, Italic, Strike, OrderedList, Blockquote, History...
- `@tiptap/extension-link` — Insert/edit hyperlinks
- `@tiptap/extension-mention` — @mention với dropdown suggestions
- `@tiptap/extension-placeholder` — Placeholder text
- `@tiptap/extension-character-count` — Bộ đếm ký tự (Figma D.1: "Gợi ý và bộ đếm ký tự")
- `isomorphic-dompurify` — Sanitize HTML từ TipTap trước khi render (chống XSS trên `KudoCard`)

**Cloudflare compat**: TipTap chỉ chạy client-side (`'use client'`) → không ảnh hưởng Edge runtime.

**Acceptance**: `yarn build` không lỗi; editor render được trong browser.

---

#### Task 3.2 — Tạo `KudoRichEditor` component
**File**: `src/components/kudos/KudoRichEditor.tsx`

```typescript
'use client';
// Props: value (HTML string), onChange, placeholder, mentionSuggestions
// Toolbar: Bold | Italic | Strike | OrderedList | Link | Blockquote
// Footer line (Figma D.1): hint text LEFT + character counter RIGHT
//   - Hint: 'Bạn có thể "@+tên" để nhắc tới đồng nghiệp khác'
//   - Counter: '{current}/1000' (dùng CharacterCount extension)
```

**Sub-components**:
- `ToolbarButton` — icon button với active state (border highlight khi format active)
- `LinkDialog` — modal nhỏ để nhập URL khi click Link button
- `MentionList` — dropdown gợi ý khi gõ `@`

**Styling**: Tailwind; editor content phải có `prose`-style trong nền trắng; border focus state.

**Acceptance**:
- Bold/Italic/Strike hoạt động khi select text + click button
- OrderedList tạo `1. 2. 3.` khi click
- Link button mở dialog nhập URL; chèn link vào text
- Blockquote áp dụng block-level quote style
- `@` gõ → dropdown gợi ý người dùng → click chọn → mention được chèn
- Placeholder hiển thị khi editor rỗng

---

### Phase 4 — Frontend: Rewrite `SendKudosDialog`

#### Task 4.1 — Rewrite `SendKudosDialog.tsx` theo Figma design
**File**: `src/components/kudos/SendKudosDialog.tsx`

**Design thay đổi lớn** (so với hiện tại):
- Background: **light cream** `#FEFAF0` / `#FFF8E7` (Figma), không phải dark
- Layout: Modal centered, max-width ~600px, padding `24–32px`
- Title: `text-xl font-bold text-center` — "Gửi lời cám ơn và ghi nhận đến đồng đội"
- Mỗi field: `label (inline-end/label-start)` + `input full-width` dạng 2 cột label/content

**Form fields theo thứ tự Figma**:
1. **B — Người nhận** (required): Search autocomplete with dropdown
2. **B' — Danh hiệu** (required): `<input type="text">` + hint 2 dòng
3. **C+D — Toolbar + Editor**: `KudoRichEditor` component
4. **E — Hashtag**: Chip selector, max 5
5. **F — Image**: Thumbnail grid + upload button
6. **G — Gửi ẩn danh**: Checkbox + conditional text field
7. **H — Actions**: "Hủy" (ghost) | "Gửi" (primary yellow)

**State**:
```typescript
const [receiverId, setReceiverId] = useState('');
const [title, setTitle] = useState('');
const [messageHtml, setMessageHtml] = useState('');
const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
const [images, setImages] = useState<File[]>([]);          // pre-upload
const [imageUrls, setImageUrls] = useState<string[]>([]);  // post-upload
const [isAnonymous, setIsAnonymous] = useState(false);
const [anonymousName, setAnonymousName] = useState(''); // Shown when isAnonymous = true
const [submitting, setSubmitting] = useState(false);
// Note: anonymousName gửi lên API trong body; server lưu vào kudos.anonymous_name
const [errors, setErrors] = useState<Record<string, string>>({});
```

**Validation** (client-side trước submit):
```typescript
const validate = () => {
  const e: Record<string, string> = {};
  if (!receiverId)       e.receiver = 'Vui lòng chọn người nhận';
  // title (B' Danh hiệu) required — confirmed từ screenshot review; Figma H.2 liệt kê 3 fields
  // nhưng B' không có Figma item ID nên không xuất hiện trong H.2 description
  if (!title.trim())     e.title = 'Danh hiệu không được để trống';
  if (!messageHtml || messageHtml === '<p></p>') e.message = 'Vui lòng nhập nội dung';
  if (selectedHashtags.length === 0) e.hashtags = 'Chọn ít nhất 1 hashtag';
  return e;
};
```

**Submit flow**:
1. `validate()` → nếu có lỗi: set errors + return
2. Upload images (nếu có `images[]`) → collect `imageUrls[]`
3. `POST /api/kudos` với `{ receiver_id, title, message, hashtags, is_anonymous, image_urls }`
4. On success: `onSuccess()` → `onClose()` → reset form
5. On error: hiển thị error message, re-enable button

**Accessibility**:
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Focus trap trong modal
- `Escape` → close
- Click backdrop → close

**Acceptance**: Toàn bộ User Stories 1–8 trong spec pass.

---

#### Task 4.2 — Cập nhật `KudosClient` (nếu cần)
**File**: `src/components/kudos/KudosClient.tsx`

Hiện tại `KudosClient` đã có `SendKudosDialog`. Kiểm tra xem có cần thay đổi props hay callback nào không sau khi rewrite dialog.

**Acceptance**: Trang `/kudos` vẫn hoạt động bình thường sau khi rewrite dialog.

---

### Phase 5 — Types Update

#### Task 5.1 — Cập nhật `src/types/database.ts`
Thêm `title`, `is_anonymous`, `image_urls` vào type `Kudos` và `KudosFeedItem`:

```typescript
// Trong Kudos row type
title: string;
is_anonymous: boolean;
anonymous_name: string | null;  // nullable — chỉ có value khi is_anonymous = true và user tự điền
image_urls: string[];

// Trong KudosFeedItem (extends KudosWithProfiles)
// sender đã được masked → type sender có thể là { id: null; full_name: string; avatar_url: null }
```

**Acceptance**: Không có TypeScript error sau khi thêm fields.

---

### Phase 6 — QA & Integration

#### Task 6.1 — End-to-end test flows
Kiểm tra thủ công các luồng:

| Luồng | Expected |
|---|---|
| Mở modal → điền đủ 4 trường → Gửi | 201, modal đóng, feed reload |
| Mở modal → nhấn Gửi khi form rỗng | Errors highlight, không gọi API |
| Upload 5 ảnh → thêm ảnh thứ 6 | Nút "+ Image" ẩn |
| Gửi ẩn danh → xem trên feed | Sender hiện "Ẩn danh" |
| Gõ `@Thanh` trong editor | Dropdown gợi ý xuất hiện |
| Click Bold → gõ text | Text in đậm |
| Nhấn Escape | Modal đóng |
| Click overlay | Modal đóng |

#### Task 6.2 — Kiểm tra Cloudflare Workers compat
- Chạy `make preview` hoặc `yarn preview` để test trên Cloudflare local
- Verify image upload flow hoạt động khi deploy (Supabase Storage URL reachable)
- Verify TipTap không có Node.js API nào gây lỗi Edge runtime

---

## File Changes Summary

| File | Action | Notes |
|---|---|---|
| `supabase/migrations/20260325000000_kudos_viet_kudo_fields.sql` | CREATE | 4 cột mới: title, is_anonymous, anonymous_name, image_urls + Storage bucket + RLS |
| `src/app/api/kudos/route.ts` | MODIFY | POST: accept 4 fields mới; GET: masking sender + trả về title/image_urls |
| `src/types/database.ts` | MODIFY | Thêm 4 fields mới vào Kudos types |
| `src/components/kudos/KudoRichEditor.tsx` | CREATE | TipTap editor component (toolbar + @mention + placeholder) |
| `src/components/kudos/SendKudosDialog.tsx` | REWRITE | Toàn bộ UI theo Figma light cream, full feature set |
| `src/components/kudos/KudoCard.tsx` | MODIFY | Render `message` HTML (DOMPurify sanitize), hiển thị `title`, ảnh, anonymous sender |
| `package.json` | MODIFY | Thêm TipTap + isomorphic-dompurify dependencies |
| `src/components/kudos/KudosClient.tsx` | MODIFY (minor) | Kiểm tra/adjust props nếu cần |

---

## Dependencies cần cài thêm

```bash
yarn add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-mention @tiptap/extension-placeholder @tiptap/extension-character-count isomorphic-dompurify
yarn add -D @types/dompurify
```

---

## Thứ tự thực hiện (Recommended)

```
Task 1.1 → Task 1.2   (DB migration trước)
     ↓
Task 2.1 → Task 2.2   (API sau khi DB ready)
     ↓
Task 5.1               (Types để TypeScript không báo lỗi)
     ↓
Task 3.1 → Task 3.2   (Install TipTap + build editor component)
     ↓
Task 4.1               (Rewrite dialog — cần editor component)
     ↓
Task 4.2               (Minor KudosClient check)
     ↓
Task 6.1 → Task 6.2   (QA)
```

**Total: 11 tasks** | Độc lập nhau theo phase; DB/API phải xong trước Frontend.

---

## Risks & Notes

| Risk | Mitigation |
|---|---|
| TipTap bundle size tăng (~80KB gzip) | Lazy import với `dynamic(() => import('./KudoRichEditor'), { ssr: false })` |
| Supabase Storage upload từ browser cần session | Dùng `createBrowserClient`; session đã có từ SSR |
| `message` field hiện là plain text trong DB; sau khi dùng TipTap sẽ là HTML | `message` lưu HTML từ TipTap; render bằng `dangerouslySetInnerHTML` với `isomorphic-dompurify` sanitize trên `KudoCard` |
| `title` cột có `DEFAULT ''` — rows cũ sẽ có empty string | Chấp nhận empty string cho legacy data; client-side và API enforce `title` required chỉ cho request mới |
| XSS từ rich text HTML | `isomorphic-dompurify` sanitize trước `dangerouslySetInnerHTML` trên `KudoCard` |
| `anonymous_name` có thể bị inject HTML | Render plain text, không dùng `dangerouslySetInnerHTML` cho trường này |
| Upload ảnh thất bại giữa chừng (1/5 ảnh lỗi) | Upload từng ảnh tuần tự; nếu có lỗi: rollback bằng cách delete các ảnh đã upload trước đó, hiện toast lỗi |
