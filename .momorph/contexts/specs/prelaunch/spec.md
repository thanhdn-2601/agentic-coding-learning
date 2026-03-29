# Feature Specification: Countdown - Prelaunch Page

**Frame ID**: `2268:35127`
**Frame Name**: `Countdown - Prelaunch page`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph Frame ID**: `6380`
**Figma Link**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=2268:35127
**Created**: 2026-03-23
**Status**: Draft

---

## Overview

Trang Prelaunch (Countdown) là màn hình "phòng chờ" hiển thị với người dùng đã đăng nhập khi chương trình SAA 2025 chưa bắt đầu (thời điểm hiện tại < `EVENT_DATETIME`). Thay vì chuyển đến Homepage đầy đủ, hệ thống hiển thị trang này với đồng hồ đếm ngược LED đến thời điểm khai mạc.

Khi đồng hồ về 0 (sự kiện bắt đầu), hệ thống tự động chuyển người dùng đến Homepage.

Trang gồm:
- **Background fullscreen**: Artwork keyvisual (`2268:35129`).
- **Countdown section**: 3 khối LED số — DAYS / HOURS / MINUTES — cập nhật tự động mỗi phút.
- **Header** (tùy chọn): Logo + Language Selector (dùng chung với Login/Homepage).
- **Hero text**: Tiêu đề chiến dịch phía trên countdown (ROOT FURTHER / SAA 2025).

---

## User Scenarios & Testing

### User Story 1 — Xem trang Prelaunch sau khi đăng nhập (Priority: P1)

Người dùng đăng nhập thành công nhưng sự kiện SAA 2025 chưa bắt đầu — được redirect đến trang Prelaunch thay vì Homepage.

**Why this priority**: Đây là luồng bắt buộc trong giai đoạn tiền sự kiện — toàn bộ người dùng đăng nhập sẽ thấy trang này.

**Independent Test**: Mock `NEXT_PUBLIC_EVENT_DATETIME` với thời điểm tương lai; kiểm tra sau khi OAuth thành công.

**Acceptance Scenarios**:

1. **Given** người dùng đăng nhập thành công qua Google OAuth, **When** `Date.now() < EVENT_DATETIME`, **Then** được redirect đến trang Prelaunch thay vì Homepage.
2. **Given** trang Prelaunch đang hiển thị, **When** quan sát đồng hồ, **Then** hiển thị 3 khối: DAYS / HOURS / MINUTES với 2 chữ số LED mỗi khối, zero-padded.
3. **Given** người dùng chưa đăng nhập, **When** truy cập đường dẫn Prelaunch, **Then** middleware redirect về `/login`.
4. **Given** người dùng đã đăng nhập và sự kiện ĐÃ bắt đầu (`Date.now() >= EVENT_DATETIME`), **When** truy cập trang Prelaunch, **Then** được redirect tự động đến Homepage (`/`).

---

### User Story 2 — Đồng hồ đếm ngược cập nhật tự động (Priority: P1)

Đồng hồ hiển thị thời gian còn lại chính xác và cập nhật theo thời gian thực.

**Why this priority**: Đây là chức năng duy nhất của trang — nếu countdown sai hoặc không cập nhật, trang không có giá trị.

**Independent Test**: Set `EVENT_DATETIME` = "now + 1 ngày 5 giờ 30 phút"; reload trang; chờ qua 1 phút; kiểm tra MINUTES giảm 1.

**Acceptance Scenarios**:

1. **Given** trang Prelaunch load xong, **When** thời gian còn lại là ví dụ 3 ngày 14 giờ 25 phút, **Then** DAYS hiển thị "03", HOURS hiển thị "14", MINUTES hiển thị "25".
2. **Given** đồng hồ đang chạy, **When** hết 1 phút, **Then** MINUTES giảm 1 — cập nhật tự động không cần reload.
3. **Given** DAYS = 0, HOURS = 0, MINUTES > 0, **When** quan sát, **Then** DAYS = "00", HOURS = "00"; MINUTES tiếp tục đếm ngược đúng.
4. **Given** đồng hồ đang chạy, **When** countdown về "00 00 00", **Then** hệ thống tự động redirect người dùng đến Homepage (`/`).
5. **Given** `NEXT_PUBLIC_EVENT_DATETIME` không được set hoặc giá trị không hợp lệ, **When** trang load, **Then** đồng hồ hiển thị "00 00 00", không crash.

---

### User Story 3 — Chọn ngôn ngữ trên trang Prelaunch (Priority: P3)

Người dùng chuyển đổi ngôn ngữ từ header trên trang Prelaunch.

**Acceptance Scenarios**:

1. **Given** header hiển thị với Language Selector, **When** click "VN"/"EN" trigger, **Then** dropdown mở với 2 tùy chọn.
2. **Given** dropdown ngôn ngữ đang mở, **When** chọn "EN", **Then** giao diện chuyển sang tiếng Anh, nhãn countdown ("DAYS", "HOURS", "MINUTES") đổi sang tiếng Anh.
3. **Given** người dùng đã chọn "EN", **When** reload trang, **Then** vẫn hiển thị tiếng Anh (locale persist qua cookie `NEXT_LOCALE`).

---

### Edge Cases

- `EVENT_DATETIME` parse thất bại (chuỗi không hợp lệ) →`getTimeRemaining()` trả về `{ days: 0, hours: 0, minutes: 0, isOver: true }` → redirect về Homepage.
- Người dùng mở tab trong khi countdown đang chạy, rồi để tab inactive nhiều giờ → khi quay lại tab, `setInterval` tự recalculate, hiển thị thời gian chính xác.
- Khi component unmount (tab đóng, navigate đi) → `clearInterval` để tránh memory leak.
- Người dùng thay đổi timezone máy tính trong khi trang mở → countdown tính lại so với `EVENT_DATETIME` ISO string (absolute time, không bị ảnh hưởng timezone local).
- Trên mobile (375px) → các khối LED vẫn hiển thị cân bằng, không overflow.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component ID | No | Name | Description | Interaction |
|---|---|---|---|---|
| `2268:35129` | — | Background | Artwork keyvisual PNG fullscreen | `object-cover`, `object-center`, decorative |
| `2268:35139` | 1 | 1_Days | Khối đếm ngược DAYS: 2 ô số kiểu LED + nhãn "DAYS" màu trắng | Auto-update |
| `2268:35144` | 2 | 2_Hours | Khối đếm ngược HOURS: 2 ô số kiểu LED + nhãn "HOURS" màu trắng | Auto-update |
| `2268:35149` | 3 | 3_Minutes | Khối đếm ngược MINUTES: 2 ô số kiểu LED + nhãn "MINUTES" màu trắng | Auto-update |

### Countdown Display Format

| Field | Range | Zero-pad | Label |
|---|---|---|---|
| DAYS | 0–999 | 2 digits minimum (e.g. `03`) | "DAYS" |
| HOURS | 0–23 | 2 digits (e.g. `09`) | "HOURS" |
| MINUTES | 0–59 | 2 digits (e.g. `05`) | "MINUTES" |

> Mỗi khối số gồm **2 ô chữ số riêng biệt** kiểu LED (mỗi ô 1 chữ số đơn), chia tách bằng dấu phân cách tinh tế. Không hiển thị giây (SECONDS).

### Navigation Flow

```
/auth/callback (OAuth success)
  ├── IF Date.now() < EVENT_DATETIME → /prelaunch  (Countdown page)
  │     └── Countdown reaches 00:00:00 → auto-redirect → /  (Homepage)
  └── IF Date.now() >= EVENT_DATETIME → /  (Homepage)

Direct access:
  ├── Unauthenticated → /login
  └── Authenticated + event started → /  (Homepage)
```

### Visual Requirements

- **Background**: PNG artwork `2268:35129`, fullscreen `position: absolute inset-0`, `object-cover object-center`, nền tối `#00101A` fallback.
- **Gradient overlays** (tương tự Login): gradient ngang từ `#00101A` (trái) mờ dần sang transparent (phải); gradient dọc từ transparent (trên) sang `#00101A` (dưới-footer).
- **Countdown blocks**: Mỗi ô số có nền tối bán trong suốt (`var(--Details-Container)` hoặc `var(--BG-Update)`), bo góc, shadow nhẹ. Chữ số lớn, font monospace/LED style.
- **Nhãn đơn vị** ("DAYS", "HOURS", "MINUTES"): chữ in hoa, màu trắng, kích thước nhỏ hơn chữ số.
- **Separator**: Dấu `:` hoặc khoảng cách/gap giữa các khối DAYS / HOURS / MINUTES.
- **Responsive**: Mobile (375px) → các khối xếp ngang, scale xuống vừa màn hình; Desktop (1440px, max-w-306) → căn giữa.

---

## Requirements

### Functional Requirements

- **FR-001**: Trang Prelaunch CHỈ hiển thị với người dùng ĐÃ đăng nhập; unauthenticated → redirect `/login`.
- **FR-002**: Nếu `Date.now() >= EVENT_DATETIME` khi trang load → redirect ngay về `/` (không hiển thị countdown).
- **FR-003**: Đồng hồ PHẢI tự động cập nhật mỗi phút mà không cần reload trang.
- **FR-004**: Khi countdown về `00 00 00`, hệ thống PHẢI tự động redirect đến `/`.
- **FR-005**: Các chữ số PHẢI được zero-padded (tối thiểu 2 chữ số: `03`, `09`, `00`).
- **FR-006**: Nếu `NEXT_PUBLIC_EVENT_DATETIME` không hợp lệ hoặc undefined → countdown hiển thị `00 00 00`; không crash, không hiển thị lỗi cho người dùng.
- **FR-007**: Trang PHẢI hỗ trợ 2 ngôn ngữ VN/EN qua `next-intl`.

### Non-Functional Requirements

- **NFR-001**: Countdown là Client Component (`'use client'`) do cần real-time updates và `useEffect`/`setInterval`.
- **NFR-002**: Background image dùng `next/image` với `fill` + `priority` (above-the-fold).
- **NFR-003**: `clearInterval` bắt buộc trong cleanup của `useEffect` để tránh memory leak.
- **NFR-004**: Trang shell (layout, background) là Server Component; chỉ phần countdown cần `'use client'`.

### Technical Requirements

- **TR-001**: `NEXT_PUBLIC_EVENT_DATETIME` là biến môi trường client-accessible, format ISO-8601 với timezone, ví dụ: `2025-12-26T18:30:00+07:00`.
- **TR-002**: Dùng hàm `getTimeRemaining(targetISO: string)` từ `lib/countdown.ts` (shared với Homepage countdown) để tính `{ days, hours, minutes, isOver }`.
- **TR-003**: `setInterval` với interval **60.000ms** (1 phút); khi component mount → tính ngay lần đầu, sau đó interval tiếp tục.
- **TR-004**: Khi `isOver === true` → gọi `router.push('/')` (Next.js `useRouter`) để redirect.
- **TR-005**: Middleware (`middleware.ts`) kiểm tra: nếu session hợp lệ VÀ `Date.now() >= EVENT_DATETIME` VÀ user truy cập `/prelaunch` → redirect về `/`.
- **TR-006**: Route `/prelaunch` (hoặc render điều kiện trong `/auth/callback`) — tùy thiết kế route, nhưng phải là một route riêng có thể bookmark.
- **TR-007**: Trang dùng chung `Header` component với Login/Homepage (language selector, logo).
- **TR-008**: Dữ liệu thời gian tính từ ISO string (UTC-aware) — không bị ảnh hưởng khi client thay đổi timezone local.

### Key Entities

| Entity | Source | Notes |
|---|---|---|
| `EVENT_DATETIME` | Env var `NEXT_PUBLIC_EVENT_DATETIME` (ISO-8601) | Server + client accessible |
| Countdown state | Local React state (`useState`) | `{ days, hours, minutes }` |
| User session | Supabase Auth (middleware) | Guard route authentication |
| Locale | Cookie `NEXT_LOCALE` | `next-intl` cookie-based |

---

## Implementation Notes

### File Structure

```
src/
├── app/
│   └── (main)/
│       └── prelaunch/
│           └── page.tsx              # Server Component — session guard + render PrelaunchPage
├── components/
│   └── prelaunch/
│       └── CountdownClock.tsx        # Client Component — 'use client', auto-update + redirect on zero
└── lib/
    └── countdown.ts                  # Shared utility — getTimeRemaining(targetISO)
```

### Route Guard Logic

```typescript
// app/(main)/prelaunch/page.tsx (Server Component)
import { createClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export default async function PrelaunchPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const eventDatetime = process.env.NEXT_PUBLIC_EVENT_DATETIME;
  const isEventStarted = eventDatetime
    ? Date.now() >= new Date(eventDatetime).getTime()
    : true; // если нет datetime — считаем что началось

  if (isEventStarted) redirect('/');

  return <PrelaunchLayout eventDatetime={eventDatetime ?? ''} />;
}
```

### Countdown Component Pattern

```typescript
// components/prelaunch/CountdownClock.tsx ('use client')
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTimeRemaining } from '@/lib/countdown';

export function CountdownClock({ targetISO }: { targetISO: string }) {
  const router = useRouter();
  const [time, setTime] = useState(() => getTimeRemaining(targetISO));

  useEffect(() => {
    if (time.isOver) {
      router.push('/');
      return;
    }
    const id = setInterval(() => {
      const next = getTimeRemaining(targetISO);
      setTime(next);
      if (next.isOver) {
        clearInterval(id);
        router.push('/');
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [targetISO, router]);

  const fmt = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex gap-8 items-end">
      <CountdownBlock value={fmt(time.days)}  label="DAYS"    />
      <CountdownBlock value={fmt(time.hours)} label="HOURS"   />
      <CountdownBlock value={fmt(time.minutes)} label="MINUTES" />
    </div>
  );
}
```

### Shared Utility

```typescript
// lib/countdown.ts (shared with Homepage CountdownSection)
export function getTimeRemaining(targetISO: string) {
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

### Middleware Guard Addition

```typescript
// middleware.ts — additional rule for /prelaunch route
const eventDatetime = process.env.NEXT_PUBLIC_EVENT_DATETIME;
const isEventStarted = eventDatetime
  ? Date.now() >= new Date(eventDatetime).getTime()
  : true;

if (session && request.nextUrl.pathname === '/prelaunch' && isEventStarted) {
  return NextResponse.redirect(new URL('/', request.url));
}
```

### Media Assets (from Figma)

| Asset | Node ID | Destination Path |
|---|---|---|
| Prelaunch background PNG | `2268:35129` | `public/assets/prelaunch/images/keyvisual-bg.png` |
