# Feature Specification: Login Screen

**Frame ID**: `662:14387`
**Frame Name**: `Login`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph Frame ID**: `6381`
**Figma Link**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=662:14387
**Created**: 2026-03-23
**Status**: Draft

---

## Overview

Màn hình Login là điểm vào duy nhất của ứng dụng SAA 2025 (Sun Annual Awards 2025). Người dùng chỉ có thể đăng nhập thông qua tài khoản Google (Google OAuth). Sau khi xác thực thành công, người dùng được chuyển đến trang chính của ứng dụng.

Màn hình có bố cục fullscreen với:
- Header cố định phía trên (logo + language selector)
- Khu vực Hero chiếm toàn bộ viewport với artwork "ROOT FURTHER"
- Nút Login With Google nằm bên trái phía dưới hero text
- Footer cố định phía dưới với copyright

---

## User Scenarios & Testing

### User Story 1 — Google Login thành công (Priority: P1)

Unauthenticated user mở ứng dụng, bấm "LOGIN With Google", hoàn tất xác thực Google, được redirect đến màn hình chính.

**Why this priority**: Đây là luồng duy nhất để vào ứng dụng — không có luồng này, toàn bộ app không dùng được.

**Independent Test**: Có thể test hoàn toàn độc lập; chỉ cần trang Login và Google OAuth hoạt động, không phụ thuộc màn hình khác.

**Acceptance Scenarios**:

1. **Given** người dùng chưa đăng nhập, **When** truy cập `/`, **Then** trang Login được hiển thị đầy đủ với button "LOGIN With Google".
2. **Given** trang Login đang hiển thị, **When** bấm "LOGIN With Google", **Then** redirect đến Google OAuth (không dùng popup).
3. **Given** người dùng hoàn tất Google OAuth, **When** quay lại ứng dụng, **Then** được redirect đến trang chính (dashboard).
4. **Given** người dùng lần đầu đăng nhập qua Google, **When** OAuth thành công, **Then** profile được tạo tự động trong bảng `profiles` với `email`, `full_name`, `avatar_url`.

---

### User Story 2 — Redirect khi đã đăng nhập (Priority: P2)

Người dùng đã có session hợp lệ cố truy cập trang Login.

**Why this priority**: Ngăn người dùng đã đăng nhập quay lại trang Login, cải thiện UX và security.

**Independent Test**: Cần một session hợp lệ, sau đó navigate đến `/login`.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập, **When** truy cập `/` hoặc `/login`, **Then** được redirect đến trang chính mà không qua màn hình Login.
2. **Given** người dùng đã đăng nhập, **When** session hết hạn và refresh page, **Then** được redirect về trang Login.

---

### User Story 3 — Chọn ngôn ngữ (Priority: P3)

Người dùng chuyển đổi ngôn ngữ giữa Tiếng Việt và English trên trang Login.

**Why this priority**: Đây là tính năng hỗ trợ; ứng dụng vẫn dùng được nếu chỉ có một ngôn ngữ.

**Independent Test**: Có thể test riêng trên trang Login mà không cần đăng nhập.

**Acceptance Scenarios**:

1. **Given** trang Login hiển thị, **When** bấm vào "VN" (language selector), **Then** dropdown hiển thị 2 tuỳ chọn: "VN" và "EN".
2. **Given** dropdown ngôn ngữ đang mở, **When** chọn "EN", **Then** dropdown đóng, badge hiển thị "EN", giao diện chuyển sang tiếng Anh.
3. **Given** dropdown ngôn ngữ đang mở, **When** giữ nguyên "VN", **Then** dropdown đóng, không có thay đổi.
4. **Given** dropdown ngôn ngữ đang mở, **When** bấm ra ngoài dropdown, **Then** dropdown đóng.
5. **Given** người dùng chọn ngôn ngữ trước khi đăng nhập, **When** đăng nhập thành công, **Then** preference ngôn ngữ được lưu vào `profiles.locale` và giao diện giữ nguyên ngôn ngữ đã chọn.
6. **Given** người dùng chưa đăng nhập, **When** chọn ngôn ngữ, **Then** locale được lưu vào cookie `NEXT_LOCALE` để persist qua page reload.
7. **Given** dropdown ngôn ngữ đang mở, **When** nhấn phím `Escape`, **Then** dropdown đóng và focus trở về trigger button.

---

### Edge Cases

- Người dùng bấm Login nhưng huỷ Google OAuth → nút trở lại trạng thái bình thường, không lỗi.
- Google OAuth thất bại (lỗi mạng, account bị khóa) → hiển thị thông báo lỗi phù hợp.
- **OAuth redirect bị gián đoạn** (đóng tab, mất mạng giữa chừng redirect) → session không được tạo, quay lại `/login` hiển thị trạng thái bình thường (không lỗi).
- Khi đang xử lý đăng nhập → nút Login bị disabled, hiển thị loading indicator.
- `/auth/callback` nhận `?error=...` (OAuth bị từ chối) → redirect về `/login?error=oauth_failed`, hiển thị toast lỗi.
- Màn hình trên mobile (375px) → layout responsive, button vẫn tap-friendly (min 44×44px).
- Người dùng đóng tab trong khi OAuth → session không được tạo, trang Login hiển thị bình thường khi mở lại.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component ID | Name | Description | Interaction |
|---|---|---|---|
| A (662:14391) | A_Header | Header cố định, cao 80px, nền `rgba(11, 15, 18, 0.8)` | Luôn hiển thị phía trên |
| A.1 (I662:14391;186:2166) | Logo | Logo SAA 2025, góc trái, 52×48px | Không tương tác |
| A.2 (I662:14391;186:1601) | Language Selector | Trigger button VN/EN với cờ + mã ngôn ngữ + chevron, góc phải, 108×56px | Click → toggle Dropdown ngôn ngữ (frame `721:4942`) |
| A.2.1 (525:11713) | Dropdown-List | Panel dropdown với 2 items xếp dọc | Hiển thị khi trigger được click |
| A.2.1a (I525:11713;362:6085) | VN Option | Cờ Việt Nam + label "VN", 110×56px | Click → chọn VN, đóng dropdown |
| A.2.1b (I525:11713;362:6128) | EN Option | Cờ Anh + label "EN", 110×56px | Click → chọn EN, đóng dropdown |
| B (662:14393) | B_Bìa (Hero) | Hero section, padding 96px 144px, toàn viewport | Không tương tác |
| B.1 (662:14395) | Key Visual | Ảnh "ROOT FURTHER", 451×200px | Không tương tác, decorative |
| B.2 (662:14753) | Content text | 2 dòng giới thiệu, font Montserrat 20px/Bold | Không tương tác |
| B.3 (662:14425) | Login Button | "LOGIN With Google", 305×60px, nền `#FFEA9E`, bo góc 8px | Click → Google OAuth |
| C (662:14388) | Key Visual Background | Artwork fullscreen background | Không tương tác, decorative |
| D (662:14447) | D_Footer | Footer, padding 40px 90px, border-top | Không tương tác |

### Navigation Flow

- **From**: URL mặc định `/` (unauthenticated)
- **To**: Trang chính / dashboard (sau khi login thành công)
- **Triggers**:
  - Click "LOGIN With Google" → Google OAuth flow → redirect về `/auth/callback` → redirect đến trang chính
  - Supabase Auth session đã có → redirect về trang chính tự động (middleware)

### Visual Requirements

- **Responsive breakpoints**: mobile (375px), tablet (768px), desktop (1440px)
- **Background**: Gradient overlay `linear-gradient(90deg, #00101A 0%, #00101A 25.41%, rgba(0, 16, 26, 0) 100%)` phủ lên artwork
- **Hover state**: Button Login có hiệu ứng nâng nhẹ / shadow khi hover
- **Loading state**: Khi xử lý OAuth, button disabled + loading spinner
- **Accessibility**: Button có `aria-label`, focus ring visible, contrast ratio ≥ 4.5:1

---

## Requirements

### Functional Requirements

- **FR-001**: Người dùng PHẢI có thể đăng nhập bằng Google (Google OAuth 2.0 qua Supabase Auth).
- **FR-002**: Hệ thống PHẢI tự động tạo `profile` cho người dùng mới sau khi Google OAuth thành công.
- **FR-003**: Hệ thống PHẢI redirect người dùng đã có session hợp lệ về trang chính, không qua Login.
- **FR-004**: Người dùng PHẢI có thể chuyển ngôn ngữ (VN/EN) trên trang Login.
- **FR-005**: Button Login PHẢI bị disabled trong khi đang xử lý xác thực.
- **FR-006**: Hệ thống PHẢI lưu preference ngôn ngữ vào `profiles.locale` sau khi đăng nhập thành công — cả lần đầu (tạo profile) lẫn lần sau (update profile nếu `NEXT_LOCALE` cookie khác với giá trị hiện tại).
- **FR-007**: Hệ thống PHẢI lưu locale đã chọn trước khi đăng nhập vào cookie `NEXT_LOCALE` để persist qua reload và sử dụng sau khi login.
- **FR-008**: Route `/auth/callback` PHẢI xử lý OAuth error và redirect về `/login?error=oauth_failed` kèm thông báo lỗi.

### Technical Requirements

- **TR-001**: Sử dụng `@supabase/ssr` để handle OAuth flow trên Next.js App Router.
- **TR-002**: Route `/auth/callback/route.ts` phải xử lý code exchange sau Google OAuth; nếu có `?error=` param, redirect về `/login?error=oauth_failed`.
- **TR-003**: `middleware.ts` phải refresh session và redirect unauthenticated users về `/login`.
- **TR-004**: Không lưu token hoặc session data vào `localStorage` — dùng httpOnly cookie (Supabase SSR default).
- **TR-005**: Trang Login là Server Component, nút Login là Client Component (`'use client'`).
- **TR-006**: Các biến môi trường bắt buộc: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (URL gốc của app, dùng cho `redirectTo` trong OAuth flow).
- **TR-007**: Sử dụng `next-intl` theo **cookie-based approach** (không dùng URL prefix như `/vi/...`). Locale preference lưu trong cookie `NEXT_LOCALE` (server-readable, path `/`). Default locale: `vi`. Supported: `['vi', 'en']`. Message files: `messages/vi.json`, `messages/en.json`.
- **TR-008**: `signInWithOAuth` sử dụng redirect flow (không dùng popup) để tránh vấn đề popup bị browser chặn.

### Key Entities

- **Profile**: Được tạo sau Google OAuth thành công. Fields: `id` (auth.users.id), `email`, `full_name`, `avatar_url`, `locale`, `department_id` (FK departments, nullable), `kudos_star_tier` (int, nullable, default null), `role` (enum: `'user' | 'admin'`, default `'user'`).
- **Session**: Managed bởi Supabase Auth. Được refresh tự động trong middleware.

---

## Implementation Notes

### File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Server Component — kiểm tra session, render LoginPage
│   └── auth/
│       └── callback/
│           └── route.ts          # Route Handler — OAuth code exchange + error redirect
├── components/
│   └── auth/
│       ├── LoginButton.tsx       # Client Component — Google login button + loading state
│       └── LanguageSelector.tsx  # Client Component — VN/EN dropdown, writes NEXT_LOCALE cookie
├── i18n/
│   └── routing.ts                # next-intl routing config (locales: ['vi', 'en'], defaultLocale: 'vi')
└── messages/
    ├── vi.json                   # Vietnamese strings
    └── en.json                   # English strings
```

### Supabase Auth Flow

```
User clicks "LOGIN With Google"
  → supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` })
  → Google OAuth redirect (redirect flow, không dùng popup)
  → Return to /auth/callback?code=...  OR  /auth/callback?error=access_denied
  → If error: redirect('/login?error=oauth_failed')
  → If code: supabase.auth.exchangeCodeForSession(code)
  → If first login: DB trigger creates profiles row from auth.users metadata
  → Update profiles.locale with NEXT_LOCALE cookie value (if set)
  → If Date.now() < new Date(NEXT_PUBLIC_EVENT_DATETIME).getTime() → Redirect to /prelaunch
  → Else → Redirect to / (dashboard)
```

### Middleware Guard

```typescript
// middleware.ts — redirect unauthenticated users
// IMPORTANT: /auth/callback must be public so OAuth code exchange can complete
const PUBLIC_PATHS = ['/login', '/auth/callback'];
const isPublic = PUBLIC_PATHS.some(p => request.nextUrl.pathname.startsWith(p));

if (!session && !isPublic) {
  return NextResponse.redirect(new URL('/login', request.url));
}
if (session && request.nextUrl.pathname === '/login') {
  const eventDatetime = process.env.NEXT_PUBLIC_EVENT_DATETIME;
  const isPrelaunch = eventDatetime ? Date.now() < new Date(eventDatetime).getTime() : false;
  return NextResponse.redirect(new URL(isPrelaunch ? '/prelaunch' : '/', request.url));
}
```
