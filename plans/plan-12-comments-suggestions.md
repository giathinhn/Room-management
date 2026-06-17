# Plan 12 — Booking Comments & Room Suggestions

> **Mục tiêu**: Thêm hệ thống comment trên mỗi booking + đề xuất phòng/giờ thay thế khi đặt phòng bị trùng.
> **Thời lượng ước tính**: 1.5–2 giờ
> **Phụ thuộc**: Plan 04 (booking system)
> **Độc lập với**: Plan 05, 06, 07, 10, 11, 13, 14

---

## Tổng quan

Plan này gộp **2 feature nhỏ** liên quan đến booking:
- **Comments**: Thread bình luận trên mỗi booking
- **Room Suggestions**: Đề xuất phòng/giờ thay thế khi conflict

---

## PHẦN A: BOOKING COMMENTS

### Backend

#### 1. Repository

**`src/repositories/comment.repository.js`**:

| Method | Mô tả |
|--------|--------|
| `findByBookingId(bookingId)` | Danh sách comments theo booking, include user info, sắp xếp theo createdAt ASC |
| `findById(id)` | Chi tiết comment |
| `create(data)` | Tạo comment mới |
| `update(id, content)` | Sửa nội dung comment |
| `delete(id)` | Xóa comment |

#### 2. Service

**`src/services/comment.service.js`**:

| Method | Logic |
|--------|-------|
| `getByBooking(bookingId)` | Kiểm tra booking tồn tại → Lấy comments |
| `create(bookingId, userId, content)` | Kiểm tra booking tồn tại → Kiểm tra user có quyền xem booking → Tạo comment |
| `update(commentId, userId, content)` | Kiểm tra ownership → Kiểm tra thời gian (chỉ sửa trong 5 phút đầu) → Cập nhật |
| `delete(commentId, userId)` | Kiểm tra ownership → Kiểm tra thời gian (chỉ xóa trong 5 phút đầu) → Xóa |

**Business rules:**
- Chỉ người liên quan đến booking mới được comment: chủ booking, approver, admin
- Sửa/xóa chỉ được trong **5 phút** kể từ khi tạo
- Content: 1–1000 ký tự

#### 3. Controller & Routes

```js
// Nested routes dưới bookings
router.get('/:id/comments',     authenticate, commentController.getByBooking);
router.post('/:id/comments',    authenticate, commentController.create);
router.put('/:id/comments/:cid', authenticate, commentController.update);
router.delete('/:id/comments/:cid', authenticate, commentController.delete);
```

### Frontend

#### 4. Components

**`src/components/bookings/CommentSection.jsx`**

```
┌──────────────────────────────────────────┐
│ 💬 Bình luận (3)                          │
├──────────────────────────────────────────┤
│ 👤 Nguyễn Văn A (Người đặt)     2 giờ   │
│ Có 5 khách ngoài tham dự, cần thêm ghế  │
├──────────────────────────────────────────┤
│ 👤 Trần Thị B (Người duyệt)    30 phút  │
│ OK, đã sắp xếp thêm 5 ghế. Nhớ dọn     │
│ phòng sau khi họp.                        │
│                           [Sửa] [Xóa]   │  ← Chỉ hiện trong 5 phút
├──────────────────────────────────────────┤
│ 👤 Admin                        5 phút   │
│ Phòng sẽ bảo trì sau 17:00 hôm nay     │
│                           [Sửa] [Xóa]   │
├──────────────────────────────────────────┤
│ [Viết bình luận...                    ]  │
│                              [Gửi 📤]   │
└──────────────────────────────────────────┘
```

**`src/components/bookings/CommentItem.jsx`**:
- Avatar (chữ cái đầu) + tên + role badge + time ago
- Content text
- Edit/Delete buttons (chỉ hiện nếu là owner + trong 5 phút)
- Edit mode: textarea replace content + Save/Cancel buttons

**`src/components/bookings/CommentInput.jsx`**:
- Textarea + gửi button
- Validation: không được trống, max 1000 ký tự
- Auto-resize textarea
- Disable khi đang submit

#### 5. Tích hợp

Thêm `<CommentSection bookingId={id} />` vào `BookingDetailPage.jsx`

---

## PHẦN B: ROOM SUGGESTIONS (ĐỀ XUẤT PHÒNG THAY THẾ)

### Backend

#### 6. Service

**`src/services/suggestion.service.js`**:

| Method | Logic |
|--------|-------|
| `getAlternativeRooms(roomId, startTime, endTime, minCapacity?)` | Tìm phòng khác **còn trống** cùng khung giờ → Sắp xếp: cùng tầng trước, capacity gần nhất trước |
| `getAlternativeSlots(roomId, date, preferredStartTime)` | Tìm **slot trống** gần nhất của cùng phòng đó trong ngày → Trả 3 slot trước + 3 slot sau |
| `getSmartSuggestions(userId)` | Phân tích booking history → Tìm pattern (phòng hay đặt, giờ hay đặt) → Đề xuất booking mới |

**getAlternativeRooms algorithm:**
```js
// 1. Lấy thông tin phòng gốc (location, capacity)
// 2. Tìm tất cả phòng trống cùng thời gian (reuse findAvailable)
// 3. Ranking score cho mỗi phòng:
//    - Cùng location (tầng/tòa) → +10 điểm
//    - Capacity chênh lệch nhỏ → +5 điểm (capacity diff < 5)
//    - Có cùng equipment → +3 điểm mỗi thiết bị trùng
// 4. Sắp xếp theo score giảm dần
// 5. Trả top 5
```

**getAlternativeSlots algorithm:**
```js
// 1. Lấy tất cả bookings (pending/approved) của phòng trong ngày
// 2. Tính gaps (khoảng trống) giữa các bookings
//    07:00 ░░░░ 09:00 ████ 10:30 ░░░░░ 14:00 ████ 15:00 ░░░░ 22:00
//    → Gaps: [07:00-09:00], [10:30-14:00], [15:00-22:00]
// 3. Lọc gaps đủ dài (≥ 30 phút)
// 4. Sắp xếp theo khoảng cách tới preferredStartTime
// 5. Trả top 5 slots
```

**getSmartSuggestions algorithm:**
```js
// 1. Lấy 30 bookings gần nhất của user (approved)
// 2. Phân tích pattern:
//    - Top 3 phòng hay đặt nhất
//    - Top 3 khung giờ hay đặt nhất
//    - Ngày trong tuần hay đặt nhất
// 3. Với mỗi pattern → kiểm tra tuần tới có trống không
// 4. Trả danh sách suggestions dạng:
//    { message: "Bạn thường họp T3 9:00 ở Phòng A1", room, startTime, endTime, available: true/false }
```

#### 7. Controller & Routes

```js
router.get('/rooms',        authenticate, suggestionController.getAlternativeRooms);
// Query: roomId, startTime, endTime, minCapacity
router.get('/alternatives', authenticate, suggestionController.getAlternativeSlots);
// Query: roomId, date, preferredStartTime
router.get('/smart',        authenticate, suggestionController.getSmartSuggestions);
```

### Frontend

#### 8. Tích hợp vào Booking Flow

**Sửa `src/components/bookings/ConflictAlert.jsx`** — thêm suggestions:

```
┌──────────────────────────────────────────────────┐
│ ⚠️ Phòng A1 đã có lịch trong khung giờ này        │
│                                                   │
│ 📍 Phòng thay thế cùng giờ:                       │
│ ┌────────────────────────────────────────────┐    │
│ │ ✨ Phòng B2 — Tầng 3, Tòa A — 15 người    │    │  ← Cùng tầng = highlight
│ │ 📽️ Máy chiếu  🎤 Micro        [Chọn →]    │    │
│ └────────────────────────────────────────────┘    │
│ ┌────────────────────────────────────────────┐    │
│ │ Phòng C3 — Tầng 5, Tòa B — 20 người       │    │
│ │ 📽️ Máy chiếu  🖥️ TV            [Chọn →]    │    │
│ └────────────────────────────────────────────┘    │
│                                                   │
│ 🕐 Giờ thay thế cùng phòng A1:                    │
│ • 07:00–09:00 (trống)              [Chọn]        │
│ • 10:30–12:00 (trống)              [Chọn]        │
│ • 14:00–16:00 (trống)              [Chọn]        │
└──────────────────────────────────────────────────┘
```

**`src/components/bookings/SmartSuggestions.jsx`** — Hiển thị trên BookingCreatePage:

```
┌──────────────────────────────────────────┐
│ 💡 Gợi ý cho bạn                          │
│                                           │
│ 🔄 Bạn thường họp T3 lúc 9:00            │
│ Phòng A1 đang trống!        [Đặt ngay]  │
│                                           │
│ 📅 Họp sprint hàng tuần — T6 14:00       │
│ Phòng B2 trống              [Đặt ngay]  │
└──────────────────────────────────────────┘
```

---

## Cấu trúc file tạo mới

```
backend/src/
├── repositories/comment.repository.js       ★ MỚI
├── services/comment.service.js              ★ MỚI
├── services/suggestion.service.js           ★ MỚI
├── controllers/comment.controller.js        ★ MỚI
├── controllers/suggestion.controller.js     ★ MỚI
├── routes/booking.routes.js                 (sửa — thêm comment routes)
├── routes/suggestion.routes.js              ★ MỚI
└── routes/index.js                          (sửa)

frontend/src/
├── services/comment.service.js              ★ MỚI
├── services/suggestion.service.js           ★ MỚI
├── components/bookings/
│   ├── CommentSection.jsx                   ★ MỚI
│   ├── CommentSection.css                   ★ MỚI
│   ├── CommentItem.jsx                      ★ MỚI
│   ├── CommentInput.jsx                     ★ MỚI
│   ├── SmartSuggestions.jsx                 ★ MỚI
│   ├── SmartSuggestions.css                 ★ MỚI
│   └── ConflictAlert.jsx                    (sửa — thêm suggestions)
├── pages/
│   └── BookingDetailPage.jsx                (sửa — thêm CommentSection)
│   └── BookingCreatePage.jsx                (sửa — thêm SmartSuggestions)
```

---

## Tiêu chí hoàn thành

### Comments
- [ ] API CRUD comment hoạt động
- [ ] Chỉ người liên quan booking mới comment được
- [ ] Sửa/xóa chỉ trong 5 phút đầu
- [ ] Comment section hiển thị trên booking detail
- [ ] Thêm comment → hiển thị ngay không cần refresh
- [ ] Avatar + tên + role badge + time ago

### Suggestions
- [ ] API alternative rooms trả phòng trống, ranked theo relevance
- [ ] API alternative slots trả giờ trống gần nhất
- [ ] API smart suggestions trả gợi ý dựa trên history
- [ ] Conflict alert hiển thị phòng + giờ thay thế
- [ ] Click "Chọn" → pre-fill form với suggestion
- [ ] Smart suggestions hiển thị trên booking create page
