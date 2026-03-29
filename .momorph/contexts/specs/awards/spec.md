# Feature Specification: Hệ thống giải thưởng (Awards Information)

**Frame ID**: `313:8436`
**Frame Name**: `Hệ thống giải`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph Frame ID**: `6383`
**Figma Link**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=313:8436
**Created**: 2026-03-23
**Status**: Draft

---

## Overview

Trang "Hệ thống giải thưởng" (Awards Information) giới thiệu chi tiết toàn bộ 6 hạng mục giải thưởng của SAA 2025 (Sun Annual Awards 2025). Người dùng đã đăng nhập có thể xem thông tin từng hạng mục: tên giải, hình ảnh minh hoạ, mô tả tiêu chí, số lượng giải và giá trị thưởng.

Trang gồm các section chính:

- **Header**: Navigation bar cố định (dùng chung với Homepage).
- **3_Keyvisual**: Banner fullscreen với artwork và tiêu đề chiến dịch "ROOT FURTHER".
- **A — Tiêu đề**: Caption "Sun* annual awards 2025" + tiêu đề lớn màu vàng "Hệ thống giải thưởng SAA 2025".
- **B — Hệ thống giải thưởng**: Layout 2 cột: menu điều hướng trái (C) + khối thông tin giải thưởng phải (D.1–D.6), scroll-spy active.
- **D1 — Sun\* Kudos**: Khối quảng bá chương trình ghi nhận (dùng chung với Homepage).
- **Footer**: Logo + nav links + copyright.

---

## User Scenarios & Testing

### User Story 1 — Xem danh sách hệ thống giải thưởng (Priority: P1)

Người dùng đã đăng nhập truy cập trang Awards Information và xem toàn bộ 6 hạng mục giải thưởng.

**Why this priority**: Đây là nội dung trọng tâm của trang — nếu awards không hiển thị, trang không có giá trị.

**Independent Test**: Không phụ thuộc dữ liệu động; content là static. Chỉ cần session hợp lệ.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập, **When** truy cập `/awards`, **Then** trang hiển thị đầy đủ: keyvisual, tiêu đề section, menu trái với 6 mục, và 6 khối thông tin giải từ Top Talent đến MVP.
2. **Given** trang Awards hiển thị, **When** quan sát menu bên trái (C), **Then** 6 mục được liệt kê đúng thứ tự: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP.
3. **Given** trang Awards hiển thị, **When** người dùng chưa đăng nhập, **Then** middleware redirect về `/login`.
4. **Given** trang Awards hiển thị, **When** xem từng khối thông tin (D.1–D.6), **Then** mỗi khối hiển thị: hình ảnh 336×336px, tiêu đề, mô tả, số lượng giải thưởng, giá trị giải thưởng.

---

### User Story 2 — Điều hướng bằng menu trái (Priority: P1)

Người dùng click vào một mục trong C_Menu list để xem chi tiết hạng mục tương ứng.

**Why this priority**: Menu trái là cơ chế điều hướng chính của trang.

**Independent Test**: Test client-side scroll behavior, không cần backend.

**Acceptance Scenarios**:

1. **Given** trang Awards đang hiển thị, **When** click "Top Project" trong menu trái, **Then** trang scroll đến khối D.2_Top Project và "Top Project" được đánh dấu active (màu vàng + underline).
2. **Given** người dùng scroll thủ công, **When** một khối giải thưởng (D.x) vào viewport, **Then** mục tương ứng trong menu trái PHẢI tự động được đánh dấu active (scroll-spy).
3. **Given** menu trái đang hiển thị, **When** hover một mục nav, **Then** mục đó được highlight.
4. **Given** trang Awards đang hiển thị, **When** lần đầu vào trang (không có hash), **Then** mục "Top Talent" (C.1) được active mặc định.
5. **Given** trang được truy cập với URL `/awards#best-manager`, **When** trang load xong, **Then** scroll tự động đến khối D.4_Best Manager và menu trái active "Best Manager".

---

### User Story 3 — Xem chi tiết từng hạng mục giải thưởng (Priority: P1)

Người dùng xem đầy đủ thông tin của một hạng mục giải thưởng (ví dụ: Top Talent).

**Why this priority**: Đây là nội dung cốt lõi của trang.

**Independent Test**: Static content — có thể test snapshot / visual regression.

**Acceptance Scenarios**:

1. **Given** khối D.1_Top Talent đang hiển thị, **When** quan sát, **Then** thấy: ảnh giải thưởng (336×336px), tiêu đề "Top Talent", mô tả tiêu chí, số lượng "10 Đơn vị", giá trị "7.000.000 VNĐ cho mỗi giải thưởng".
2. **Given** khối D.2_Top Project đang hiển thị, **When** quan sát, **Then** thấy: số lượng "02 Tập thể", giá trị "15.000.000 VNĐ".
3. **Given** khối D.3_Top Project Leader đang hiển thị, **When** quan sát, **Then** thấy: số lượng "03 Cá nhân", giá trị "7.000.000 VNĐ".
4. **Given** khối D.4_Best Manager đang hiển thị, **When** quan sát, **Then** thấy: số lượng "01 Cá nhân", giá trị "10.000.000 VNĐ".
5. **Given** khối D.5_Signature 2025 - Creator đang hiển thị, **When** quan sát, **Then** thấy: số lượng "01", giá trị kép "5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)".
6. **Given** khối D.6_MVP đang hiển thị, **When** quan sát, **Then** thấy: tiêu đề "MVP (Most Valuable Person)", số lượng "01", giá trị "15.000.000 VNĐ".

---

### User Story 4 — Điều hướng từ trang khác đến Awards với hash (Priority: P2)

Từ Homepage, người dùng click vào một thẻ giải thưởng để đến đúng section trên trang Awards.

**Why this priority**: Entry point phổ biến từ Homepage.

**Acceptance Scenarios**:

1. **Given** người dùng đang ở Homepage và click "Chi tiết" trên thẻ "Top Talent", **When** navigate đến `/awards#top-talent`, **Then** trang Awards load và scroll đến khối Top Talent, menu trái highlight "Top Talent".
2. **Given** người dùng dùng back button sau khi đến Awards từ Homepage, **When** back, **Then** quay về Homepage tại vị trí scroll cũ (browser default behavior).

---

### User Story 5 — Sun* Kudos section trên trang Awards (Priority: P3)

**Acceptance Scenarios**:

1. **Given** người dùng scroll đến cuối trang Awards, **When** nhìn thấy D1_SunKudos section, **Then** hiển thị: label "Phong trào ghi nhận", tiêu đề "Sun* Kudos", mô tả, ảnh minh hoạ, và nút "Chi tiết".
2. **Given** D1_SunKudos section hiển thị, **When** click "Chi tiết", **Then** navigate đến trang Sun* Kudos (`/kudos`).

---

### Edge Cases

- URL hash không hợp lệ (e.g. `/awards#unknown`) → trang load bình thường, không scroll, mục đầu (Top Talent) active.
- Khi screen width < tablet → menu trái ẩn hoặc chuyển thành horizontal tabs/scroll ở trên cùng (responsive behavior).
- Ảnh giải thưởng chưa load → hiển thị skeleton placeholder 336×336px.
- Người dùng scroll nhanh qua nhiều section → menu trái cập nhật active state theo section hiện tại trong viewport.
- Trang rất dài (6 award blocks) → sticky menu trái quan trọng ở desktop để không mất điều hướng.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component ID | No | Name | Description | Interaction |
|---|---|---|---|---|
| `313:8440` | — | Header | Navigation bar cố định (shared, dùng chung với Homepage) | Xem spec Homepage A1 |
| `I313:8440;178:1033;178:1030` | — | Header Logo | Logo SAA PNG | Click → scroll top |
| `I313:8440;186:1696;186:1821;186:1709` | — | Language Selector | SVG flag icon trong language toggle | Click → dropdown VN/EN |
| `I313:8440;186:2101;186:2020;186:1420` | — | Notification Bell | SVG, badge đỏ nếu có thông báo | Click → panel thông báo |
| `313:8437` | 3 | 3_Keyvisual | Hero banner fullscreen: artwork background 1200×871px + logo ROOT FURTHER + subtitle "Sun* Annual Award 2025" | Trang trí, không click |
| `2789:12915` | — | Keyvisual Image | PNG artwork background của hero | `object-cover`, `object-center` |
| `313:8453` | A | A_Title | Section header: phụ đề nhỏ + tiêu đề lớn màu vàng | Static |
| `313:8458` | B | B_Hệ thống giải thưởng | Layout chính: cột trái = C_Menu list, cột phải = D.1–D.6 award blocks | Scroll-spy active |
| `313:8459` | C | C_Menu list | Navigation dọc bên trái với 6 mục; active item = màu vàng + underline | Click mục → scroll to section + set active |
| `313:8460` | C.1 | Top Talent | Nav item, có icon đầu dòng | Click → scroll to D.1; hover → highlight |
| `313:8461` | C.2 | Top Project | Nav item | Click → scroll to D.2; hover → highlight |
| `313:8462` | C.3 | Top Project Leader | Nav item | Click → scroll to D.3; hover → highlight |
| `313:8463` | C.4 | Best Manager | Nav item | Click → scroll to D.4; hover → highlight |
| `313:8464` | C.5 | Signature 2025 - Creator | Nav item | Click → scroll to D.5; hover → highlight |
| `313:8465` | C.6 | MVP | Nav item | Click → scroll to D.6; hover → highlight |
| `313:8467` | D.1 | D.1_Top Talent | Award block: image + title + description + qty + value | Static read-only |
| `I313:8467;214:2525` | D.1.1 | Picture-Award | Hình ảnh giải thưởng 336×336px | `object-contain` |
| `I313:8467;214:2526` | D.1.2 | Content | Khối text: tiêu đề, mô tả, số lượng + giá trị | Static |
| `313:8468` | D.2 | D.2_Top Project | Award block: qty 02 Tập thể, 15.000.000 VNĐ | Static read-only |
| `313:8469` | D.3 | D.3_Top Project Leader | Award block: qty 03 Cá nhân, 7.000.000 VNĐ | Static read-only |
| `313:8470` | D.4 | D.4_Best Manager | Award block: qty 01 Cá nhân, 10.000.000 VNĐ | Static read-only |
| `313:8471` | D.5 | D.5_Signature 2025 - Creator | Award block: qty 01, 5.000.000 VNĐ (cá nhân) hoặc 8.000.000 VNĐ (tập thể) | Static read-only |
| `313:8510` | D.6 | D.6_MVP | Award block: "MVP (Most Valuable Person)", qty 01, 15.000.000 VNĐ | Static read-only |
| `335:12023` | D1 | D1_SunKudos | Khối quảng bá Sun* Kudos: label + title + description + button + logo | Click "Chi tiết" → `/kudos` |
| `I335:12023;313:8419` | D2 | D2_Content | Nội dung text + ảnh trong D1_SunKudos | Static |
| `I335:12023;313:8426` | D2.1 | D2.1_Button Chi tiết | Nút text-link "Chi tiết" → Sun* Kudos | Click → navigate `/kudos` |
| `354:4323` | 7 | Footer | Logo + nav links + copyright (shared, dùng chung với Homepage) | Click links → navigate |
| `I354:4323;342:1408;178:1030` | — | Footer Logo | PNG logo SAA | Click → scroll top |

### Award Data

| No | Award Name | Quantity | Unit | Value per Award |
|---|---|---|---|---|
| D.1 | Top Talent | 10 | Đơn vị | 7.000.000 VNĐ |
| D.2 | Top Project | 02 | Tập thể | 15.000.000 VNĐ |
| D.3 | Top Project Leader | 03 | Cá nhân | 7.000.000 VNĐ |
| D.4 | Best Manager | 01 | Cá nhân | 10.000.000 VNĐ |
| D.5 | Signature 2025 - Creator | 01 | — | 5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể) |
| D.6 | MVP (Most Valuable Person) | 01 | — | 15.000.000 VNĐ |

### Navigation Flow

```
Entries into /awards:
  ├── Homepage Header → "Awards Information"
  ├── Homepage CTA → "ABOUT AWARDS"
  ├── Homepage Award Card → "Chi tiết" hoặc click → /awards#[slug]
  └── Footer → "Awards Information"

On /awards:
  ├── C_Menu list click → smooth-scroll đến section ID + set active
  ├── Scroll thủ công → scroll-spy cập nhật active menu item
  ├── D1_SunKudos "Chi tiết" → /kudos
  └── Header/Footer links → các trang khác
```

### Visual Requirements

- **Keyvisual background**: PNG artwork (`2789:12915`), `object-cover object-center`, cùng phong cách với Login và Homepage.
- **Section A title**: Phụ đề nhỏ + text màu nhạt; tiêu đề lớn `color: var(--Gold)` / `#FFEA9E`.
- **C_Menu list**: Dọc, sticky bên trái ở desktop. Active item: `color: var(--Gold)`, border-left hoặc underline indicator vàng. Hover: highlight nhẹ.
- **Award blocks (D.1–D.6)**:
  - Layout ngang: ảnh vuông 336×336px bên trái + content bên phải.
  - `id` attribute tương ứng slug để URL hash scroll hoạt động.
  - Divider giữa các block.
- **Giá trị giải thưởng**: Số tiền nổi bật, bold hoặc màu vàng.
- **Số lượng giải**: Label + số + đơn vị (Đơn vị / Cá nhân / Tập thể).
- **Responsive**: Desktop (1440px): 2 cột sticky-left nav + content; Tablet (768px): nav chuyển thành horizontal scroll tabs; Mobile (375px): nav ẩn hoặc collapsed, content 1 cột.

---

## Requirements

### Functional Requirements

- **FR-001**: Trang `/awards` CHỈ hiển thị khi người dùng đã đăng nhập; unauthenticated → middleware redirect về `/login`.
- **FR-002**: Menu trái (C) PHẢI có scroll-spy: khi một award block (D.x) vào viewport, mục tương ứng trong C PHẢI tự động được active.
- **FR-003**: Click một mục trong C PHẢI smooth-scroll đến award block tương ứng và set active state.
- **FR-004**: Truy cập URL với hash (e.g. `/awards#top-talent`) PHẢI scroll đến đúng section và active đúng mục menu.
- **FR-005**: Hash không hợp lệ PHẢI không gây lỗi; trang load bình thường với mục đầu tiên active.
- **FR-006**: Trang PHẢI hỗ trợ 2 ngôn ngữ VN/EN qua `next-intl`.
- **FR-007**: Trang PHẢI hiển thị đầy đủ 6 award blocks với đúng data (tên, số lượng, đơn vị, giá trị).
- **FR-008**: Nút "Chi tiết" trong D1_SunKudos PHẢI navigate đến `/kudos`.

### Non-Functional Requirements

- **NFR-001**: Content trang là static — không cần API call; render hoàn toàn trên server (Server Component).
- **NFR-002**: Scroll-spy là client-side behavior (Client Component hoặc `'use client'` hook).
- **NFR-003**: Ảnh award (336×336px) cần `next/image` với `width`/`height` cố định; keyvisual dùng `fill` + `object-cover`.
- **NFR-004**: C_Menu list PHẢI sticky ở desktop (CSS `position: sticky`, `top: <header-height>`).

### Technical Requirements

- **TR-001**: Mỗi award block (D.x) PHẢI có `id` attribute khớp với slug: `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`.
- **TR-002**: Scroll-spy dùng `IntersectionObserver` API để detect section trong viewport; threshold ≥ 0.3.
- **TR-003**: Click menu item → `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- **TR-004**: C_Menu list ở desktop: `position: sticky; top: var(--header-height)` để không bị cuốn ra khỏi viewport.
- **TR-005**: Award data PHẢI được lưu dưới dạng static constant (TypeScript object/array) trong file `lib/awards-data.ts` — không fetch từ API vì đây là nội dung cố định của campaign.
- **TR-006**: Trang là Server Component ở top level; chỉ component `AwardNavMenu` cần `'use client'` để handle scroll-spy và active state.
- **TR-007**: Hash navigation từ trang khác (`/awards#best-manager`) hoạt động nhờ `id` attribute trên DOM element — Next.js App Router hỗ trợ natively.
- **TR-008**: Biến môi trường không bắt buộc thêm so với Login/Homepage — trang dùng Supabase session đã có và static content.

### Key Entities

| Entity | Source | Notes |
|---|---|---|
| Award list | `lib/awards-data.ts` (static) | 6 items, không thay đổi |
| Active menu item | Local state (Client Component) | Không lưu vào DB/cookie |
| User session | Supabase Auth session | Chỉ dùng để guard route |
| Locale | Cookie `NEXT_LOCALE` | Content i18n qua `next-intl` |

---

## Implementation Notes

### File Structure

```
src/
├── app/
│   └── (main)/
│       └── awards/
│           └── page.tsx              # Server Component — kiểm tra session, render trang Awards
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # Shared — `src/components/layout/Header.tsx` (dùng chung tất cả pages)
│   │   └── Footer.tsx                # Shared — `src/components/layout/Footer.tsx` (dùng chung tất cả pages)
│   └── awards/
│       ├── AwardNavMenu.tsx          # Client Component — sticky left nav + scroll-spy active state
│       ├── AwardBlock.tsx            # Server Component — 1 khối thông tin giải (image + content)
│       ├── AwardBlockContent.tsx     # Server Component — title + description + qty + value
│       └── AwardsKeyvisual.tsx       # Server Component — hero banner section (tương tự Homepage hero)
└── lib/
    └── awards-data.ts                # Static constant — danh sách 6 hạng mục giải thưởng
```

### Awards Static Data

```typescript
// lib/awards-data.ts
export type AwardUnit = 'Đơn vị' | 'Cá nhân' | 'Tập thể';

export interface AwardValue {
  individual?: string;
  team?: string;
  single?: string;
}

export interface Award {
  slug: string;
  name: string;
  description: string;
  quantity: number;
  unit?: AwardUnit;
  value: AwardValue;
  figmaNodeId: string;
  image: string; // path to public asset
}

export const AWARDS: Award[] = [
  {
    slug: 'top-talent',
    name: 'Top Talent',
    description: 'Vinh danh top cá nhân xuất sắc nhất trên mọi phương diện năng lực và đóng góp trong năm.',
    quantity: 10,
    unit: 'Đơn vị',
    value: { single: '7.000.000 VNĐ' },
    figmaNodeId: '313:8467',
    image: '/assets/awards/top-talent.png',
  },
  {
    slug: 'top-project',
    name: 'Top Project',
    description: 'Vinh danh dự án xuất sắc trên mọi phương diện, đặc biệt là doanh thu và hiệu quả hoạt động.',
    quantity: 2,
    unit: 'Tập thể',
    value: { single: '15.000.000 VNĐ' },
    figmaNodeId: '313:8468',
    image: '/assets/awards/top-project.png',
  },
  {
    slug: 'top-project-leader',
    name: 'Top Project Leader',
    description: 'Vinh danh người quản lý dự án truyền cảm hứng và dẫn dắt đội nhóm bứt phá.',
    quantity: 3,
    unit: 'Cá nhân',
    value: { single: '7.000.000 VNĐ' },
    figmaNodeId: '313:8469',
    image: '/assets/awards/top-project-leader.png',
  },
  {
    slug: 'best-manager',
    name: 'Best Manager',
    description: 'Vinh danh người quản lý có năng lực quản lý tốt, xây dựng và dẫn dắt đội nhóm hiệu quả.',
    quantity: 1,
    unit: 'Cá nhân',
    value: { single: '10.000.000 VNĐ' },
    figmaNodeId: '313:8470',
    image: '/assets/awards/best-manager.png',
  },
  {
    slug: 'signature-2025-creator',
    name: 'Signature 2025 - Creator',
    description: 'Vinh danh cá nhân hoặc tập thể có đóng góp sáng tạo ấn tượng, mang dấu ấn riêng cho SAA 2025.',
    quantity: 1,
    value: { individual: '5.000.000 VNĐ', team: '8.000.000 VNĐ' },
    figmaNodeId: '313:8471',
    image: '/assets/awards/signature-2025-creator.png',
  },
  {
    slug: 'mvp',
    name: 'MVP (Most Valuable Person)',
    description: 'Giải thưởng cao nhất, vinh danh cá nhân có giá trị và đóng góp lớn nhất trong toàn bộ chương trình.',
    quantity: 1,
    value: { single: '15.000.000 VNĐ' },
    figmaNodeId: '313:8510',
    image: '/assets/awards/mvp.png',
  },
];
```

### Scroll-Spy Pattern

```typescript
// components/awards/AwardNavMenu.tsx ('use client')
// Uses IntersectionObserver to watch all award block sections
// When a section enters viewport (threshold 0.3), sets its slug as activeSlug
// Click handler: scrollIntoView({ behavior: 'smooth', block: 'start' })

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActiveSlug(entry.target.id);
    });
  },
  { threshold: 0.3 }
);
```

### Hash Navigation

Each `AwardBlock` renders with:
```tsx
<section id={award.slug} aria-label={award.name}>
  {/* D.1.1 image + D.1.2 content */}
</section>
```

URL `/awards#top-talent` → browser natively scrolls to `<section id="top-talent">` on page load.

### Media Assets (from Figma)

| Asset | Node ID | Destination Path |
|---|---|---|
| Header Logo PNG | `I313:8440;178:1033;178:1030` | Shared with Homepage header |
| Keyvisual artwork PNG | `2789:12915` | `public/assets/awards/images/keyvisual-bg.png` |
| Notification bell SVG | `I313:8440;186:2101;186:2020;186:1420` | Shared with Homepage header |
| Language flag SVG | `I313:8440;186:1696;186:1821;186:1709` | Shared with Homepage header |
| Footer Logo PNG | `I354:4323;342:1408;178:1030` | Shared with Homepage footer |
| Chi tiết arrow SVG | `313:8493`, `313:8504` | `public/assets/awards/icons/arrow.svg` |
