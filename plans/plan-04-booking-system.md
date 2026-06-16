# Plan 04 — Booking System (Backend + Frontend)

> **Mục tiêu**: Xây dựng chức năng đặt phòng hoàn chỉnh — tạo booking, kiểm tra trùng lịch, duyệt/từ chối, hủy lịch, xem danh sách booking.
> **Thời lượng ước tính**: 3–4 giờ
> **Phụ thuộc**: Plan 00 (database), Plan 01 (auth), Plan 02 (layout), Plan 03 (rooms)

---

## Tổng quan

Đây là **plan cốt lõi** của hệ thống. Sau khi hoàn thành:
- User đặt phòng với kiểm tra trùng lịch tự động
- Approver/Admin duyệt hoặc từ chối booking
- User/Admin hủy booking
- Danh sách booking với filter, phân trang
- Chi tiết booking với thông tin đầy đủ

> ⚠️ **Lưu ý**: Plan này KHÔNG bao gồm Recurring Booking (Plan 05) và Calendar View (Plan 06).

---

## PHẦN 1: BACKEND

### 1. Repository Layer

**`src/repositories/booking.repository.js`**:

| Method | Mô tả |
|--------|--------|
| `findAll(filters)` | Danh sách bookings — filter: roomId, userId, status, startDate, endDate, page, limit. Include: room, user info |
| `findById(id)` | Chi tiết booking — include room, user, approver info |
| `create(data)` | Tạo booking mới |
| `updateStatus(id, status, extra?)` | Cập nhật status + approvedBy/approvedAt/rejectionReason |
| `findOverlapping(roomId, startTime, endTime, excludeId?)` | Tìm booking trùng lịch — **quan trọng nhất** |
| `countByFilters(filters)` | Đếm tổng số bookings cho phân trang |

**Query kiểm tra trùng lịch (CRITICAL):**
```js
// Hai khoảng thời gian overlap khi:
// existing.startTime < newEndTime AND existing.endTime > newStartTime
//
// Chỉ tính booking có status 'pending' hoặc 'approved'
// Loại trừ booking đang edit (excludeId)
const overlapping = await prisma.booking.findMany({
  where: {
    roomId: roomId,
    status: { in: ['pending', 'approved'] },
    id: { not: excludeId },  // nếu có
    startTime: { lt: endTime },
    endTime: { gt: startTime },
  },
  include: { user: { select: { fullName: true, email: true } } },
});
```

### 2. Validation

**`src/validators/booking.validator.js`**:

| Schema | Fields | Rules |
|--------|--------|-------|
| `createBookingSchema` | roomId, title, startTime, endTime | roomId: UUID, title: 1–200 ký tự, startTime/endTime: ISO datetime |
| `rejectBookingSchema` | rejectionReason | rejectionReason: 1–500 ký tự |
| `queryBookingSchema` | roomId?, userId?, status?, startDate?, endDate?, page?, limit? | status phải là enum hợp lệ |

**Custom validation trong service (không dùng Zod):**
```js
// 1. startTime < endTime
// 2. startTime không trong quá khứ (cho phép sai lệch 5 phút)
// 3. Thời lượng tối thiểu: 30 phút
// 4. Thời lượng tối đa: 8 giờ
// 5. Trong giờ hành chính: 07:00 – 22:00
// 6. Đặt trước tối đa: 30 ngày kể từ hôm nay
```

### 3. Service Layer

**`src/services/booking.service.js`**:

| Method | Logic |
|--------|-------|
| `create(userId, data)` | Validate input → Kiểm tra room tồn tại + active → Validate business rules (giờ, thời lượng) → **Kiểm tra trùng lịch** → Nếu trùng: throw 409 kèm danh sách conflicts → Nếu OK: tạo booking (status=pending) |
| `getAll(filters, requestingUser)` | User thường: chỉ thấy booking của mình. Approver: thấy tất cả. Admin: thấy tất cả. → Trả danh sách + pagination |
| `getById(id, requestingUser)` | Tìm booking → Kiểm tra quyền xem (chủ booking, approver, admin) → Trả chi tiết |
| `approve(id, approverId)` | Tìm booking → Kiểm tra status = pending → Kiểm tra approver có quyền → Cập nhật status=approved, approvedBy, approvedAt |
| `reject(id, approverId, reason)` | Tương tự approve → Cập nhật status=rejected, rejectionReason |
| `cancel(id, requestingUser)` | Tìm booking → Kiểm tra status = pending/approved → Kiểm tra quyền (chủ booking hoặc admin) → Cập nhật status=cancelled |

**Error cases:**
| Case | HTTP | Message |
|------|------|---------|
| Room không tồn tại | 404 | "Room not found" |
| Room bị inactive | 400 | "Room is not available" |
| Trùng lịch | 409 | "Time slot conflicts with existing bookings" + danh sách conflicts |
| Thời gian quá khứ | 400 | "Cannot book in the past" |
| Ngoài giờ hành chính | 400 | "Booking must be between 07:00 and 22:00" |
| Thời lượng < 30 phút | 400 | "Minimum duration is 30 minutes" |
| Thời lượng > 8 giờ | 400 | "Maximum duration is 8 hours" |
| Quá 30 ngày | 400 | "Cannot book more than 30 days in advance" |
| Booking không tồn tại | 404 | "Booking not found" |
| Không có quyền duyệt | 403 | "Insufficient permissions" |
| Status không hợp lệ để duyệt | 400 | "Can only approve pending bookings" |
| Không có quyền hủy | 403 | "You can only cancel your own bookings" |
| Status không hợp lệ để hủy | 400 | "Can only cancel pending or approved bookings" |

### 4. Controller Layer

**`src/controllers/booking.controller.js`**:

| Method | Request | Response |
|--------|---------|----------|
| `create` | Body: { roomId, title, startTime, endTime } | 201: { data: Booking } hoặc 409: { conflicts: Booking[] } |
| `getAll` | Query: roomId?, userId?, status?, startDate?, endDate?, page?, limit? | 200: { data: Booking[], pagination } |
| `getById` | Params: id | 200: { data: Booking } |
| `approve` | Params: id | 200: { data: Booking } |
| `reject` | Params: id, Body: { rejectionReason } | 200: { data: Booking } |
| `cancel` | Params: id | 200: { data: Booking } |

### 5. Routes

**`src/routes/booking.routes.js`**:

```js
router.get('/',             authenticate, bookingController.getAll);
router.get('/:id',          authenticate, bookingController.getById);
router.post('/',            authenticate, bookingController.create);
router.patch('/:id/approve', authenticate, authorize('admin', 'approver'), bookingController.approve);
router.patch('/:id/reject',  authenticate, authorize('admin', 'approver'), bookingController.reject);
router.patch('/:id/cancel',  authenticate, bookingController.cancel);
```

---

## PHẦN 2: FRONTEND

### 6. Service

**`src/services/booking.service.js`**:

| Method | API Call |
|--------|----------|
| `getBookings(params)` | GET /api/bookings |
| `getBooking(id)` | GET /api/bookings/:id |
| `createBooking(data)` | POST /api/bookings |
| `approveBooking(id)` | PATCH /api/bookings/:id/approve |
| `rejectBooking(id, reason)` | PATCH /api/bookings/:id/reject |
| `cancelBooking(id)` | PATCH /api/bookings/:id/cancel |

### 7. Pages

#### `src/pages/BookingCreatePage.jsx` — Tạo booking mới

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ ➕ Đặt phòng họp                                │
├─────────────────────────────────────────────────┤
│                                                  │
│  Bước 1: Chọn thời gian                         │
│  ┌─────────────────┐ ┌─────────────────┐        │
│  │ 📅 Ngày         │ │ 🕐 Giờ bắt đầu  │        │
│  │ [2026-06-20   ] │ │ [09:00       ▾] │        │
│  └─────────────────┘ └─────────────────┘        │
│  ┌─────────────────┐ ┌─────────────────┐        │
│  │ 🕐 Giờ kết thúc │ │ ⏱️ Thời lượng    │        │
│  │ [10:30       ▾] │ │ 1 giờ 30 phút   │        │
│  └─────────────────┘ └─────────────────┘        │
│                                                  │
│  Bước 2: Chọn phòng trống          [Tìm phòng] │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ ✅ Phòng A1│ │ Phòng B2 │ │ Phòng C3 │        │
│  │ 10 người  │ │ 20 người │ │ 30 người │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                  │
│  Bước 3: Thông tin cuộc họp                     │
│  [Tiêu đề / Mục đích cuộc họp                ] │
│                                                  │
│                              [Đặt phòng]        │
└─────────────────────────────────────────────────┘
```

**Flow:**
1. User chọn ngày + giờ bắt đầu + giờ kết thúc
2. Hệ thống tự động gọi API tìm phòng trống
3. User chọn phòng từ danh sách phòng trống
4. User nhập tiêu đề cuộc họp
5. Submit → Nếu OK: toast success + redirect `/bookings`
6. Submit → Nếu trùng: hiển thị conflict details

#### `src/pages/BookingsPage.jsx` — Danh sách booking

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 📋 Lịch đặt phòng                  [➕ Đặt mới] │
├─────────────────────────────────────────────────┤
│ [Phòng ▾] [Trạng thái ▾] [Từ ngày] [Đến ngày]  │
├─────────────────────────────────────────────────┤
│ ┌─ Pending ──────────────────────────────────┐  │
│ │ 🟡 Họp sprint planning                      │  │
│ │ Phòng A1 │ 20/06 09:00-10:30 │ Nguyễn Văn A│  │
│ │                         [Duyệt] [Từ chối]  │  │
│ └────────────────────────────────────────────┘  │
│ ┌─ Approved ─────────────────────────────────┐  │
│ │ 🟢 Họp team weekly                          │  │
│ │ Phòng B2 │ 21/06 14:00-15:00 │ Trần Thị B  │  │
│ │                                    [Hủy]   │  │
│ └────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│ ◀ 1 2 3 ▶                                       │
└─────────────────────────────────────────────────┘
```

**Features:**
- Filter: phòng, trạng thái, khoảng thời gian
- Color-coded status badges: 🟡 Pending, 🟢 Approved, 🔴 Rejected, ⚪ Cancelled
- Approver thấy nút Duyệt/Từ chối cho booking pending
- Chủ booking/Admin thấy nút Hủy cho pending/approved
- Phân trang

#### `src/pages/BookingDetailPage.jsx` — Chi tiết booking

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ ← Quay lại                                      │
├─────────────────────────────────────────────────┤
│                                                  │
│ 🟡 PENDING                                      │
│ Họp sprint planning                             │
│                                                  │
│ 📍 Phòng: A1 – Tầng 3, Tòa A                    │
│ 👤 Người đặt: Nguyễn Văn A                      │
│ 📅 Ngày: 20/06/2026                              │
│ 🕐 Thời gian: 09:00 – 10:30 (1h30m)             │
│ 📝 Tạo lúc: 17/06/2026 14:30                     │
│                                                  │
│ ───────────────────────────────────────          │
│ (Nếu rejected):                                  │
│ ❌ Lý do từ chối: Phòng đang bảo trì            │
│ 👤 Người duyệt: Admin                            │
│ 📅 Duyệt lúc: 18/06/2026 08:00                   │
│                                                  │
│            [Duyệt] [Từ chối] [Hủy]              │
└─────────────────────────────────────────────────┘
```

### 8. Components

#### `src/components/bookings/BookingCard.jsx`
- Props: booking, onApprove, onReject, onCancel, currentUser
- Status badge với màu tương ứng
- Hiển thị: title, room name, date/time, user name
- Action buttons dựa trên role + booking ownership

#### `src/components/bookings/BookingForm.jsx`
- Step-by-step form (chọn thời gian → chọn phòng → nhập info)
- Date picker + time picker
- Auto-calculate duration
- Available rooms grid (tự load khi chọn xong thời gian)
- Validation inline

#### `src/components/bookings/BookingFilter.jsx`
- Dropdowns: phòng, trạng thái
- Date range picker: từ ngày – đến ngày
- Reset filters button

#### `src/components/bookings/RejectModal.jsx`
- Modal nhập lý do từ chối
- Textarea + nút xác nhận
- Required validation

#### `src/components/bookings/ConflictAlert.jsx`
- Hiển thị khi đặt phòng bị trùng
- Danh sách booking đang chiếm slot
- Gợi ý: "Hãy chọn thời gian khác hoặc phòng khác"

#### `src/components/common/StatusBadge.jsx`
- Props: status
- Mapping: pending→vàng, approved→xanh, rejected→đỏ, cancelled→xám
- Label tiếng Việt: Chờ duyệt, Đã duyệt, Từ chối, Đã hủy

#### `src/components/common/DateTimePicker.jsx`
- Date input + Time select (dropdown 30-phút intervals: 07:00, 07:30, ... 21:30)
- Chỉ cho chọn ngày từ hôm nay đến +30 ngày
- Chỉ cho chọn giờ từ 07:00–22:00

---

## Routes cần thêm vào App.jsx

```jsx
<Route path="/bookings" element={<BookingsPage />} />
<Route path="/bookings/new" element={<BookingCreatePage />} />
<Route path="/bookings/:id" element={<BookingDetailPage />} />
```

---

## Cấu trúc file tạo mới

```
backend/src/
├── repositories/booking.repository.js  ★ MỚI
├── validators/booking.validator.js     ★ MỚI
├── services/booking.service.js         ★ MỚI
├── controllers/booking.controller.js   ★ MỚI
├── routes/booking.routes.js            ★ MỚI
└── routes/index.js                     (sửa)

frontend/src/
├── services/booking.service.js         ★ MỚI
├── pages/
│   ├── BookingCreatePage.jsx           ★ MỚI
│   ├── BookingCreatePage.css           ★ MỚI
│   ├── BookingsPage.jsx                ★ MỚI
│   ├── BookingsPage.css                ★ MỚI
│   ├── BookingDetailPage.jsx           ★ MỚI
│   └── BookingDetailPage.css           ★ MỚI
├── components/
│   ├── bookings/
│   │   ├── BookingCard.jsx             ★ MỚI
│   │   ├── BookingCard.css             ★ MỚI
│   │   ├── BookingForm.jsx             ★ MỚI
│   │   ├── BookingForm.css             ★ MỚI
│   │   ├── BookingFilter.jsx           ★ MỚI
│   │   ├── RejectModal.jsx             ★ MỚI
│   │   ├── ConflictAlert.jsx           ★ MỚI
│   │   └── ConflictAlert.css           ★ MỚI
│   └── common/
│       ├── StatusBadge.jsx             ★ MỚI
│       └── DateTimePicker.jsx          ★ MỚI
└── App.jsx                             (sửa — thêm routes)
```

---

## Tiêu chí hoàn thành

### Backend
- [ ] POST /api/bookings tạo booking thành công, status = pending
- [ ] Kiểm tra trùng lịch: trả 409 kèm danh sách conflicts
- [ ] Validation: quá khứ, giờ hành chính, thời lượng min/max, đặt trước 30 ngày
- [ ] PATCH /approve: chỉ approver/admin, chỉ booking pending
- [ ] PATCH /reject: kèm rejectionReason
- [ ] PATCH /cancel: chủ booking hoặc admin, chỉ pending/approved
- [ ] GET /api/bookings: filter + phân trang hoạt động
- [ ] User thường chỉ thấy booking của mình

### Frontend
- [ ] Form đặt phòng: chọn thời gian → load phòng trống → chọn phòng → submit
- [ ] Hiển thị lỗi validation inline rõ ràng
- [ ] Hiển thị conflict alert khi trùng lịch
- [ ] Danh sách booking: filter + phân trang + status badges
- [ ] Nút Duyệt/Từ chối/Hủy hiển thị đúng theo role và status
- [ ] Modal nhập lý do từ chối
- [ ] Chi tiết booking hiển thị đầy đủ info
- [ ] Toast notifications cho mọi action
