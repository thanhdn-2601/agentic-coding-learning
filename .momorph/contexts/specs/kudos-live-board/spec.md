# Feature Specification: Sun* Kudos - Live Board

**Frame ID**: `2940:13431`
**Frame Name**: `Sun* Kudos - Live board`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph Frame ID**: `6384`
**Figma Link**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=2940:13431
**Created**: 2026-03-23
**Status**: Reviewed

---

## Overview

Trang "Sun* Kudos - Live Board" là trung tâm tương tác của chương trình ghi nhận lời cảm ơn giữa các Sunner trong sự kiện SAA 2025. Người dùng có thể gửi lời cảm ơn (kudos), xem các kudos nổi bật, khám phá toàn bộ feed kudos của cộng đồng, và theo dõi bảng thống kê cá nhân cùng leaderboard.

Trang gồm các section chính:

- **Header**: Navigation bar cố định (shared với Homepage).
- **A — KV Kudos Banner**: Hero banner giới thiệu hệ thống ghi nhận, tiêu đề "Hệ thống ghi nhận lời cảm ơn" + logo KUDOS + nút/ô gửi kudos.
- **B — Highlight Kudos**: Carousel 5 kudos có nhiều tim nhất, với bộ lọc Hashtag & Phòng ban.
- **B.7 — Spotlight Board**: Bảng word-cloud/interactive hiển thị tên người nhận kudos, pan/zoom, tìm kiếm, hiển thị tổng số kudos.
- **C — All Kudos**: Feed toàn bộ kudos dạng danh sách thẻ với infinite scroll.
- **D — Sidebar**: Thống kê cá nhân (kudos nhận/gửi/tim/secret box) + nút Mở quà + 2 leaderboard nhỏ.
- **Footer**: Logo + nav links + copyright (shared).

---

## User Scenarios & Testing

### User Story 1 — Xem Live Board Kudos (Priority: P1)

Người dùng đã đăng nhập truy cập trang Kudos Live Board và xem toàn bộ hoạt động cảm ơn.

**Why this priority**: Đây là trang chính của tính năng Kudos — mọi luồng tương tác bắt đầu từ đây.

**Independent Test**: Cần session hợp lệ; phụ thuộc DB `kudos` có dữ liệu.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập, **When** truy cập `/kudos`, **Then** trang hiển thị đầy đủ: hero banner, Highlight Kudos carousel, Spotlight Board, All Kudos feed, sidebar thống kê.
2. **Given** trang load xong, **When** DB có kudos, **Then** Highlight Kudos carousel hiển thị 5 card top-tim nhất; All Kudos feed hiển thị danh sách mới nhất.
3. **Given** người dùng chưa đăng nhập, **When** truy cập `/kudos`, **Then** middleware redirect về `/login`.
4. **Given** Highlight section không có kudos nào, **When** trang load, **Then** carousel hiển thị text "Hiện tại chưa có Kudos nào."
5. **Given** All Kudos feed không có kudos nào, **When** trang load, **Then** feed hiển thị text "Hiện tại chưa có Kudos nào."

---

### User Story 2 — Gửi Kudos (Priority: P1)

Người dùng gửi lời cảm ơn đến một Sunner khác thông qua form Kudos.

**Why this priority**: Đây là chức năng cốt lõi số một của trang — không gửi được kudos thì mọi thứ còn lại không có ý nghĩa.

**Independent Test**: Cần session + DB `profiles` có ít nhất 2 users.

**Acceptance Scenarios**:

1. **Given** trang Kudos Live Board hiển thị, **When** click vào ô "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" (A.1), **Then** dialog/form gửi kudos mở ra.
2. **Given** form gửi kudos đang mở, **When** người dùng nhập đầy đủ: người nhận, nội dung, hashtag, và submit, **Then** kudos được lưu vào DB; form đóng; feed All Kudos cập nhật thêm kudos mới ở đầu.
3. **Given** form gửi kudos đang mở, **When** người dùng bỏ trống trường bắt buộc (người nhận hoặc nội dung), **Then** submit bị disabled hoặc hiển thị validation error; kudos không được gửi.
4. **Given** kudos vừa được gửi thành công, **When** quan sát sidebar, **Then** "Số Kudos bạn đã gửi" tăng lên 1.
5. **Given** form gửi kudos đang mở, **When** click bên ngoài hoặc Escape, **Then** form đóng, không có thay đổi nào được lưu.

---

### User Story 3 — Tương tác với Highlight Kudos Carousel (Priority: P1)

Người dùng xem và tương tác với 5 kudos nổi bật nhất.

**Why this priority**: Đây là phần nổi bật nhất của trang, thu hút tương tác cao nhất.

**Independent Test**: Mock `kudos` data với `heart_count` khác nhau để test thứ tự top 5.

**Acceptance Scenarios**:

1. **Given** Highlight section hiển thị, **When** quan sát carousel, **Then** 5 card kudos nổi bật xếp theo `heart_count` giảm dần; card trung tâm hiển thị to và rõ, 2 bên mờ dần.
2. **Given** carousel đang hiển thị slide 1/5, **When** click nút lùi (B.2.1), **Then** nút lùi ở trạng thái disabled; không thay đổi slide.
3. **Given** carousel đang hiển thị slide 3/5, **When** click nút tiến (B.2.2), **Then** carousel trượt đến slide 4; số trang cập nhật thành "4/5".
4. **Given** carousel đang hiển thị slide 5/5, **When** click nút tiến, **Then** nút tiến ở trạng thái disabled.
5. **Given** một card kudos đang hiển thị và người dùng chưa like, **When** click icon heart, **Then** số tim tăng 1, icon heart chuyển sang màu đỏ (active); profile của người **gửi** kudos được cộng +1 tim (hoặc +2 tim nếu hôm nay là ngày đặc biệt do admin cấu hình).
6. **Given** người dùng đã liked một card kudos, **When** click lại icon heart, **Then** số tim giảm 1, icon về màu xám; số tim bị thu hồi đúng giá trị đã cộng (1 hoặc 2) từ profile người gửi kudos.
7. **Given** người dùng là **người GỬI** của một kudos (sender_id = current user), **When** xem card đó, **Then** nút heart PHẢI bị disabled — người gửi không thể thả tim cho kudos của chính mình.
8. **Given** người dùng bấm "Copy Link" trên một card, **When** click, **Then** URL kudos được sao chép vào clipboard, toast "Link copied — ready to share!" hiển thị và tự biến sau ~3 giây.
9. **Given** người dùng bấm "Xem chi tiết", **When** click, **Then** navigate đến trang chi tiết của kudos đó.

---

### User Story 3b — Ngày Đặc Biệt & Double-Heart (Priority: P2)

Admin cấu hình các ngày đặc biệt; like trong ngày đó tặng sender +2 tim thay vì +1.

**Why this priority**: Business rule đặc thù; ảnh hưởng đến tính toán leaderboard và quà.

**Acceptance Scenarios**:

1. **Given** admin đã cấu hình hôm nay là ngày đặc biệt, **When** người dùng like một kudos, **Then** `kudos_likes.is_special_day = true`; profile người gửi kudos được cộng +2 tim thay vì +1.
2. **Given** hôm nay không phải ngày đặc biệt, **When** like một kudos, **Then** `kudos_likes.is_special_day = false`; +1 tim bình thường.
3. **Given** người dùng đã like trong ngày đặc biệt (is_special_day = true), **When** unlike sau đó, **Then** thu hồi đúng 2 tim từ profile người gửi kudos.
4. **Given** người dùng đã like trong ngày thường (is_special_day = false), **When** unlike, **Then** thu hồi đúng 1 tim.
5. **Given** bảng `special_days` (admin table), **When** check ngày hiện tại, **Then** dùng kết quả để set `is_special_day` khi insert vào `kudos_likes`.

---

### User Story 4 — Lọc Kudos theo Hashtag & Phòng ban (Priority: P2)

Người dùng lọc nội dung Highlight Kudos và All Kudos theo tiêu chí.

**Why this priority**: Giúp người dùng tìm kudos liên quan đến nhóm / chủ đề cụ thể.

**Acceptance Scenarios**:

1. **Given** section header B.1 hiển thị, **When** click nút "Hashtag" (B.1.1), **Then** dropdown `1002:13013` mở ra với danh sách hashtag từ DB.
2. **Given** dropdown Hashtag đang mở, **When** chọn một hashtag (e.g. `#Dedicated`), **Then** dropdown đóng, label nút cập nhật thành hashtag đã chọn; Highlight carousel VÀ All Kudos feed đều được lọc; pagination về `1/N`.
3b. **Given** một thẻ kudos đang hiển thị hashtag tags (B.4.3 / C.3.7), **When** click trực tiếp vào một tag (e.g. `#Dedicated`), **Then** filter Hashtag cập nhật thành tag đó giống như chọn từ dropdown; Highlight carousel VÀ All Kudos feed đều được lọc; pagination về `1/N`.
3. **Given** nút "Phòng ban" (B.1.2) được click, **When** dropdown `721:5684` mở, **Then** danh sách phòng ban từ DB hiển thị.
4. **Given** filter đang active, **When** bỏ chọn filter (chọn lại "Tất cả"), **Then** nội dung trở về trạng thái không lọc.
5. **Given** filter hashtag + phòng ban cùng active, **When** kết quả trả về 0 kudos, **Then** hiển thị "Hiện tại chưa có Kudos nào phù hợp."

---

### User Story 5 — All Kudos Feed với Infinite Scroll (Priority: P2)

Người dùng xem toàn bộ kudos mới nhất bằng cách cuộn trang.

**Acceptance Scenarios**:

1. **Given** All Kudos section (C) hiển thị, **When** trang load lần đầu, **Then** hiển thị N kudos mới nhất (e.g. 20 kudos).
2. **Given** người dùng scroll xuống cuối feed, **When** chưa hết dữ liệu, **Then** tự động load thêm kudos tiếp theo (infinite scroll); loading indicator hiển thị trong lúc fetch.
3. **Given** người dùng scroll xuống hết dữ liệu, **When** không còn kudos mới, **Then** hiển thị "Đã xem tất cả Kudos." hoặc không load thêm.
4. **Given** một kudos card trong All Kudos, **When** click heart, **Then** toggle like (giống Highlight).
5. **Given** một kudos card trong All Kudos, **When** click avatar/tên người gửi hoặc người nhận, **Then** navigate đến trang profile tương ứng.
6. **Given** nội dung kudos > 5 dòng trong card All Kudos (C), **When** hiển thị, **Then** truncate tại dòng 5 với "..."; click vào card để xem đầy đủ.

---

### User Story 6 — Sidebar Thống kê & Mở quà (Priority: P2)

Người dùng xem thống kê Kudos cá nhân và mở Secret Box.

**Acceptance Scenarios**:

1. **Given** sidebar (D) hiển thị, **When** load trang, **Then** hiển thị 5 chỉ số: Số Kudos nhận được, Số Kudos đã gửi, Số tim bạn nhận được, Số Secret Box đã mở, Số Secret Box chưa mở (phân cách bởi divider D.1.5 giữa nhóm kudos và nhóm secret box).
2. **Given** sidebar hiển thị và "Số Secret Box chưa mở" > 0, **When** click "Mở quà" (D.1.8), **Then** dialog mở quà (frame `1466:7676`) mở ra.
3. **Given** sidebar hiển thị và "Số Secret Box chưa mở" = 0, **When** nút "Mở quà" hiển thị, **Then** nút disabled (không thể click).
4. **Given** sidebar cuộn xuống, **When** thấy "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" (D.2), **Then** hiển thị tối đa 10 mục theo thứ tự thăng hạng mới nhất; mỗi item có avatar + tên + mô tả thăng hạng.
5. **Given** sidebar cuộn xuống, **When** thấy "10 SUNNER NHẬN QUÀ MỚI NHẤT" (D.3), **Then** hiển thị tối đa 10 mục; mỗi item có avatar + tên + mô tả quà.
6. **Given** người dùng click tên/avatar trong D.2 hoặc D.3, **When** click, **Then** navigate đến trang profile của Sunner đó.
7. **Given** danh sách D.2 hoặc D.3 rỗng, **When** render, **Then** hiển thị "Chưa có dữ liệu".

---

### User Story 7 — Spotlight Board (Priority: P2)

Người dùng khám phá bảng word-cloud tên người nhận kudos.

**Acceptance Scenarios**:

1. **Given** Spotlight Board (B.7) hiển thị, **When** trang load, **Then** hiển thị word-cloud gồm tên các Sunner nhận kudos; số tổng kudos (e.g. "388 KUDOS") hiển thị ở header.
2. **Given** Spotlight Board đang hiển thị, **When** hover một node (tên Sunner), **Then** tooltip hiển thị tên + thời gian nhận kudos gần nhất.
2. **Given** Spotlight Board đang hiển thị, **When** click một node (tên Sunner), **Then** navigate đến trang chi tiết kudos mới nhất của Sunner đó (`/kudos/[id]` của kudos có `created_at` lớn nhất thuộc `receiver_id` tương ứng).
4. **Given** Spotlight Board đang hiển thị, **When** click nút "Pan/Zoom" (B.7.2), **Then** toggle chế độ pan/zoom; người dùng có thể kéo/zoom bảng bằng chuột.
5. **Given** thanh tìm kiếm (B.7.3) hiển thị, **When** nhập tên Sunner và Enter, **Then** Spotlight board highlight node của Sunner đó (nếu tồn tại); tối đa 100 ký tự.
6. **Given** DB không có kudos nào, **When** load Spotlight, **Then** hiển thị trạng thái empty.

---

### User Story 8 — Hover Profile Preview (Priority: P3)

Người dùng hover lên avatar hoặc tên của sender/receiver trên thẻ kudos để xem nhanh thông tin profile.

**Why this priority**: Tính năng UX bổ sung, không ảnh hưởng đến core flow.

**Acceptance Scenarios**:

1. **Given** thẻ kudos đang hiển thị (cả Highlight và All Kudos), **When** người dùng hover vào avatar hoặc tên người gửi/nhận, **Then** popover preview profile (frame `721:5827`) xuất hiện hiển thị thông tin tóm tắt: avatar, tên, phòng ban, số hoa thị.
2. **Given** popover profile preview đang hiển thị, **When** người dùng di chuột ra ngoài vùng hover, **Then** popover tự động đóng.
3. **Given** popover profile preview đang hiển thị, **When** người dùng click vào tên/avatar (không chỉ hover), **Then** navigate đến trang profile đầy đủ.

---

### Edge Cases

- Người dùng gửi kudos cho chính mình → form PHẢI ngăn chặn (validation).
- Kudos text quá dài → truncate tại 3 dòng trong card; link "Xem chi tiết" để xem đầy đủ.
- Hashtag > 5 cái trong một card → truncate với "...".
- Clipboard API không khả dụng (non-HTTPS, browser cũ) → "Copy Link" fallback: show link text copiable.
- Sidebar thống kê giá trị = 0 → hiển thị "0", không bị hidden.
- List D.3 rỗng → hiển thị "Chưa có dữ liệu".
- Infinite scroll lỗi mạng → hiển thị nút "Thử lại".
- Mở quà khi `secret_box_count = 0` → button disabled, không gọi dialog.
- Người dùng like kudos của chính mình (sender_id = current user) → nút heart disabled trên UI và API guard trả về 403.
- Unlike khi `kudos_likes` record không tồn tại → API trả về lỗi, không thay đổi `heart_count` hay `hearts_received`.
- Ngày đặc biệt kết thúc nửa chừng nhưng người dùng đã like trong ngày đó → `is_special_day = true` được giữ nguyên trong `kudos_likes`, unlike vẫn thu hồi đúng 2 tim.
- Carousel filter trả về < 5 kết quả → carousel chỉ hiển thị số kết quả có; pagination cập nhật đúng.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component ID | No | Name | Description | Interaction |
|---|---|---|---|---|
| `2940:13433` | — | Header | Navigation bar cố định (shared) | Xem spec Homepage A1 |
| `I2940:13433;178:1033;178:1030` | — | Header Logo PNG | Logo SAA | Click → scroll top |
| `2940:13437` | A | A_KV Kudos | Hero banner: tiêu đề "Hệ thống ghi nhận lời cảm ơn" + logo KUDOS SVG | Readonly |
| `2940:13440` | — | KUDOS Logo SVG | Logo Sun* Kudos trong banner | Decorative |
| `2940:13449` | A.1 | Button ghi nhận (chính) | Pill input " Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?", icon bút trái | Click → Mở dialog gửi kudos |
| `I2940:13449;186:2759` | — | Button ghi nhận icon SVG | Icon bút viết | Decorative |
| `2940:13451` | B | B_Highlight | Section "Highlight Kudos": header + filter + carousel | — |
| `2940:13452` | B.1 | B.1_header | Tiêu đề "HIGHLIGHT KUDOS" + subtitle + bộ lọc Hashtag/Phòng ban | — |
| `2940:13459` | B.1.1 | ButtonHashtag | Nút lọc "Hashtag" → Dropdown `1002:13013` | Click → open dropdown hashtag |
| `2940:13460` | B.1.2 | Button Phòng ban | Nút lọc "Phòng ban" → Dropdown `721:5684` | Click → open dropdown phòng ban |
| `2940:13461` | B.2 | B.2_HIGHLIGHT KUDOS | Carousel container với 5 kudos nổi bật theo `heart_count` | Slide navigation |
| `2940:13463` | B.2.3 | Content Highlight | Carousel track (slide content) | — |
| `2940:13465` | B.3 | B.3_KUDO Highlight | Card kudos trong carousel: avatar gửi → mũi tên → avatar nhận, thời gian, nội dung (max **3 dòng**), hashtags (5 max), tim, Copy Link, **Xem chi tiết** | Click tim / Copy Link / Xem chi tiết; Hover avatar/tên → preview profile (`721:5827`) |
| `I2940:13465;335:9443;256:4734` | B.3.1 | Avatar người gửi | Ảnh đại diện gmail tròn; `aria-hidden="false"` khi interactive | Click → profile; Hover → preview profile (`721:5827`) |
| `I2940:13465;335:9443;256:4737` | B.3.2 | Thông tin người gửi | Họ tên + phòng ban + số hoa thị ★ | Click tên → profile; Hover hoa thị → tooltip mô tả tier |
| `I2940:13465;335:9446;256:4734` | B.3.5 | Avatar người nhận | Ảnh tròn người nhận | Click → profile; Hover → preview |
| `2940:13468` | B.2.2 | Button tiến | Nút → slide tiếp theo; disabled ở slide cuối | Click → next slide |
| `2940:13470` | B.2.1 | Button lùi | Nút ← slide trước; disabled ở slide đầu | Click → prev slide |
| `2940:13471` | B.5 | B.5_slide | Thanh pagination carousel: ← "2/5" → | Click arrows → prev/next |
| `2940:13472` | B.5.1 | Button lùi (pagination) | Mũi tên trái | Click → prev slide; disabled ở 1/N |
| `2940:13473` | B.5.2 | Số trang | Text "2/5" cập nhật theo slide | Readonly |
| `2940:13474` | B.5.3 | Button tiến (pagination) | Mũi tên phải | Click → next slide; disabled ở N/N |
| `2940:13476` | B.6 | Header Spotlight | "Sun* Annual Awards 2025 / SPOTLIGHT BOARD" | Static |
| `2940:14174` | B.7 | B.7_Spotlight | Word-cloud interactive board: tên Sunner dàn trải, tổng kudos, tìm kiếm | Hover tooltip (tên + thời gian nhận kudos gần nhất); Click node → `/kudos/[id]` của kudos MỚI NHẤT thuộc receiver đó; Pan/Zoom |
| `3007:17482` | B.7.1 | "388 KUDOS" | Total kudos counter (query từ DB) | Readonly, auto-update |
| `3007:17479` | B.7.2 | Pan/Zoom button | Toggle pan/zoom mode | Click → toggle mode |
| `2940:14833` | B.7.3 | Tìm kiếm sunner | Input search trong Spotlight; maxLength 100 | Enter/Click icon → highlight node |
| `2940:13475` | C | C_All kudos | Section "ALL KUDOS": feed thẻ + sidebar | — |
| `2940:14221` | C.1 | Header All Kudos | "Sun* Annual Awards 2025 / ALL KUDOS" | Static |
| `2940:13482` | C.2 | Danh sách lời cảm ơn | Feed list thẻ kudos với infinite scroll | Scroll → load more; Click card → detail |
| `3127:21871` | C.3 | C.3_KUDO Post | Thẻ kudos: avatar gửi, mũi tên, avatar nhận, thời gian, nội dung (max **5 dòng**), gallery, hashtag, tim, Copy Link. **Không có nút "Xem chi tiết"** — click vào thẻ để mở detail | Click thẻ → detail; Click tim; Click Copy Link; Hover avatar/tên → preview profile (`721:5827`) |
| `3127:22053` | C.5 | C.5_KUDOpost | Thẻ kudos (giống C.3) | — |
| `3127:22375` | C.6 | C.6_KUDOpost | Thẻ kudos (giống C.3) | — |
| `3127:22439` | C.7 | C.7_KUDOpost | Thẻ kudos (giống C.3) | — |
| `2940:13488` | D | D_Thống kê menu phải | Sidebar: thống kê + Mở quà + 2 leaderboard (D.2 thăng hạng mới nhất, D.3 nhận quà mới nhất) | Sticky scroll; scroll độc lập |
| `2940:13489` | D.1 | D.1_Thống kê tổng quát | 5 chỉ số (D.1.2–D.1.7 không kể divider) + nút Mở quà. Nhóm kudos (D.1.2, D.1.3, D.1.4) và nhóm Secret Box (D.1.6, D.1.7) phân cách bởi divider D.1.5 | — |
| `2940:13491` | D.1.2 | Số kudos nhận được | "Số Kudos bạn nhận được: N" | Readonly |
| `2940:13492` | D.1.3 | Số kudos đã gửi | "Số Kudos bạn đã gửi: N" | Readonly |
| `3241:14882` | D.1.4 | Số tim | "Số tim bạn nhận được: N" — hiển thị `profiles.hearts_received` của current user; tim tích lũy từ lượt like trên các kudos user ĐÃ GỬI | Readonly |
| `2940:13494` | D.1.5 | Divider | Đường phân cách ngang | Decorative |
| `2940:13495` | D.1.6 | Số secret box đã mở | "Số Secret Box bạn đã mở: N" | Readonly |
| `2940:13496` | D.1.7 | Số secret box chưa mở | "Số Secret Box chưa mở: N" | Readonly |
| `2940:13497` | D.1.8 | Button Mở quà | Nút "Mở quà" → dialog `1466:7676` | Click → dialog open; disabled nếu `secret_box_count = 0` |
| `I2940:13497;186:1766` | — | Mở quà icon SVG | Icon quà trong nút | Decorative |
| `2940:13510` | D.3 | 10 SUNNER nhận quà | List 10 Sunner nhận quà mới nhất: avatar + tên + mô tả quà | Click avatar/tên → profile; Hover → preview |
| `2940:13513` | D.3.1 | Title "10 SUNNER NHẬN QUÀ MỚI NHẤT" | Label tiêu đề | Readonly |
| `2940:13516–13520` | D.3.2–D.3.6 | Thông tin Sunner nhận quà | Avatar tròn + tên + mô tả quà | Click → profile; Hover → preview profile |
| — | D.2 | 10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT | List 10 Sunner có thăng hạng mới nhất (kudos_star_tier vừa tăng): avatar + tên + mô tả thăng hạng; sorted by `updated_at` DESC của `profiles.kudos_star_tier` | Click avatar/tên → profile; Hover → preview |
| `2940:13522` | — | Footer | Logo + nav links + copyright (shared) | Click links → navigate |
| `I2940:13522;342:1408;178:1030` | — | Footer Logo PNG | SAA logo | Click → scroll top |

### Star Rating Tiers (B.3.2)

| Stars | Threshold | Description |
|---|---|---|
| ★ (1) | ≥ 10 Kudos nhận | "Sunner đã nhận được 10 Kudos và bắt đầu lan tỏa năng lượng ấm áp đến mọi người xung quanh." |
| ★★ (2) | ≥ 20 Kudos nhận | "Sunner đã nhận được 20 Kudos và chứng minh sức ảnh hưởng của mình qua những hành động lan tỏa tích cực mỗi ngày." |
| ★★★ (3) | ≥ 50 Kudos nhận | "Sunner đã nhận được 50 Kudos và trở thành hình mẫu của sự công nhận, sẻ chia và lan tỏa tinh thần Sun*." |

### Navigation Flow

```
/kudos (Live Board)
  ├── A.1 "Ghi nhận" click → Dialog Gửi Kudos
  │     └── Submit → POST /api/kudos → close dialog + refresh feed
  ├── B (Highlight) filter → GET /api/kudos?hashtag=X&department=Y (applies to B + C)
  ├── B carousel "Xem chi tiết" → /kudos/[id]
  ├── B/C "Copy Link" → navigator.clipboard.writeText(url) + toast
  ├── B/C avatar/tên → /profile/[userId]
  ├── B.7 node click → /kudos/[id]
  ├── B.7.3 search → highlight node in spotlight
  ├── D.1.8 "Mở quà" → Dialog Secret Box (1466:7676)
  ├── D.3 avatar/tên → /profile/[userId]
  └── Header/Footer links → /about, /awards, /kudos, /tieu-chuan-chung
```

### Visual Requirements

- **Hero banner**: Artwork/graphic nền trang trí; tiêu đề "Hệ thống ghi nhận lời cảm ơn" lớn, nổi bật; logo KUDOS SVG bên dưới.
- **A.1 Button ghi nhận**: Pill shape rộng, nền tối trong suốt hoặc xanh nhạt, border mờ, placeholder màu xám nhạt, icon bút ở trái.
- **B.3 Card Highlight**: Tỷ lệ to hơn, viền vàng/sáng, nền tối. Slide trung tâm = active (opacity full + scale lên); 2 slide bên = inactive (opacity ~50%, scale nhỏ hơn).
- **Tim button**: Default = icon heart màu xám; Active/liked = icon heart màu đỏ, số tăng.
- **Sidebar (D)**: `position: sticky; top: var(--header-height)`, overflow-y auto khi nội dung dài.
- **Spotlight Board**: Canvas hoặc SVG/D3 word-cloud; node size tỷ lệ với số kudos nhận; các node clickable, hoverable.
- **Layout C**: 2 cột — feed chính (rộng) bên trái + sidebar (hẹp) bên phải, giống layout blog.
- **Responsive**: Desktop (1440px): layout 2 cột; Tablet (768px): sidebar ẩn hoặc thu gọn; Mobile (375px): single column.

---

## Requirements

### Functional Requirements

- **FR-001**: Trang `/kudos` CHỈ hiển thị khi người dùng đã đăng nhập; unauthenticated → redirect `/login`.
- **FR-002**: Carousel Highlight Kudos PHẢI hiển thị TOP 5 kudos có `heart_count` cao nhất (sau khi áp dụng filter).
- **FR-003**: Bộ lọc Hashtag và Phòng ban ÁP DỤNG CHO CẢ Highlight carousel VÀ All Kudos feed; sau khi filter, pagination về trang 1.
- **FR-004**: Carousel navigation PHẢI disable nút lùi ở slide 1 và nút tiến ở slide cuối.
- **FR-005**: Heart (like) PHẢI toggle: click thêm 1 like; click lại bỏ like (trừ 1). Cập nhật realtime optimistically. Mỗi người dùng chỉ có **1 lượt like** duy nhất cho mỗi kudos. Khi like: profile của người **gửi** kudos cộng +1 tim (hoặc +2 nếu là ngày đặc biệt). Khi unlike: thu hồi đúng số tim đã cộng (1 hoặc 2), dựa trên `kudos_likes.is_special_day`.
- **FR-005b**: Người **gửi** kudos (sender_id = current user) PHẢI bị disabled nút heart trên kudos đó — không thể self-like.
- **FR-006**: "Copy Link" PHẢI sao chép URL dạng `{SITE_URL}/kudos/{id}` vào clipboard và hiển thị toast xác nhận.
- **FR-007**: All Kudos feed PHẢI dùng infinite scroll (load thêm khi scroll gần cuối).
- **FR-008**: Nút "Mở quà" (D.1.8) PHẢI disabled khi `secret_box_count_unopened = 0`.
- **FR-009**: Spotlight Board PHẢI hiển thị tổng số kudos (`COUNT(*)` từ DB); hover node → tooltip; click node → kudos detail.
- **FR-010**: Form gửi kudos PHẢI ngăn không cho gửi kudos cho chính mình.
- **FR-011**: Kudos nội dung trong **Highlight card (B)** truncate tại **3 dòng** với "..."; trong **All Kudos card (C)** truncate tại **5 dòng** với "...". Cả hai đều có thể click vào card để xem đầy đủ tại trang chi tiết.
- **FR-012**: Hashtag trong card > 5 cái trong 1 dòng → truncate với "...".
- **FR-013**: Trang PHẢI hỗ trợ 2 ngôn ngữ VN/EN qua `next-intl`.
- **FR-014**: Click vào một hashtag tag trực tiếp trên thẻ kudos (B.4.3, C.3.7, D.4) PHẢI áp dụng filter hashtag tương ứng (giống chọn từ dropdown B.1.1), cập nhật cả Highlight carousel và All Kudos feed.
- **FR-015**: Hệ thống PHẢI đọc bảng `special_days` khi xử lý like để xác định `is_special_day`; qua đó cộng đúng 1 tim hoặc 2 tim cho sender profile.
- **FR-016**: Hover lên avatar hoặc tên sender/receiver trên bất kỳ thẻ kudos nào PHẢI hiển thị popover preview profile (frame `721:5827`).
- **FR-017**: Icon sent (C.3.2) là decorative — KHÔNG có focus state, PHẢI có `aria-hidden="true"`.
- **FR-018**: Sidebar (D) PHẢI có scroll độc lập — không ảnh hưởng đến scroll của feed chính (C.2).
- **FR-019**: D.2 "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" PHẢI lấy dữ liệu từ `profiles` sắp xếp theo thứ tự `kudos_star_tier_updated_at DESC`; rỗng → hiển thị "Chưa có dữ liệu".
- **FR-020**: Nút "Xem chi tiết" CHỈ xuất hiện trong Highlight card (B.4.4). All Kudos card (C.4) KHÔNG có nút này — người dùng click vào thẻ để xem chi tiết.

### Non-Functional Requirements

- **NFR-001**: Trang shell (header, banner, section titles) là Server Component; interactive components (carousel, like button, sidebar real-time stats, infinite scroll) là Client Components (`'use client'`).
- **NFR-002**: Like toggle dùng **optimistic update** — UI cập nhật ngay, rollback nếu API lỗi.
- **NFR-003**: Danh sách hashtag và phòng ban trong dropdown PHẢI được fetch từ DB, không hardcode.
- **NFR-004**: Spotlight Board là heavy client component — lazy-load hoặc dynamic import để không block initial load.
- **NFR-005**: Infinite scroll dùng `IntersectionObserver` trên sentinel element ở cuối feed.
- **NFR-006**: Sidebar sticky dùng CSS `position: sticky; top: <header-height>`.

### Technical Requirements

- **TR-001**: `kudos` table (Supabase): `id`, `sender_id` (FK profiles), `receiver_id` (FK profiles), `message` (text), `hashtags` (text[]), `heart_count` (int, default 0), `created_at`, `department_id` (FK departments — phòng ban của **receiver** tại thời điểm gửi kudos, denormalize để tối ưu filter query).
- **TR-002**: `kudos_likes` table: `kudos_id`, `user_id`, `created_at`, `is_special_day` (bool, default false) — để track ai đã like và liệu like đó có được thực hiện trong ngày đặc biệt không (phục vụ thu hồi tim đúng số lượng khi unlike).
- **TR-003**: `secret_boxes` table: `id`, `user_id`, `is_opened` (bool), `created_at` — Sidebar D.1.6/D.1.7 query từ đây.
- **TR-004**: Highlight Kudos query: `SELECT * FROM kudos ORDER BY heart_count DESC LIMIT 5 [WHERE hashtag=? AND department_id=?]`.
- **TR-005**: Like toggle: `UPSERT` vào `kudos_likes` (với `is_special_day` được set theo bảng `special_days`); dùng DB trigger hoặc RPC để: (1) update `kudos.heart_count`; (2) cộng/trừ `profiles.hearts_received` của **người gửi** kudos — +1 hoặc +2 khi like (theo `is_special_day`), trừ đúng 1 hoặc 2 khi unlike (đọc từ bản ghi `kudos_likes.is_special_day` hiện có).
- **TR-014**: Bảng `special_days`: `id`, `date` (DATE, unique), `created_by` (FK profiles — admin), `created_at`. API like PHẢI check `SELECT EXISTS(SELECT 1 FROM special_days WHERE date = CURRENT_DATE)` để set `is_special_day`.
- **TR-006**: All Kudos infinite scroll: cursor-based pagination (sử dụng `created_at` làm cursor, `LIMIT 20`).
- **TR-007**: Spotlight Board total count: `SELECT COUNT(*) FROM kudos` (real-time bằng Supabase Realtime subscription hoặc polling mỗi 30s).
- **TR-008**: "Copy Link" dùng `navigator.clipboard.writeText()` với fallback `document.execCommand('copy')` cho browser cũ.
- **TR-009**: Dropdown hashtag/phòng ban: fetch 1 lần khi component mount; cache trong state.
- **TR-010**: Người dùng không thể gửi kudos cho chính mình: validate `sender_id !== receiver_id` cả ở client (disable option) và server (API guard).
- **TR-011**: Sidebar thống kê fetch từ Supabase RPC hoặc view tổng hợp trả về `{kudos_received, kudos_sent, hearts_received, secret_box_opened, secret_box_unopened}` theo `user_id`. Trong đó `hearts_received` = tổng tim tích lũy từ lượt like/unlike trên kudos mà user là sender (không phải receiver).
- **TR-015**: D.2 "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT": `SELECT * FROM profiles WHERE kudos_star_tier IS NOT NULL ORDER BY kudos_star_tier_updated_at DESC LIMIT 10`. Cần thêm cột `kudos_star_tier_updated_at` (TIMESTAMPTZ) vào bảng `profiles` để track lần cuối tier thay đổi.
- **TR-012**: Bảo mật: Like API PHẢI kiểm tra session; không cho phép unauthenticated like. Gửi kudos cũng cần session hợp lệ.
- **TR-013**: Sau mỗi kudos insert thành công, hệ thống CẬP NHẬT `profiles.kudos_star_tier` của receiver bằng DB trigger hoặc Supabase RPC: đếm total kudos nhận được của receiver, set `kudos_star_tier` → `1` nếu ≥10, `2` nếu ≥20, `3` nếu ≥50; giữ `null` nếu < 10.

### Key Entities

| Entity | Table | Key Columns |
|---|---|---|
| Kudos post | `kudos` | `id`, `sender_id`, `receiver_id`, `message`, `hashtags[]`, `heart_count`, `created_at`, `department_id` |
| Like | `kudos_likes` | `kudos_id`, `user_id`, `created_at`, `is_special_day` |
| Secret Box | `secret_boxes` | `id`, `user_id`, `is_opened`, `created_at` |
| Profile | `profiles` | `id`, `full_name`, `avatar_url`, `department_id`, `locale`, `kudos_star_tier`, `kudos_star_tier_updated_at`, `hearts_received`, `role` |
| Hashtag | `hashtags` | `id`, `name` |
| Department | `departments` | `id`, `name` |
| Special Day | `special_days` | `id`, `date` (DATE unique), `created_by`, `created_at` |

> **Lưu ý**: `profiles.hearts_received` theo dõi tổng tim người dùng nhận được **với tư cách là người GỬI kudos** (không phải người nhận). Tim tăng/giảm khi người khác like/unlike kudos do user đó gửi, với hệ số x1 (ngày thường) hoặc x2 (ngày đặc biệt). `profiles.kudos_star_tier` sử dụng số kudos NHẬN được (receiver_id) để xác định tier sao — hai chỉ số này hoàn toàn độc lập.

---

## Implementation Notes

### File Structure

```
src/
├── app/
│   └── (main)/
│       └── kudos/
│           ├── page.tsx                    # Server Component — session guard, fetch initial data
│           └── [id]/
│               └── page.tsx                # Kudos detail page
├── components/
│   ├── layout/
│   │   ├── Header.tsx                      # Shared — `src/components/layout/Header.tsx` (dùng chung tất cả pages)
│   │   └── Footer.tsx                      # Shared — `src/components/layout/Footer.tsx` (dùng chung tất cả pages)
│   └── kudos/
│       ├── KudosHero.tsx                   # Server Component — banner + A.1 button
│       ├── SendKudosButton.tsx             # Client Component — 'use client', pill input trigger
│       ├── SendKudosDialog.tsx             # Client Component — form dialog (người nhận, nội dung, hashtag)
│       ├── HighlightSection.tsx            # Client Component — B header + filter + carousel
│       ├── HighlightCarousel.tsx           # Client Component — slide logic, prev/next, pagination
│       ├── KudoHighlightCard.tsx           # Client Component — single Highlight card (like, copy, detail)
│       ├── SpotlightBoard.tsx              # Client Component — lazy-loaded, D3/canvas word-cloud
│       ├── AllKudosSection.tsx             # Client Component — feed + infinite scroll
│       ├── KudoCard.tsx                    # Client Component — reusable kudos post card
│       ├── KudosSidebar.tsx                # Client Component — sticky sidebar: stats + open box + leaderboard
│       └── SecretBoxDialog.tsx             # Client Component — dialog mở quà
└── lib/
    └── kudos.ts                            # API helpers: sendKudos, toggleLike, fetchHighlight, fetchAll, fetchStats
```

### API Endpoints (Supabase RPC / Edge Functions)

```typescript
// Fetch highlight kudos (top 5 by heart_count)
GET /api/kudos/highlight?hashtag=X&department=Y

// Fetch all kudos (cursor-based)
GET /api/kudos?cursor=ISO_DATE&limit=20&hashtag=X&department=Y

// Send kudos
POST /api/kudos
body: { receiver_id, message, hashtag_ids[] }

// Toggle like
POST /api/kudos/:id/like

// Fetch user stats
GET /api/me/kudos-stats

// Fetch hashtags
GET /api/hashtags

// Fetch departments
GET /api/departments
```

### Like Optimistic Update Pattern

```typescript
// KudoCard.tsx
const [liked, setLiked] = useState(initialLiked);
const [count, setCount] = useState(initialCount);

async function handleLike() {
  // Optimistic
  setLiked(!liked);
  setCount(liked ? count - 1 : count + 1);
  try {
    await toggleLike(kudosId);
  } catch {
    // Rollback
    setLiked(liked);
    setCount(count);
  }
}
```

### Media Assets (from Figma)

| Asset | Node ID | Destination Path |
|---|---|---|
| Header background PNG | `I2940:13432;2167:5141` | Shared with Homepage header |
| Header Logo PNG | `I2940:13433;178:1033;178:1030` | Shared with Homepage header |
| KUDOS Logo SVG | `2940:13440` | `public/assets/kudos/icons/kudos-logo.svg` |
| Send Kudos icon (filled) SVG | `I2940:13449;186:2759` | `public/assets/kudos/icons/pencil-filled.svg` |
| Send Kudos icon (outline) SVG | `I2940:13450;186:2759` | `public/assets/kudos/icons/pencil-outline.svg` |
| Prev arrow SVG | `I2940:13468;186:1420` | `public/assets/kudos/icons/arrow-left.svg` |
| Next arrow SVG | `I2940:13470;186:1420` | `public/assets/kudos/icons/arrow-right.svg` |
| Open gift icon SVG | `I2940:13497;186:1766` | `public/assets/kudos/icons/gift.svg` |
| Footer Logo PNG | `I2940:13522;342:1408;178:1030` | Shared with Homepage footer |
| Spotlight "Xem chi tiết" arrow SVG | `I3127:21871;256:5171` | `public/assets/kudos/icons/detail-arrow.svg` |
| Copy link icon SVG | `I3127:21871;256:5216;186:1441` | `public/assets/kudos/icons/copy-link.svg` |
