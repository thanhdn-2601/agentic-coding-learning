# Project Constitution

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Cloudflare Workers (via OpenNext) · Wrangler

Mọi agent, developer, và công cụ tự động **phải** đọc và tuân thủ tài liệu này trước khi sinh code hoặc chỉnh sửa codebase.

---

## 1. Nguyên tắc chung (Clean Code)

- **Một file, một trách nhiệm** – mỗi file chỉ xử lý một mối quan tâm duy nhất.
- **Đặt tên rõ ràng, mô tả đúng ý nghĩa** – tránh abbreviation mơ hồ (`usrDt` → `userData`).
- **Hàm ngắn, tập trung** – một hàm chỉ làm một việc, tối đa ~30 dòng; tách hàm nếu cần.
- **Không lặp lại (DRY)** – trích xuất logic dùng chung thành helper/hook/service; không copy-paste.
- **Không để code chết** – xoá selector, import, biến không dùng trước khi commit.
- **Ưu tiên đọc hiểu** – code dễ đọc > code ngắn; thêm comment chỉ khi logic không hiển nhiên.
- **Immutability** – ưu tiên `const`, spread operator, và immutable patterns; tránh mutation trực tiếp.
- **Indentation:** 2 spaces. **Line width:** ~100 ký tự. **Quotes:** single quotes; template literals cho interpolation.

---

## 2. Tổ chức Source Code

```
src/
├── app/                        # Next.js App Router (pages & layouts)
│   ├── (auth)/                 # Route group: authentication
│   ├── (dashboard)/            # Route group: authenticated area
│   ├── api/                    # API Route Handlers
│   │   └── [resource]/
│   │       └── route.ts        # Controller — mỏng, không chứa business logic
│   ├── globals.css
│   └── layout.tsx
├── components/                 # Shared UI components (pure, no data-fetching)
│   ├── ui/                     # Atomic: Button, Input, Modal, Badge…
│   └── [feature]/              # Feature-scoped composite components
├── hooks/                      # Custom React hooks
├── libs/                       # Third-party integrations
│   └── supabase/
│       ├── client.ts           # Browser client
│       ├── server.ts           # Server client (Server Components / Actions)
│       └── middleware.ts       # Middleware client
├── services/                   # Business logic layer (pure TS, framework-agnostic)
├── types/                      # Global TypeScript types / interfaces / enums
└── utils/                      # Pure utility functions (no side-effects)
```

**Quy tắc đặt tên:**
| Loại | Convention | Ví dụ |
|---|---|---|
| React component / Page | PascalCase | `UserCard.tsx`, `LoginPage.tsx` |
| Non-component module | kebab-case | `user-service.ts`, `format-date.ts` |
| CSS / Asset file | kebab-case | `hero-image.png`, `google-icon.svg` |
| Folder | kebab-case | `auth/`, `user-profile/` |
| Constant | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Type / Interface | PascalCase | `UserProfile`, `ApiResponse<T>` |

**Asset placement:** `public/assets/{group}/{icons|images|logos}/`

---

## 3. Next.js Best Practices

### Architecture phân tầng
```
Route Handler (route.ts)  →  Service (*.service.ts)  →  Supabase / External API
```
- **Route Handler** chỉ làm: parse request, validate input, gọi service, format response.
- **Service** chứa toàn bộ business logic — thuần TypeScript, không import `next/*`.
- **Không** đặt business logic trực tiếp trong route handler hoặc Server Component.

### Server vs Client Components
- Mặc định dùng **Server Component** – chỉ thêm `'use client'` khi thực sự cần (event handlers, browser APIs, hooks).
- Fetch data ở Server Component; truyền xuống Client Component qua props.
- Dùng **Server Actions** (`'use server'`) cho các mutation form thay vì tạo API route riêng khi có thể.

### Data Fetching
- Luôn khai báo kiểu trả về rõ ràng cho kết quả fetch.
- Xử lý trạng thái loading và error – không để UI trống trơn khi fetch thất bại.
- Dùng `cache: 'no-store'` cho dữ liệu realtime; `revalidate` cho dữ liệu semi-static.

### Routing & Navigation
- Dùng `<Link>` của Next.js thay vì `<a>` cho internal navigation.
- Dùng `redirect()` (server) hoặc `router.push()` (client) sau khi thực hiện action.
- Tổ chức route groups `(group)` để nhóm layout mà không ảnh hưởng URL.

### Middleware
- `middleware.ts` chỉ xử lý: auth guard, header injection, redirect — phải gọn nhẹ.
- Cấu hình `matcher` rõ ràng, tránh chạy middleware trên static assets.

### Error Handling
- Tạo `error.tsx` và `not-found.tsx` cho mỗi segment cần thiết.
- Dùng `try/catch` trong Server Actions; trả về `{ error }` thay vì throw để Client xử lý.

---

## 4. Cloudflare Workers Best Practices

### Giới hạn Runtime
- Cloudflare Workers chạy trên **V8 isolate** — không có Node.js built-ins mặc định.
- Kích hoạt `nodejs_compat` flag trong `wrangler.jsonc` (đã được cấu hình).
- Không dùng `fs`, `path`, `child_process` — thay bằng Web APIs (`fetch`, `crypto`, `Request`/`Response`).
- Tránh blocking I/O — luôn dùng `async/await` với Promise-based APIs.

### Bindings & Secrets
- **Không hard-code** API keys, connection strings, hay credentials trong code.
- Dùng `wrangler secret put VAR_NAME` cho dữ liệu nhạy cảm ở production.
- Truy cập bindings (KV, R2, D1, Queue…) qua `getCloudflareContext()` từ `@opennextjs/cloudflare`.
- Khai báo type đầy đủ trong `cloudflare-env.d.ts`.

### Performance
- Workers có **CPU time limit** (~50ms free / 30s paid) — tránh heavy computation đồng bộ.
- Tận dụng **Cloudflare Cache API** để cache response khi phù hợp.
- Dùng **Smart Placement** (`"mode": "smart"`) cho latency-sensitive workloads khi cần.

### Observability
- `observability.enabled: true` đã được bật — log đủ thông tin để debug nhưng không log PII.

---

## 5. Supabase Best Practices

### Client Selection
| Ngữ cảnh | Client | File |
|---|---|---|
| Server Component, Route Handler, Server Action | `createClient()` | `libs/supabase/server.ts` |
| Client Component (browser) | `createBrowserClient()` | `libs/supabase/client.ts` |
| Middleware | `createClient(request)` | `libs/supabase/middleware.ts` |

- **Không** dùng browser client trong Server Component hay Route Handler.
- **Không** import `service_role` key ở client-side — chỉ dùng server-side khi thực sự cần bypass RLS.

### Row Level Security (RLS)
- **Bật RLS** cho mọi bảng chứa dữ liệu người dùng — không có ngoại lệ.
- Viết policy tối thiểu cần thiết (principle of least privilege).
- Kiểm tra policy trong Supabase Dashboard trước khi deploy.

### Auth
- Dùng Supabase Auth (`supabase.auth.*`) — không tự implement authentication.
- Refresh session trong middleware để đảm bảo token luôn hợp lệ (đã implement tại `middleware.ts`).
- Kiểm tra `session` phía server trước khi trả về dữ liệu nhạy cảm.

### Database
- Dùng **typed queries** với generated types từ `supabase gen types`.
- Ưu tiên Supabase realtime subscription cho real-time features thay vì polling.
- Đặt migration trong `supabase/migrations/` và seed data trong `supabase/seeds/`.
- Tham khảo `db_guidelines/` cho ORM-specific conventions.

### Secrets
- `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` là an toàn để expose.
- `SUPABASE_SERVICE_ROLE_KEY` **không bao giờ** được dùng ở client-side hoặc commit vào repo.

---

## 6. Responsive Design

### Breakpoint Strategy (Tailwind v4)
```
Mobile-first — viết style cho mobile trước, dùng breakpoint prefix để override lên kích thước lớn hơn.

sm:   ≥ 640px   (large phone / small tablet landscape)
md:   ≥ 768px   (tablet portrait)
lg:   ≥ 1024px  (tablet landscape / small laptop)
xl:   ≥ 1280px  (desktop)
2xl:  ≥ 1536px  (large desktop)
```

### Quy tắc bắt buộc
- **Mobile-first:** viết base style (không prefix) cho mobile; thêm `md:`, `lg:`, `xl:` để responsive.
- **Fluid layout:** dùng `flex`, `grid`, `w-full`, `max-w-*`, `container` thay vì fixed pixel width.
- **Touch targets:** interactive element tối thiểu `44×44px` trên mobile (`min-h-11 min-w-11`).
- **Font size:** đừng dùng font nhỏ hơn `12px` (≈ `text-xs`) trên mobile.
- **Images:** luôn khai báo `width`, `height` và dùng `next/image` với responsive `sizes` prop.
- **Overflow:** tránh horizontal scroll ở mobile — không dùng fixed width vượt quá viewport.
- **Test breakpoints:** kiểm tra UI ở tối thiểu 375px (mobile), 768px (tablet), 1280px (desktop).

### Ví dụ pattern
```tsx
// Grid responsive
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

// Typography scale
<h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">

// Padding layout
<section className="px-4 py-8 md:px-8 lg:px-16">

// Container
<div className="container mx-auto px-4">
```

---

## 7. Bảo mật (OWASP Top 10)

### A01 – Broken Access Control
- Kiểm tra authorization phía **server** trước mọi action — không tin client.
- Bật RLS cho tất cả bảng Supabase; không trả về dữ liệu người dùng khác.
- Dùng `withAuth` wrapper pattern cho Route Handlers cần authentication.
- Middleware redirect về `/login` nếu session không hợp lệ.

### A02 – Cryptographic Failures
- HTTPS enforced mặc định trên Cloudflare — không disable.
- **Không** lưu password, token, secrets ở localStorage hay cookie không httpOnly.
- Supabase Auth tokens được set với `httpOnly`, `secure`, `sameSite` flags tự động.
- **Không** log hoặc expose sensitive data (passwords, tokens, PII) trong console hay response.

### A03 – Injection (SQL, XSS, Command)
- **SQL Injection:** luôn dùng Supabase query builder hoặc parameterized queries — không string concat SQL.
- **XSS:** React escape content mặc định — không dùng `dangerouslySetInnerHTML` trừ khi đã sanitize (dùng `DOMPurify`).
- **Command Injection:** không dùng `exec`, `spawn`, `eval` với user input — Workers không có shell access.

### A04 – Insecure Design
- Thiết kế với **principle of least privilege** — chỉ cấp quyền tối thiểu cần thiết.
- Không để debug endpoints/logs active ở production.
- Rate limiting cho auth endpoints (Supabase Auth có built-in, tuning qua `config.toml`).

### A05 – Security Misconfiguration
- Không commit `.env`, secrets, hay `service_role` key — dùng `.env.example` làm template.
- Review `_headers` file trong `public/` để đảm bảo security headers đúng:
  ```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=()
  Content-Security-Policy: default-src 'self'; ...
  ```
- Cloudflare `observability` không log request body — kiểm tra trước khi enable verbose logging.

### A06 – Vulnerable Components
- Kiểm tra `yarn audit` định kỳ và khi thêm dependency.
- Không thêm package nếu chức năng đã có trong Web APIs, Next.js, hoặc Supabase SDK.
- Pin major versions trong `package.json`; review changelog khi upgrade.

### A07 – Identification & Authentication Failures
- Dùng Supabase Auth — không tự implement authentication logic.
- Enforce session refresh trong middleware (đã có).
- Logout invalidate server-side session, không chỉ xoá cookie client.
- Không expose user ID hay email trong URL path — dùng opaque identifiers khi cần.

### A08 – Software & Data Integrity Failures
- Validate và sanitize mọi input từ user ở server-side trước khi xử lý.
- Verify nguồn gốc webhook (chữ ký HMAC) trước khi xử lý.
- Không tự động thực thi code từ nguồn ngoài.

### A09 – Logging & Monitoring Failures
- Log đủ thông tin: action, user ID (không email/password), timestamp, IP nếu cần.
- **Không** log: passwords, tokens, thẻ tín dụng, dữ liệu cá nhân nhạy cảm.
- Cloudflare `observability` đã enabled — tận dụng để monitor errors.

### A10 – SSRF (Server-Side Request Forgery)
- **Không** fetch URL được cung cấp trực tiếp từ user input mà không validate.
- Whitelist các domain được phép fetch nếu tính năng yêu cầu user-provided URLs.
- Cloudflare flag `global_fetch_strictly_public` đã enabled — ngăn fetch internal IPs.

---

## 8. TypeScript

- **Strict mode** bật (`"strict": true` trong `tsconfig.json`).
- **Không dùng `any`** — dùng `unknown` và type guard, hoặc define type rõ ràng.
- Dùng `type` cho union/intersection; `interface` cho object shapes có thể extend.
- Generate Supabase types: `supabase gen types typescript --local > src/types/database.ts`.
- Export types từ `src/types/` — không định nghĩa type inline trong component.

---

## 9. Code Quality & Tooling

- **ESLint:** chạy `yarn lint` trước commit — zero warnings/errors.
- **TypeScript:** chạy `tsc --noEmit` để type-check.
- **Format:** tuân theo `.editorconfig` (2 spaces, LF, UTF-8).
- **Commit message:** dùng Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`).
- **Import order:** external packages → internal aliases (`@/`) → relative paths.
- Không commit code có `console.log`, `TODO` chưa có issue reference, hay commented-out code.

---

## 10. Design System & CSS Tokens

- Đọc `frontend.md` trước khi viết UI code.
- Định nghĩa design tokens làm CSS variables trong `src/app/globals.css`.
- Dùng Tailwind utility classes ánh xạ tới tokens — không hard-code màu/spacing/font.
- Theme dark mode qua `prefers-color-scheme` hoặc class `dark:`.
- Tham khảo `.momorph/contexts/group_specs/` cho shared resources.

---

*Tài liệu này là nguồn thẩm quyền duy nhất về quy ước dự án. Khi có mâu thuẫn, tài liệu này được ưu tiên hơn các comment inline hay hướng dẫn cục bộ.*
