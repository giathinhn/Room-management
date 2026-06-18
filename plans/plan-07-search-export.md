# Plan 07 — Search, Filter & Export Excel

> **Mục tiêu**: Nâng cấp chức năng tìm kiếm/lọc booking nâng cao + export danh sách booking ra file Excel.
> **Thời lượng ước tính**: 1–1.5 giờ
> **Phụ thuộc**: Plan 04 (booking system)
> **Độc lập với**: Plan 05, Plan 06, Plan 08

---

## Tổng quan

Sau khi hoàn thành:

- Tìm kiếm phòng trống nâng cao (theo thời gian + sức chứa + thiết bị)
- Filter booking đa tiêu chí
- Export danh sách booking đã lọc ra file .xlsx
- Chỉ Admin và Approver được export

---

## PHẦN 1: BACKEND

### 1. Nâng cấp Search — Tìm phòng trống nâng cao

API `GET /api/rooms/available` (đã có ở Plan 03) — bổ sung filter:

| Param           | Mô tả                                                               |
| --------------- | --------------------------------------------------------------------- |
| `startTime`   | ISO datetime (bắt buộc)                                             |
| `endTime`     | ISO datetime (bắt buộc)                                             |
| `minCapacity` | Sức chứa tối thiểu                                                |
| `equipment`   | Danh sách thiết bị cần có (comma-separated: "Máy chiếu,Micro") |
| `location`    | Vị trí (text search)                                                |

**Prisma query:**

```js
const rooms = await prisma.room.findMany({
  where: {
    isActive: true,
    capacity: { gte: minCapacity || 1 },
    location: location ? { contains: location, mode: 'insensitive' } : undefined,
    equipment: equipment?.length ? { hasEvery: equipment } : undefined,
    // Loại phòng có booking trùng:
    NOT: {
      bookings: {
        some: {
          status: { in: ['pending', 'approved'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        }
      }
    }
  },
  orderBy: { name: 'asc' },
});
```

### 2. Export Excel API

**Cài dependency:**

```bash
npm install exceljs
```

**`GET /api/export/bookings`**

| Param         | Mô tả                                          |
| ------------- | ------------------------------------------------ |
| `roomId`    | Filter theo phòng (optional)                    |
| `status`    | Filter theo trạng thái (optional)              |
| `startDate` | Từ ngày (optional)                             |
| `endDate`   | Đến ngày (optional)                           |
| `userId`    | Filter theo người đặt (optional, chỉ admin) |

**Response**: File `.xlsx` download trực tiếp.

**`src/services/export.service.js`**:

```js
async function exportBookingsToExcel(filters) {
  // 1. Lấy bookings theo filters (không phân trang, lấy tất cả)
  // 2. Tạo workbook với ExcelJS
  // 3. Format:

  // Sheet: "Danh sách đặt phòng"
  // Columns:
  //   A: STT
  //   B: Tiêu đề cuộc họp
  //   C: Phòng
  //   D: Người đặt
  //   E: Email
  //   F: Ngày
  //   G: Giờ bắt đầu
  //   H: Giờ kết thúc
  //   I: Thời lượng
  //   J: Trạng thái
  //   K: Người duyệt
  //   L: Ngày tạo

  // Styling:
  //   - Header row: bold, background màu xanh, text trắng
  //   - Auto-width columns
  //   - Status cells: color-coded (Approved=xanh, Rejected=đỏ...)
  //   - Border cho tất cả cells
  //   - Title row ở trên cùng: "BÁO CÁO LỊCH ĐẶT PHÒNG HỌP"
  //   - Subtitle: "Từ ngày ... đến ngày ..."
  //   - Footer: "Xuất lúc: dd/mm/yyyy HH:mm"

  // 4. Return buffer
}
```

**`src/controllers/export.controller.js`**:

```js
async function exportBookings(req, res) {
  const buffer = await exportService.exportBookingsToExcel(req.query);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=bookings_${Date.now()}.xlsx`);
  res.send(buffer);
}
```

**Route:**

```js
// src/routes/export.routes.js
router.get('/bookings', authenticate, authorize('admin', 'approver'), exportController.exportBookings);

// Mount: app.use('/api/export', exportRoutes);
```

---

## PHẦN 2: FRONTEND

### 3. Trang tìm phòng trống nâng cao

**`src/pages/RoomSearchPage.jsx`**

```
┌─────────────────────────────────────────────────┐
│ 🔍 Tìm phòng trống                              │
├─────────────────────────────────────────────────┤
│                                                  │
│  📅 Ngày: [2026-06-20]                           │
│  🕐 Từ: [09:00]   Đến: [10:30]                  │
│  👥 Sức chứa tối thiểu: [10]                     │
│  📍 Vị trí: [Tòa A                           ]  │
│  🔧 Thiết bị cần có:                             │
│     [✅ Máy chiếu] [✅ Micro] [☐ TV] [☐ Webcam]  │
│                                                  │
│                              [Tìm kiếm]         │
├─────────────────────────────────────────────────┤
│  Kết quả: 3 phòng trống                         │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Phòng A1 — Tầng 3, Tòa A — 10 người     │   │
│  │ 📽️ Máy chiếu  🎤 Micro  📋 Bảng trắng    │   │
│  │                           [Đặt phòng →]  │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ Phòng B2 — Tầng 5, Tòa B — 20 người     │   │
│  │ 📽️ Máy chiếu  🎤 Micro  🖥️ TV            │   │
│  │                           [Đặt phòng →]  │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

- Click "Đặt phòng →" → navigate tới BookingCreatePage với pre-filled room + time

### 4. Nút Export trên BookingsPage

Thêm nút Export vào trang danh sách booking (BookingsPage từ Plan 04):

```
┌─────────────────────────────────────────────────┐
│ 📋 Lịch đặt phòng      [📥 Export Excel] [➕ Đặt mới] │
│                          ↑ Chỉ hiện cho Admin/Approver │
```

**Logic frontend:**

```js
async function handleExport() {
  // 1. Lấy current filters từ state
  // 2. Gọi API: GET /api/export/bookings?...filters
  //    Quan trọng: responseType = 'blob'
  // 3. Tạo download link:
  //    const url = window.URL.createObjectURL(blob);
  //    const a = document.createElement('a');
  //    a.href = url;
  //    a.download = `bookings_${Date.now()}.xlsx`;
  //    a.click();
  // 4. Toast: "Đã tải xuống file Excel"
}
```

### 5. Components

#### `src/components/search/RoomSearchForm.jsx`

- Date + time pickers
- Capacity number input
- Location text input
- Equipment checkbox group
- Submit button

#### `src/components/search/AvailableRoomCard.jsx`

- Compact room card cho kết quả tìm kiếm
- Hiển thị: name, location, capacity, equipment
- Nút "Đặt phòng" với pre-filled params

---

## Cấu trúc file tạo mới

```
backend/src/
├── services/export.service.js          ★ MỚI
├── controllers/export.controller.js    ★ MỚI
├── routes/export.routes.js             ★ MỚI
├── repositories/room.repository.js     (sửa — nâng cấp findAvailable)
└── routes/index.js                     (sửa — mount export routes)

frontend/src/
├── services/export.service.js          ★ MỚI
├── pages/
│   ├── RoomSearchPage.jsx              ★ MỚI
│   ├── RoomSearchPage.css              ★ MỚI
│   ├── BookingsPage.jsx                (sửa — thêm nút Export)
│   └── BookingsPage.css                (sửa)
├── components/search/
│   ├── RoomSearchForm.jsx              ★ MỚI
│   ├── RoomSearchForm.css              ★ MỚI
│   └── AvailableRoomCard.jsx           ★ MỚI
└── App.jsx                             (sửa — thêm /rooms/search route)
```

---

## Tiêu chí hoàn thành

- [X] API tìm phòng trống: filter capacity + equipment + location hoạt động
- [X] API export trả file .xlsx đúng format
- [X] File Excel có header styled, auto-width, color-coded status
- [X] File Excel có title + subtitle + footer với timestamp
- [X] Frontend trang tìm phòng trống hoạt động
- [X] Click "Đặt phòng" → pre-fill form đặt phòng
- [X] Nút Export trên BookingsPage chỉ hiện cho Admin/Approver
- [X] Download file Excel thành công qua browser
- [X] Export theo bộ lọc hiện tại (không phải tất cả)
