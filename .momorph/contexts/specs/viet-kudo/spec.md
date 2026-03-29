# Feature Specification: Viết Kudo

**Frame ID**: `520:11602`
**Frame Name**: `Viết Kudo`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph Frame ID**: `6398`
**Figma Link**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=520:11602
**Created**: 2026-03-25
**Status**: Draft

---

## Overview

Màn hình "Viết Kudo" là modal form cho phép người dùng gửi lời cảm ơn và ghi nhận đến đồng đội (Kudos). Modal hiển thị đè lên trang Kudos Live Board khi người dùng nhấn nút "Viết Kudo".

Form gồm các thành phần chính:

- **A — Tiêu đề**: "Gửi lời cám ơn và ghi nhận đến đồng đội"
- **B — Người nhận**: Search dropdown bắt buộc để tìm và chọn đồng đội nhận Kudo
- **B' — Danh hiệu**: Text input bắt buộc để đặt tiêu đề / danh hiệu cho Kudo *(không có ID trong MoMorph design items — xác nhận từ screenshot Figma)*
- **C — Thanh định dạng (Toolbar)**: Các nút định dạng phong phú (Bold, Italic, Stroke, List, Link, Quote) + liên kết "Tiêu chuẩn cộng đồng"
- **D — Nội dung (Textarea)**: Ô nhập lời cảm ơn có rich text, hỗ trợ `@mention`
- **E — Hashtag**: Bộ chọn chip hashtag bắt buộc, tối đa 5 tag
- **F — Image**: Upload ảnh đính kèm tùy chọn, tối đa 5 ảnh
- **G — Gửi ẩn danh**: Checkbox tùy chọn gửi ẩn danh
- **H — Buttons**: Nút "Hủy" (ghost) và nút "Gửi" (primary, nền vàng)

---

## User Scenarios & Testing

### User Story 1 — Mở form Viết Kudo (Priority: P1)

Người dùng đã đăng nhập nhấn nút gửi Kudo để mở modal form.

**Why this priority**: Đây là entry point chính của tính năng Kudos.

**Independent Test**: Chỉ cần session hợp lệ và trang Kudos đã load.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập và đang ở trang `/kudos`, **When** nhấn nút "Viết Kudo", **Then** modal "Viết Kudo" xuất hiện đè lên nền tối, cuộn nội dung bên dưới bị khóa (`overflow: hidden` trên body).
2. **Given** modal đang mở, **When** nhấn nút "Hủy" hoặc click vùng overlay tối bên ngoài, **Then** modal đóng lại và form bị reset về trạng thái rỗng.
3. **Given** modal đang mở, **When** nhấn phím `Escape`, **Then** modal đóng lại.
4. **Given** người dùng chưa đăng nhập, **When** truy cập `/kudos`, **Then** middleware redirect về `/login` (modal không xuất hiện).

---

### User Story 2 — Chọn người nhận (Priority: P1)

Người dùng tìm kiếm và chọn đồng đội nhận Kudo.

**Why this priority**: Trường bắt buộc cốt lõi — không có người nhận thì không thể gửi.

**Independent Test**: Cần API `/api/users/search?q=` để trả về danh sách gợi ý.

**Acceptance Scenarios**:

1. **Given** modal đang mở, **When** focus vào ô "Người nhận" và gõ ít nhất 1 ký tự, **Then** dropdown gợi ý hiện ra với danh sách đồng đội khớp.
2. **Given** dropdown đang hiển thị, **When** click một tên trong danh sách, **Then** người nhận được điền vào ô và dropdown đóng.
3. **Given** người dùng đã chọn người nhận, **When** muốn đổi người, **Then** có thể xóa lựa chọn và tìm lại.
4. **Given** người dùng nhấn "Gửi" mà chưa chọn người nhận, **Then** ô "Người nhận" hiển thị viền đỏ và thông báo lỗi "Vui lòng chọn người nhận".
5. **Given** không tìm thấy kết quả, **When** dropdown hiện, **Then** hiển thị text "Không tìm thấy kết quả".

---

### User Story 3 — Điền danh hiệu (Priority: P1)

Người dùng nhập tiêu đề / danh hiệu để đặt tên cho Kudo.

**Why this priority**: Danh hiệu là tiêu đề hiển thị nổi bật trên card Kudo — bắt buộc.

**Independent Test**: Client-side validation, không cần API.

**Acceptance Scenarios**:

1. **Given** modal đang mở, **When** focus vào ô "Danh hiệu", **Then** placeholder "Dành tặng một danh hiệu cho đồng đội" hiển thị; bên dưới hiện hint "Ví dụ: Người truyền động lực cho tôi.\nDanh hiệu sẽ hiển thị làm tiêu đề Kudos của bạn."
2. **Given** người dùng nhập danh hiệu hợp lệ, **When** focus ra ngoài, **Then** không hiện lỗi.
3. **Given** người dùng nhấn "Gửi" mà ô "Danh hiệu" rỗng, **Then** ô hiển thị viền đỏ và thông báo lỗi bắt buộc.

---

### User Story 4 — Nhập nội dung lời cảm ơn (Priority: P1)

Người dùng soạn thảo nội dung lời cảm ơn với rich text.

**Why this priority**: Đây là phần nội dung chính của Kudo.

**Independent Test**: Cần rich text editor (TipTap / Quill); test client-side.

**Acceptance Scenarios**:

1. **Given** modal đang mở, **When** focus vào textarea, **Then** placeholder "Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!" hiển thị.
2. **Given** người dùng đã gõ text, **When** select một đoạn và nhấn **B** (Bold), **Then** đoạn đó được in đậm.
3. **Given** người dùng đã gõ text, **When** select và nhấn **I** (Italic), **Then** đoạn đó được in nghiêng.
4. **Given** người dùng đã gõ text, **When** select và nhấn **S** (Stroke), **Then** đoạn đó được gạch ngang.
5. **Given** người dùng nhấn nút List (đánh số), **Then** định dạng ordered list được áp dụng cho dòng hiện tại.
6. **Given** người dùng nhấn nút Link, **Then** hộp thoại nhập URL hiện ra; sau khi điền và xác nhận, liên kết được chèn vào.
7. **Given** người dùng nhấn nút Quote, **Then** định dạng trích dẫn được áp dụng cho đoạn hiện tại.
8. **Given** người dùng gõ `@` rồi tiếp tục nhập tên, **Then** dropdown đề xuất tên đồng nghiệp xuất hiện; chọn một tên thì mention được chèn vào nội dung.
9. **Given** người dùng nhấn "Gửi" khi nội dung rỗng, **Then** textarea hiện viền đỏ + thông báo "Vui lòng nhập nội dung".
10. **Given** người dùng click "Tiêu chuẩn cộng đồng" (link đỏ trong toolbar), **Then** mở trang/modal hướng dẫn tiêu chuẩn cộng đồng.

---

### User Story 5 — Thêm Hashtag (Priority: P1)

Người dùng chọn hashtag để phân loại Kudo.

**Why this priority**: Hashtag là trường bắt buộc và dùng để filter trên Live Board.

**Independent Test**: Cần API danh sách hashtag có sẵn; test client-side chip management.

**Acceptance Scenarios**:

1. **Given** modal đang mở, **When** nhấn nút "+ Hashtag", **Then** dropdown hoặc input xuất hiện để chọn/tạo hashtag.
2. **Given** người dùng chọn một hashtag, **When** xác nhận, **Then** chip hashtag xuất hiện trong khu vực "E.2 Tag Group" kèm nút "×" để xóa.
3. **Given** đã có 5 chip hashtag, **When** cố thêm nữa, **Then** nút "+ Hashtag" ẩn hoặc disabled; không cho thêm.
4. **Given** có chip đang hiển thị, **When** nhấn "×" trên chip, **Then** chip bị xóa khỏi danh sách.
5. **Given** người dùng nhấn "Gửi" mà chưa thêm hashtag nào, **Then** phần Hashtag hiển thị lỗi bắt buộc.

---

### User Story 6 — Đính kèm ảnh (Priority: P2)

Người dùng tải ảnh để minh hoạ cho Kudo.

**Why this priority**: Tính năng tùy chọn giúp Kudo phong phú hơn.

**Independent Test**: Cần file picker; test client-side preview + upload.

**Acceptance Scenarios**:

1. **Given** modal đang mở, **When** nhấn nút "+ Image", **Then** file picker OS mở ra với filter ảnh (jpg, png, webp...).
2. **Given** người dùng chọn ảnh, **When** ảnh hợp lệ, **Then** thumbnail (ảnh nhỏ) xuất hiện trong khu vực Image kèm nút "×" đỏ góc trên.
3. **Given** đã có 5 thumbnail, **When** nút "+ Image" hoặc khi đã đủ 5, **Then** nút "+ Image" ẩn.
4. **Given** thumbnail ảnh đang hiển thị, **When** nhấn "×" trên thumbnail, **Then** ảnh bị xóa khỏi danh sách.
5. **Given** người dùng đính kèm ảnh không hợp lệ (sai định dạng / quá dung lượng), **Then** hiển thị thông báo lỗi; ảnh không được thêm vào.

---

### User Story 7 — Gửi ẩn danh (Priority: P2)

Người dùng chọn gửi Kudo mà không hiện tên.

**Why this priority**: Tính năng tùy chọn bảo vệ danh tính người gửi.

**Independent Test**: Client-side toggle + UI update.

**Acceptance Scenarios**:

1. **Given** modal đang mở, **When** nhìn vào cuối form, **Then** checkbox "Gửi lời cám ơn và ghi nhận ẩn danh" hiển thị, mặc định unchecked.
2. **Given** checkbox chưa được check, **When** click vào checkbox, **Then** trạng thái chuyển thành checked; **hiển thị** thêm text field để điền tên ẩn danh.
3. **Given** checkbox đang checked, **When** gửi Kudo, **Then** server lưu Kudo với `is_anonymous = true`; card Kudo trên Live Board không hiện tên người gửi thật.
4. **Given** checkbox chưa check, **When** gửi Kudo, **Then** server lưu `is_anonymous = false`; card Kudo hiện tên người gửi.

---

### User Story 8 — Gửi Kudo (Priority: P1)

Người dùng hoàn thành form và gửi Kudo.

**Why this priority**: Đây là hành động cốt lõi của toàn bộ tính năng.

**Independent Test**: Cần API `POST /api/kudos`; test happy path + validation errors.

**Acceptance Scenarios**:

1. **Given** tất cả trường bắt buộc (Người nhận, Danh hiệu, Nội dung, Hashtag) đã được điền, **When** nhấn "Gửi", **Then** nút "Gửi" hiển thị loading spinner.
2. **Given** API trả về thành công (2xx), **When** xử lý xong, **Then** modal đóng; Live Board cập nhật Kudo mới ở đầu feed; hiển thị toast "Gửi Kudo thành công!".
3. **Given** API trả về lỗi (4xx/5xx), **When** xử lý xong, **Then** modal vẫn mở; hiển thị thông báo lỗi; nút "Gửi" trở lại trạng thái bình thường.
4. **Given** ít nhất một trong 4 trường bắt buộc (Người nhận, Danh hiệu, Nội dung, Hashtag) chưa điền, **When** nhấn "Gửi", **Then** nút không gọi API; form highlight tất cả trường lỗi. *(Lưu ý: Figma H.2 description thiếu "Danh hiệu" trong danh sách required — nhưng screenshot có dấu `*` trên trường này, cần confirm với designer)*
5. **Given** "Gửi" đang loading, **When** chưa có phản hồi từ API, **Then** nút "Gửi" và nút "Hủy" đều disabled để tránh gửi trùng.

---

### Edge Cases

- Upload file không phải ảnh (PDF, doc...) → từ chối, hiển thị lỗi định dạng.
- Mạng chậm khi tải gợi ý người nhận → hiển thị skeleton/spinner trong dropdown.
- Gửi ẩn danh + mention `@tên` trong nội dung → hiển thị mention bình thường trong nội dung nhưng tên người gửi ẩn danh trên card.
- Người dùng nhập danh hiệu quá dài → cần xử lý truncate hoặc giới hạn ký tự theo rule backend.
- Modal trên mobile → cuộn nội dung bên trong modal (không cuộn trang nền).

---

## UI/UX Requirements *(from Figma)*

### Màn hình tổng quan

Modal hiển thị trên nền overlay tối (`rgba(0,0,0,0.6)`), bo tròn góc, nền trắng/kem (`#FFF8E7` hoặc tương đương). Chiều rộng tối đa ~600px, cuộn được trong modal nếu nội dung dài trên mobile.

### Screen Components

| Component ID | No | Name | Description | Interaction |
|---|---|---|---|---|
| `I520:11647;520:9870` | A | Tiêu đề modal | "Gửi lời cám ơn và ghi nhận đến đồng đội" — text lớn, center, trên cùng | Static |
| `I520:11647;520:9871` | B | Chọn người nhận | Label "Người nhận" (*) + search dropdown 514×56px, placeholder "Tìm kiếm", icon mũi tên | Gõ → autocomplete; chọn → điền; rỗng → block submit |
| `I520:11647;520:9872` | B.1 | Label Người nhận | Nhãn "Người nhận" kèm `*` đỏ | Static label |
| `I520:11647;520:9873` | B.2 | Search input | Text field tìm kiếm người nhận | Autocomplete dropdown |
| *(không có ID — thiếu trong Figma design items)* | B' | Danh hiệu | Label "Danh hiệu" (*) + text input 514×56px, placeholder "Dành tặng một danh hiệu cho đồng đội"; hint 2 dòng: "Ví dụ: Người truyền động lực cho tôi. / Danh hiệu sẽ hiển thị làm tiêu đề Kudos của bạn." | Required text input |
| `I520:11647;520:9877` | C | Toolbar định dạng | Thanh công cụ B/I/S/List/Link/Quote + link "Tiêu chuẩn cộng đồng" (màu đỏ) *(Figma có 3 lỗi data: `nameTrans` ghi sai "Trường chọn Người nhận"; `kind` ghi sai "text_form"; `required: true` — tất cả là lỗi trong Figma, không ảnh hưởng implementation)* | Toggle formatting |
| `I520:11647;520:9881` | C.1 | Bold | Nút **B** toggle in đậm | Toggle |
| `I520:11647;662:11119` | C.2 | Italic | Nút *I* toggle in nghiêng | Toggle |
| `I520:11647;662:11213` | C.3 | Stroke | Nút ~~S~~ toggle gạch ngang | Toggle |
| `I520:11647;662:10376` | C.4 | Number list | Nút đánh số ordered list | Toggle |
| `I520:11647;662:10507` | C.5 | Link | Nút chèn liên kết | Click → dialog nhập URL |
| `I520:11647;662:10647` | C.6 | Quote | Nút trích dẫn blockquote | Toggle |
| `I520:11647;520:9886` | D | Textarea nội dung | Rich text editor, placeholder "Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!" | Rich text + @mention |
| `I520:11647;520:9887` | D.1 | Gợi ý & đếm ký tự | Hint dưới textarea: `Bạn có thể "@+tên" để nhắc tới đồng nghiệp khác` | Static hint |
| `I520:11647;520:9890` | E | Hashtag | Label "Hashtag" (*) + chip group + nút "+ Hashtag" + note "Tối đa 5" | Click add → dropdown; chip × → remove |
| `I520:11647;520:9891` | E.1 | Label Hashtag | Nhãn "Hashtag" kèm `*` đỏ | Static label |
| `I520:11647;662:8595` | E.2 | Tag Group | Khu vực chip hashtag đã thêm (tối đa 5) | Chip + remove |
| `I520:11647;520:9896` | F | Image upload | Label "Image" + thumbnails + nút "+ Image" + note "Tối đa 5" | Click → file picker; × → remove |
| `I520:11647;520:9897` | F.1 | Label Image | Nhãn "Image" | Static label |
| `I520:11647;662:9197` | F.2 | Thumbnail (dynamic) | Figma định nghĩa 3 thumbnail instances (F.2/F.3/F.4) làm template; thực tế render **dynamic** theo số ảnh đã upload (0–5). Mỗi thumbnail hiển thị ảnh thu nhỏ + nút × đỏ góc trên. | Click × → xóa |
| `I520:11647;662:9132` | F.5 | Nút "+ Image" | Icon + "Image" + "Tối đa 5"; ẩn khi đủ 5 ảnh | Click → file picker |
| `I520:11647;520:14099` | G | Gửi ẩn danh | Checkbox "Gửi lời cám ơn và ghi nhận ẩn danh", default unchecked | Click → toggle anonymous |
| `I520:11647;520:9905` | H | Action bar | Footer modal: 2 nút "Hủy" (ghost) và "Gửi" (primary vàng) | Submit / Cancel |
| `I520:11647;520:9906` | H.1 | Nút Hủy | Ghost button "Hủy ×"; đóng modal, reset form. **Disabled trong khi "Gửi" đang loading** (tránh double-action). | Click → close modal (khi không loading) |
| `I520:11647;520:9907` | H.2 | Nút Gửi | Primary button "Gửi ▷", nền vàng; disabled nếu form chưa hợp lệ | Click → validate + submit |

### Validation Rules

| Trường | Required | Loại | Ràng buộc |
|---|---|---|---|
| Người nhận | ✅ | autocomplete | Phải chọn từ danh sách; không tự nhập tự do |
| Danh hiệu | ✅ | string | Không được rỗng; có thể giới hạn độ dài theo backend |
| Nội dung (textarea) | ✅ | rich text | Không được rỗng; hỗ trợ @mention |
| Hashtag | ✅ | string[] | Tối thiểu 1, tối đa 5 |
| Image | ❌ | file[] | Tùy chọn; tối đa 5 ảnh; chỉ ảnh hợp lệ |
| Gửi ẩn danh | ❌ | boolean | Mặc định `false` |

### Trạng thái nút "Gửi"

- **Enabled**: Tất cả 4 trường bắt buộc đã hợp lệ
- **Disabled**: Bất kỳ trường bắt buộc nào chưa điền hoặc invalid
- **Loading**: Đang gọi API gửi Kudo (spinner, cả "Hủy" disabled)
