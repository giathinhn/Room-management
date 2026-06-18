# Plan 05 — Recurring Booking (Đặt phòng định kỳ)

> **Mục tiêu**: Thêm chức năng đặt phòng lặp lại theo ngày/tuần/tháng — backend logic sinh slots + frontend form chọn tần suất.
> **Thời lượng ước tính**: 1.5–2 giờ
> **Phụ thuộc**: Plan 04 (booking system)
> **Độc lập với**: Plan 06 (calendar), Plan 07 (search/export), Plan 08 (notifications)

---

## Tổng quan

Sau khi hoàn thành:

- User chọn tần suất (daily/weekly/monthly) + ngày kết thúc → hệ thống sinh ra N bookings
- Mỗi booking được kiểm tra trùng lịch riêng
- Nếu có slots trùng → hiển thị danh sách, cho phép đặt slots OK
- Hủy chuỗi: hủy từng booking đơn lẻ hoặc hủy toàn bộ

---

## PHẦN 1: BACKEND

### 1. Slot Generation Logic (Core)

**`src/utils/recurring.js`** — Hàm sinh danh sách slots:

```js
/**
 * generateSlots(startDate, endDate, startTime, endTime, frequency)
 *
 * Input:
 *   startDate: '2026-06-20'
 *   endDate: '2026-07-20'
 *   startTime: '09:00'
 *   endTime: '10:30'
 *   frequency: 'weekly'
 *
 * Output: [
 *   { startTime: '2026-06-20T09:00:00', endTime: '2026-06-20T10:30:00' },
 *   { startTime: '2026-06-27T09:00:00', endTime: '2026-06-27T10:30:00' },
 *   { startTime: '2026-07-04T09:00:00', endTime: '2026-07-04T10:30:00' },
 *   { startTime: '2026-07-11T09:00:00', endTime: '2026-07-11T10:30:00' },
 *   { startTime: '2026-07-18T09:00:00', endTime: '2026-07-18T10:30:00' },
 * ]
 */

// Logic:
// - daily: cộng thêm 1 ngày
// - weekly: cộng thêm 7 ngày
// - monthly: cộng thêm 1 tháng (cùng ngày, xử lý edge case 31/30/28)
// - Giới hạn tối đa: 52 slots (1 năm weekly)
// - Bỏ qua slot trong quá khứ
```

### 2. Validation

**`src/validators/recurring.validator.js`**:

| Schema                    | Fields                                                           | Rules                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `createRecurringSchema` | roomId, title, startDate, endDate, startTime, endTime, frequency | frequency: daily/weekly/monthly, endDate > startDate, endDate ≤ startDate + 6 tháng, startTime/endTime: HH:mm format, startTime < endTime |

### 3. Repository Layer

**`src/repositories/recurring.repository.js`**:

| Method                   | Mô tả                              |
| ------------------------ | ------------------------------------ |
| `create(data)`         | Tạo recurring_booking record        |
| `findById(id)`         | Lấy recurring_booking kèm bookings |
| `findByUserId(userId)` | Danh sách recurring của user       |
| `delete(id)`           | Xóa recurring_booking record        |

Dùng lại `booking.repository.js`:

| Method                               | Mô tả                                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| `createMany(bookings[])`           | Tạo nhiều bookings cùng lúc (prisma.booking.createMany)    |
| `cancelByRecurringId(recurringId)` | Hủy tất cả bookings thuộc 1 chuỗi (chỉ pending/approved) |

### 4. Service Layer

**`src/services/recurring.service.js`**:

| Method                                    | Logic                                                                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create(userId, data)`                  | Validate → Kiểm tra room →**Sinh slots** → **Kiểm tra trùng từng slot** → Phân loại: OK slots vs Conflict slots → Return { okSlots, conflictSlots } |
| `confirm(userId, data, confirmedSlots)` | Tạo recurring_booking record → Tạo bookings cho confirmed slots (status=pending) → Return { recurring, bookings }                                                      |
| `cancelAll(recurringId, userId)`        | Kiểm tra ownership → Hủy tất cả booking pending/approved thuộc chuỗi                                                                                                |
| `getByUser(userId)`                     | Danh sách chuỗi recurring của user, kèm thống kê (bao nhiêu đã duyệt, pending, cancelled)                                                                        |

**Luồng 2 bước:**

```
Bước 1 (preview):
  POST /api/bookings/recurring/preview
  → Sinh slots + check conflicts
  → Return { okSlots: [...], conflictSlots: [...] }

Bước 2 (confirm):
  POST /api/bookings/recurring
  → Tạo recurring_booking + bookings cho OK slots
  → Return { recurring, createdBookings }
```

### 5. Controller & Routes

**Thêm vào `src/controllers/booking.controller.js`** (hoặc tạo file mới):

| Method               | Request                                                                                     | Response                                        |
| -------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `previewRecurring` | Body: { roomId, title, startDate, endDate, startTime, endTime, frequency }                  | 200: { okSlots: Slot[], conflictSlots: Slot[] } |
| `createRecurring`  | Body: { roomId, title, startDate, endDate, startTime, endTime, frequency, confirmedSlots? } | 201: { recurring, bookings: Booking[] }         |
| `cancelRecurring`  | Params: recurringId                                                                         | 200: { message, cancelledCount }                |

**Routes:**

```js
// Thêm vào booking.routes.js
router.post('/recurring/preview', authenticate, bookingController.previewRecurring);
router.post('/recurring',         authenticate, bookingController.createRecurring);
router.delete('/recurring/:id',   authenticate, bookingController.cancelRecurring);
```

---

## PHẦN 2: FRONTEND

### 6. Mở rộng BookingCreatePage

Thêm toggle **"Đặt định kỳ"** vào form đặt phòng hiện có:

```
┌─────────────────────────────────────────────────┐
│ ➕ Đặt phòng họp                                │
├─────────────────────────────────────────────────┤
│                                                  │
│  [○ Đặt 1 lần] [● Đặt định kỳ]  ← Toggle       │
│                                                  │
│  Ngày bắt đầu: [2026-06-20]                     │
│  Ngày kết thúc: [2026-07-20]                     │
│  Giờ: [09:00] → [10:30]                          │
│  Tần suất: [○ Hàng ngày] [● Hàng tuần] [○ Hàng tháng] │
│                                                  │
│                              [Xem trước slots]   │
├─────────────────────────────────────────────────┤
│  📋 Kết quả: 5 slots                             │
│                                                  │
│  ✅ 20/06 (Thứ 6) 09:00-10:30  — Phòng trống    │
│  ✅ 27/06 (Thứ 6) 09:00-10:30  — Phòng trống    │
│  ❌ 04/07 (Thứ 6) 09:00-10:30  — Trùng: "Họp BOM" │
│  ✅ 11/07 (Thứ 6) 09:00-10:30  — Phòng trống    │
│  ✅ 18/07 (Thứ 6) 09:00-10:30  — Phòng trống    │
│                                                  │
│  4/5 slots có thể đặt                           │
│                                                  │
│               [Đặt 4 slots khả dụng]             │
└─────────────────────────────────────────────────┘
```

### 7. Components mới

#### `src/components/bookings/RecurringForm.jsx`

- Frequency selector: 3 radio buttons (daily/weekly/monthly)
- Date range: startDate + endDate
- Nút "Xem trước slots" → gọi API preview

#### `src/components/bookings/SlotPreview.jsx`

- Hiển thị danh sách slots từ API preview
- Mỗi slot: ngày + thứ + giờ + trạng thái (OK / Conflict)
- Slot OK: màu xanh, checkbox checked
- Slot Conflict: màu đỏ, hiển thị tên booking đang chiếm
- Tổng kết: "X/Y slots có thể đặt"

#### `src/components/bookings/RecurringBadge.jsx`

- Badge nhỏ hiển thị trên BookingCard nếu booking thuộc chuỗi
- Icon 🔄 + "Hàng tuần" / "Hàng ngày" / "Hàng tháng"
- Click → xem toàn bộ chuỗi

---

## Cấu trúc file tạo mới

```
backend/src/
├── utils/recurring.js                    ★ MỚI
├── validators/recurring.validator.js     ★ MỚI
├── repositories/recurring.repository.js  ★ MỚI
├── services/recurring.service.js         ★ MỚI
├── controllers/booking.controller.js     (sửa — thêm methods)
└── routes/booking.routes.js              (sửa — thêm routes)

frontend/src/
├── pages/
│   ├── BookingCreatePage.jsx             (sửa — thêm recurring toggle)
│   └── BookingCreatePage.css             (sửa)
└── components/bookings/
    ├── RecurringForm.jsx                 ★ MỚI
    ├── RecurringForm.css                 ★ MỚI
    ├── SlotPreview.jsx                   ★ MỚI
    ├── SlotPreview.css                   ★ MỚI
    └── RecurringBadge.jsx                ★ MỚI
```

---

## Tiêu chí hoàn thành

- [X] Hàm generateSlots sinh đúng slots cho daily/weekly/monthly
- [X] API preview trả đúng okSlots + conflictSlots
- [X] API create tạo recurring_booking + N bookings
- [X] Kiểm tra trùng lịch từng slot độc lập
- [X] API cancel hủy toàn bộ chuỗi (chỉ pending/approved)
- [X] Frontend toggle đặt định kỳ hoạt động
- [X] Slot preview hiển thị rõ OK/Conflict
- [X] User có thể đặt chỉ các slots OK
- [X] RecurringBadge hiển thị trên BookingCard
- [X] Edge case: tháng 31 → xử lý đúng cho monthly
