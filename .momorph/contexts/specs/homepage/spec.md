# Feature Specification: Homepage SAA

**Frame ID**: `2167:9026`
**Frame Name**: `Homepage SAA`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph Frame ID**: `6382`
**Figma Link**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=2167:9026
**Created**: 2026-03-23
**Status**: Draft

---

## Overview

Trang chủ (Homepage) là trang đầu tiên sau khi đăng nhập thành công, giới thiệu toàn bộ chương trình Sun Annual Awards 2025. Trang gồm 4 section chính:

- **Section A — Header**: Navigation bar cố định với logo, links điều hướng, notification, language selector, user avatar.
- **Section B — Hero / Keyvisual**: Banner fullscreen với tiêu đề "ROOT FURTHER", đồng hồ đếm ngược, thông tin sự kiện, hai nút CTA (ABOUT AWARDS / ABOUT KUDOS) và đoạn giới thiệu tinh thần chương trình.
- **Section C — Hệ thống giải thưởng**: Grid 6 thẻ giải thưởng (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP).
- **Section D — Sun* Kudos**: Khối quảng bá phong trào ghi nhận Sun* Kudos.
- **Section 7 — Footer**: Navigation + copyright.
- **Widget button** (6): Floating action button cố định góc phải.

---

## User Scenarios & Testing

### User Story 1 — Xem tổng quan Homepage (Priority: P1)

Người dùng đã đăng nhập truy cập trang chủ và thấy đầy đủ thông tin về SAA 2025.

**Why this priority**: Đây là trang chính của ứng dụng — mọi luồng đều bắt đầu từ đây.

**Independent Test**: Yêu cầu session hợp lệ; không phụ thuộc vào trang khác.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập, **When** truy cập `/`, **Then** Homepage hiển thị đầy đủ: Header, Hero với countdown, Awards grid, Sun* Kudos, Footer.
2. **Given** Homepage đang hiển thị, **When** load trang, **Then** đồng hồ đếm ngược tự động cập nhật theo thời gian thực (mỗi phút).
3. **Given** người dùng chưa đăng nhập, **When** truy cập `/`, **Then** middleware redirect về `/login`.

---

### User Story 2 — Đồng hồ đếm ngược (Priority: P1)

Người dùng xem thời gian còn lại đến thời điểm sự kiện SAA 2025 diễn ra.

**Why this priority**: Là yếu tố tạo sự chú ý chính trong Hero section.

**Independent Test**: Có thể test độc lập với mockable target datetime qua biến môi trường.

**Acceptance Scenarios**:

1. **Given** Homepage load xong, **When** thời gian sự kiện chưa đến, **Then** đồng hồ hiển thị DAYS / HOURS / MINUTES với 2 chữ số có 0-padding (e.g. `02`, `09`), và label "Comming soon" hiển thị.
2. **Given** đồng hồ đang chạy, **When** hết 1 phút, **Then** giá trị MINUTES giảm 1 (tự động, không cần reload).
3. **Given** thời gian sự kiện đã qua (countdown về 0), **When** load trang, **Then** label "Comming soon" bị ẩn, đồng hồ hiển thị `00 00 00`.
4. **Given** biến môi trường `NEXT_PUBLIC_EVENT_DATETIME` được set theo ISO-8601, **When** tính toán countdown, **Then** sử dụng đúng giá trị từ env đó.

---

### User Story 3 — Điều hướng đến Awards Information (Priority: P2)

Người dùng click vào nút CTA hoặc thẻ giải thưởng để xem chi tiết.

**Why this priority**: Luồng điều hướng chính từ Homepage.

**Independent Test**: Mock navigation events, không cần trang Awards thực sự render đủ.

**Acceptance Scenarios**:

1. **Given** Hero section hiển thị, **When** click "ABOUT AWARDS", **Then** navigate đến trang Awards Information.
2. **Given** Hero section hiển thị, **When** click "ABOUT KUDOS", **Then** navigate đến trang Sun* Kudos.
3. **Given** Awards grid hiển thị, **When** click hình ảnh hoặc tiêu đề của một thẻ (e.g. "Top Talent"), **Then** navigate đến Awards Information với hash slug của hạng mục đó (e.g. `/awards#top-talent`), trình duyệt tự cuộn đến đúng section.
4. **Given** thẻ giải thưởng hiển thị, **When** click "Chi tiết", **Then** navigate đến Awards Information với hash tương ứng.
5. **Given** Sun* Kudos section hiển thị, **When** click "Chi tiết", **Then** navigate đến trang Sun* Kudos.

---

### User Story 4 — Điều hướng Header (Priority: P2)

Người dùng dùng Header để điều hướng giữa các trang.

**Acceptance Scenarios**:

1. **Given** Header hiển thị, **When** click logo, **Then** scroll về đầu trang chủ.
2. **Given** Header hiển thị, **When** click "About SAA 2025", **Then** navigate đến trang About SAA 2025; link hiển thị trạng thái active (màu vàng/underline).
3. **Given** Header hiển thị, **When** click "Awards Information", **Then** navigate đến trang Awards Information.
4. **Given** Header hiển thị, **When** click "Sun* Kudos", **Then** navigate đến trang Sun* Kudos.
5. **Given** người dùng đang ở Homepage, **When** hover một link nav, **Then** link highlight.
6. **Given** Header hiển thị, **When** click icon user, **Then** dropdown profile/sign-out hiển thị (frame `721:5223`).
7. **Given** Header hiển thị, **When** click icon notification, **Then** panel thông báo mở ra.

---

### User Story 5 — Chọn ngôn ngữ từ Homepage (Priority: P3)

Người dùng chuyển đổi ngôn ngữ từ Header trên Homepage.

**Acceptance Scenarios**:

1. **Given** Header hiển thị, **When** click language button "VN", **Then** dropdown hiển thị 2 tuỳ chọn: VN / EN.
2. **Given** dropdown ngôn ngữ đang mở, **When** chọn "EN", **Then** toàn bộ giao diện chuyển sang tiếng Anh, lưu vào `profiles.locale`.
3. **Given** người dùng đã chọn "EN" trước đó, **When** reload trang, **Then** vẫn hiển thị tiếng Anh.

---

### Edge Cases

- Khi `NEXT_PUBLIC_EVENT_DATETIME` chưa được set → đồng hồ hiển thị `00 00 00`, không crash.
- Khi mạng chậm, ảnh thẻ giải thưởng chưa load → hiển thị skeleton/placeholder.
- Hover thẻ giải thưởng → card nâng nhẹ (transform + box-shadow), viền/ánh sáng nổi bật.
- Tên giải thưởng/mô tả quá dài → mô tả truncate tối đa 2 dòng với dấu `...`.
- Trên mobile → awards grid chuyển từ 3 cột về 2 cột; hero text wrap hợp lý.
- Footer links hoạt động giống Header links.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component ID | No | Name | Description | Interaction |
|---|---|---|---|---|
| `2167:9091` | A1 | A1_Header | Navigation bar cố định, nền tối bán trong suốt | Luôn visible phía trên |
| `I2167:9091;178:1033` | A1.1 | LOGO | Logo SAA 52×48px, góc trái | Click → scroll về đầu trang |
| `I2167:9091;186:1579` | A1.2 | About SAA 2025 (selected) | Nav link, state selected = vàng/underline | Click → trang About SAA |
| `I2167:9091;186:1587` | A1.3 | Awards Information (hover) | Nav link, state hover = highlight | Click → trang Awards Information |
| `I2167:9091;186:1593` | A1.5 | Sun* Kudos (normal) | Nav link, state normal | Click → trang Sun* Kudos |
| `I2167:9091;186:2101` | A1.6 | Notification | Icon button 40×40px, badge đỏ khi có thông báo chưa đọc | Click → panel notifications |
| `I2167:9091;186:1696` | A1.7 | Language Selector | Toggle VN/EN với dropdown | Click → dropdown ngôn ngữ |
| `I2167:9091;186:1597` | A1.8 | User Avatar | Icon button 40×40px | Click → Dropdown profile (`721:5223`): Profile / Sign out / Admin Dashboard |
| `2167:9027` | 3.5 | Keyvisual | Hero section fullscreen với background artwork | Decorative |
| `2167:9035` | B1 | Countdown time | Section đếm ngược với label, clock, thông tin sự kiện | Auto-update theo thời gian thực |
| `2167:9036` | B1.2 | "Comming soon" | Label text, ẩn khi countdown = 0 | Không tương tác |
| `2167:9037` | B1.3 | Countdown clock | 3 nhóm số: DAYS / HOURS / MINUTES, 2 chữ số mỗi nhóm | Auto-update mỗi phút |
| `2167:9038` | B1.3.1 | Days | Số ngày còn lại + nhãn "DAYS" | — |
| `2167:9043` | B1.3.2 | Hours | Số giờ còn lại + nhãn "HOURS" | — |
| `2167:9048` | B1.3.3 | Minutes | Số phút còn lại + nhãn "MINUTES" | — |
| `2167:9053` | B2 | Thông tin sự kiện | Thời gian: 18h30 / Địa điểm: Âu Cơ Art Center / Tường thuật trực tiếp qua Livestream | Static |
| `2167:9062` | B3 | Call-To-Action | 2 nút: "ABOUT AWARDS" (vàng/hover) + "ABOUT KUDOS" (viền/normal) | Click → navigate |
| `2167:9063` | B3.1 | Button ABOUT AWARDS | Nền vàng `#FFEA9E`, icon mũi tên bên phải | Click → trang Awards Information |
| `2167:9064` | B3.2 | Button ABOUT KUDOS | Viền `#FFEA9E`, transparent bg | Click → trang Sun* Kudos |
| `5001:14827` | B4 | Content "Root Further" | Đoạn text mô tả tinh thần "Root Further" (nhiều paragraph) | Static |
| `2167:9069` | C1 | Header Giải thưởng | Caption "Sun* annual awards 2025" + tiêu đề lớn "Hệ thống giải thưởng" + mô tả phụ | Static |
| `5005:14974` | C2 | Award list | Grid 3 cột (desktop) / 2 cột (mobile) gồm 6 thẻ giải thưởng | Click → Awards page with hash |
| `2167:9075` | C2.1 | Top Talent Award | Thẻ: ảnh + "Top Talent" + mô tả + "Chi tiết" | Click → `/awards#top-talent` |
| `2167:9076` | C2.2 | Top Project Award | Thẻ: ảnh + "Top Project" + "Chi tiết" | Click → `/awards#top-project` |
| `2167:9077` | C2.3 | Top Project Leader Award | Thẻ: ảnh + "Top Project Leader" + "Chi tiết" | Click → `/awards#top-project-leader` |
| `2167:9079` | C2.4 | Best Manager Award | Thẻ: ảnh + "Best Manager" + "Chi tiết" | Click → `/awards#best-manager` |
| `2167:9080` | C2.5 | Signature 2025 - Creator Award | Thẻ: ảnh + "Signature 2025 - Creator" + "Chi tiết" | Click → `/awards#signature-2025-creator` |
| `2167:9081` | C2.6 | MVP Award | Thẻ: ảnh + "MVP (Most Valuable Person)" + "Chi tiết" | Click → `/awards#mvp` |
| `3390:10349` | D1 | Sun* Kudos | Khối quảng bá: label + tiêu đề lớn + mô tả + nút "Chi tiết" + ảnh minh họa | Click "Chi tiết" → trang Sun* Kudos |
| `5022:15169` | 6 | Widget Button | Floating pill `105×64px`, nền vàng, cố định góc dưới phải | Click → mở quick action menu |
| `5001:14800` | 7 | Footer | Logo + nav links + copyright + nút "Tiêu chuẩn chung" | Click links → navigate |

### Navigation Flow

```
Homepage (/)
  ├── Header
  │   ├── Logo → scroll top
  │   ├── About SAA 2025 → /about
  │   ├── Awards Information → /awards
  │   ├── Sun* Kudos → /kudos
  │   ├── Notification → panel
  │   ├── Language → dropdown VN/EN
  │   └── User Avatar → dropdown (Profile / Sign out / Admin)
  │
  ├── Hero CTA
  │   ├── ABOUT AWARDS → /awards
  │   └── ABOUT KUDOS → /kudos
  │
  ├── Awards Grid (6 thẻ)
  │   └── Click any → /awards#[slug]
  │
  ├── Sun* Kudos
  │   └── Chi tiết → /kudos
  │
  └── Footer
      ├── Links → /about, /awards, /kudos, /tieu-chuan-chung
      └── Logo → scroll top
```

### Visual Requirements

- **Background Hero**: Artwork fullscreen (`2167:9028` — PNG), right-anchored, với gradient overlay trái và gradient overlay dưới.
- **Countdown tiles**: Mỗi ô số có nền tối `var(--Details-Container)` / `var(--BG-Update)`, góc bo, 2 chữ số lớn.
- **Award cards**: Bo góc, viền mảnh vàng, hiệu ứng ring sáng, hover = nâng nhẹ + viền sáng hơn. Mô tả truncate 2 dòng.
- **CTA Buttons**:
  - ABOUT AWARDS: nền `#FFEA9E`, text tối, icon mũi tên phải. Hover → `#FFF8E1` + shadow.
  - ABOUT KUDOS: border `#FFEA9E`, transparent bg. Hover → nền bán trong suốt.
- **Widget button**: `position: fixed; bottom: right;`, pill tròn `105×64px`, nền `#FFEA9E`, pencil icon + SAA icon.
- **Responsive breakpoints**: mobile (375px), tablet (768px), desktop (1440px, max-w-306).

---

## Requirements

### Functional Requirements

- **FR-001**: Trang chủ CHỈ hiển thị với người dùng đã đăng nhập; unauthenticated → redirect `/login`.
- **FR-002**: Đồng hồ đếm ngược PHẢI tính toán dựa vào biến môi trường `NEXT_PUBLIC_EVENT_DATETIME` (ISO-8601). Nếu không có env → hiển thị `00 00 00`.
- **FR-003**: Đồng hồ PHẢI tự cập nhật mỗi phút mà không cần reload trang.
- **FR-004**: Label "Comming soon" *(sic — text theo Figma design)* PHẢI bị ẩn khi thời gian sự kiện đã qua (countdown về 0).
- **FR-005**: Mỗi thẻ giải thưởng PHẢI có link dẫn đến `/awards#[award-slug]`.
- **FR-006**: Trang PHẢI hỗ trợ 2 ngôn ngữ VN/EN qua `next-intl` (cookie-based, không URL prefix).
- **FR-007**: Widget button PHẢI cố định (fixed) tại góc dưới phải màn hình ở mọi scroll position.
- **FR-008**: Nút user avatar PHẢI mở dropdown với các option: Profile, Sign out, và Admin Dashboard (chỉ với role admin). Admin Dashboard link CHỈ render khi `profiles.role === 'admin'` — check tại Server Component level, không dùng client-only check.

### Non-Functional Requirements

- **NFR-001**: Countdown tính toán trên client (Client Component), không cần server roundtrip.
- **NFR-002**: Ảnh hero background và award images dùng `next/image` với `priority` cho above-the-fold.
- **NFR-003**: Grid awards responsive: 3 cột ≥ desktop, 2 cột ≤ tablet/mobile.
- **NFR-004**: Countdown trên Homepage phục vụ 2 trường hợp: (1) dev/testing khi pre-launch middleware bị tắt; (2) historical display sau sự kiện (countdown = `00 00 00`). Trong production flow đầy đủ, người dùng chỉ thấy countdown running tại `/prelaunch`.

### Technical Requirements

- **TR-001**: `NEXT_PUBLIC_EVENT_DATETIME` là biến môi trường client-accessible, format ISO-8601, ví dụ: `2025-12-26T18:30:00+07:00`.
- **TR-002**: Countdown component là `'use client'`, dùng `useEffect` + `setInterval` (1 phút) + `useState` để update DAYS/HOURS/MINUTES.
- **TR-003**: Khi component unmount → `clearInterval` để tránh memory leak.
- **TR-004**: Award card click dùng Next.js `<Link href="/awards#[slug]">` — hash navigation để scroll tới section.
- **TR-005**: Widget button là `position: fixed`, z-index cao hơn content.
- **TR-006**: Header là Client Component để xử lý active state dựa trên `usePathname()`.
- **TR-007**: User avatar dropdown gọi `supabase.auth.signOut()` cho Sign out option; sau sign-out redirect về `/login`.
- **TR-008**: Notification panel: read/unread state — badge đỏ khi có thông báo chưa đọc.

### Key Entities

| Entity | Source |
|---|---|
| `NEXT_PUBLIC_EVENT_DATETIME` | Env var `NEXT_PUBLIC_EVENT_DATETIME` (ISO-8601) |
| Award slugs | Static list: `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp` |
| User session | Supabase Auth session (từ middleware) |
| Locale | Cookie `NEXT_LOCALE` + `profiles.locale` |

---

## Implementation Notes

### File Structure

```
src/
├── app/
│   └── (main)/
│       └── page.tsx                          # Server Component — kiểm tra session, render Homepage
├── components/
│   ├── layout/
│   │   ├── Header.tsx                        # Client Component — nav links (usePathname), language, user avatar, notifications
│   │   ├── Footer.tsx                        # Server Component — nav links + copyright
│   │   └── WidgetButton.tsx                  # Client Component — fixed floating pill button
│   └── homepage/
│       ├── HeroSection.tsx                   # Server Component — hero background, ROOT FURTHER image, B4 content text
│       ├── CountdownSection.tsx              # Client Component — countdown timer + "Comming soon" label + event info + CTA
│       ├── AwardsSection.tsx                 # Server Component — section header + award cards grid
│       ├── AwardCard.tsx                     # Server Component — individual award card (image + title + desc + link)
│       └── SunKudosSection.tsx               # Server Component — Sun* Kudos promo block
└── lib/
    └── countdown.ts                          # Utility — calculates { days, hours, minutes } from target datetime
```

### Award Slugs & Data

```typescript
export const AWARDS = [
  { slug: 'top-talent',             name: 'Top Talent',              desc: 'Vinh danh top cá nhân xuất sắc trên mọi phương diện' },
  { slug: 'top-project',            name: 'Top Project',             desc: 'Vinh danh dự án xuất sắc trên mọi phương diện, dự án có doanh thu nổi bật' },
  { slug: 'top-project-leader',     name: 'Top Project Leader',      desc: 'Vinh danh người quản lý dự án truyền cảm hứng và dẫn dắt đội nhóm bứt phá' },
  { slug: 'best-manager',           name: 'Best Manager',            desc: 'Vinh danh người quản lý có năng lực quản lý tốt, dẫn dắt đội nhóm' },
  { slug: 'signature-2025-creator', name: 'Signature 2025 - Creator',desc: 'Vinh danh cá nhân hoặc tập thể có đóng góp sáng tạo ấn tượng, mang dấu ấn riêng cho SAA 2025.' },
  { slug: 'mvp',                    name: 'MVP (Most Valuable Person)', desc: 'Giải thưởng cao nhất, vinh danh cá nhân có giá trị và đóng góp lớn nhất trong toàn bộ chương trình.' },
];
```

### Countdown Logic

```typescript
// lib/countdown.ts
export function getTimeRemaining(targetISO: string) {
  const target = new Date(targetISO).getTime();
  const now = Date.now();
  const total = Number.isNaN(target) ? 0 : Math.max(0, target - now);

  const days    = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isOver: total === 0 };
}
```

### Media Assets (from Figma)

| Asset | Node ID | Path |
|---|---|---|
| Keyvisual hero background | `2167:9028` | `public/assets/homepage/images/hero-bg.png` |
| ROOT FURTHER logo text | `2788:12911` | `public/assets/homepage/images/root-further.png` |
| Sun* Kudos image | `I3390:10349;313:8416` | `public/assets/homepage/images/kudos-bg.png` |
| Award frame background (shared) | `I2167:9075;214:1019;81:2442` | `public/assets/homepage/images/award-frame.png` |
| Top Talent award image | `I2167:9075;214:1019;214:666;10:951` | `public/assets/homepage/awards/top-talent.png` |
| Top Project award image | `I2167:9076;214:1019;214:666;214:654` | `public/assets/homepage/awards/top-project.png` |
| Top Project Leader award image | `I2167:9077;214:1019;214:666;214:655` | `public/assets/homepage/awards/top-project-leader.png` |
| Best Manager award image | `I2167:9079;214:1019;214:666;214:656` | `public/assets/homepage/awards/best-manager.png` |
| Signature 2025 Creator award image | `I2167:9080;214:1019;214:666;214:657` | `public/assets/homepage/awards/signature-2025-creator.png` |
| MVP award image | `I2167:9081;214:1019;214:666;214:653` | `public/assets/homepage/awards/mvp.png` |
| Sun* Kudos logo SVG | `I3390:10349;329:2948` | `public/assets/homepage/images/kudos-logo.svg` |
| Footer logo | `I5001:14800;342:1408;178:1030` | `public/assets/homepage/images/footer-logo.png` |
| Widget pencil icon SVG | `I5022:15169;214:3839;186:1763` | `public/assets/homepage/icons/widget-pencil.svg` |
| Widget SAA icon SVG | `I5022:15169;214:3839;186:1766;214:3762` | `public/assets/homepage/icons/widget-saa.svg` |
| Notification bell SVG | `I2167:9091;186:2101;186:2020;186:1420` | `public/assets/homepage/icons/bell.svg` |
