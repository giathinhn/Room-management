# Plan 03 — Room Management (CRUD Backend + Frontend)

> **Mục tiêu**: Xây dựng chức năng quản lý phòng họp hoàn chỉnh — CRUD API backend + giao diện quản lý phòng trên frontend.
> **Thời lượng ước tính**: 2–3 giờ
> **Phụ thuộc**: Plan 00 (database), Plan 01 (auth middleware), Plan 02 (layout + auth context)

---

## Tổng quan

Sau khi hoàn thành plan này:

- Admin có thể thêm/sửa/xóa (soft-delete) phòng họp
- Tất cả user có thể xem danh sách phòng + chi tiết phòng
- Giao diện hiển thị phòng dạng card grid, có filter và search
- API tìm phòng trống theo thời gian (dùng cho plan đặt phòng sau)

---

## PHẦN 1: BACKEND

### 1. Repository Layer

**`src/repositories/room.repository.js`**:

| Method                                          | Mô tả                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `findAll(filters)`                            | Danh sách phòng (phân trang, filter theo capacity, location, equipment, isActive)               |
| `findById(id)`                                | Chi tiết phòng                                                                                   |
| `create(data)`                                | Tạo phòng mới                                                                                   |
| `update(id, data)`                            | Cập nhật phòng                                                                                  |
| `softDelete(id)`                              | Set `isActive = false`                                                                           |
| `findAvailable(startTime, endTime, filters?)` | Tìm phòng trống trong khoảng thời gian — LEFT JOIN bookings, loại phòng có booking trùng |

**Query tìm phòng trống (quan trọng):**

```sql
-- Phòng trống = phòng KHÔNG CÓ booking nào overlap với [startTime, endTime]
-- Booking overlap khi: booking.start < endTime AND booking.end > startTime
-- Chỉ tính booking có status = 'pending' hoặc 'approved'
SELECT rooms.* FROM rooms
WHERE rooms.is_active = true
AND rooms.id NOT IN (
  SELECT room_id FROM bookings
  WHERE status IN ('pending', 'approved')
  AND start_time < :endTime
  AND end_time > :startTime
)
```

### 2. Validation

**`src/validators/room.validator.js`**:

| Schema                  | Fields                                                   | Rules                                                                             |
| ----------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `createRoomSchema`    | name, capacity, location, equipment                      | name: 1–100 ký tự, capacity: 1–500, location: 1–200, equipment: mảng string |
| `updateRoomSchema`    | name?, capacity?, location?, equipment?                  | Tất cả optional, rules giống create                                            |
| `queryRoomSchema`     | page?, limit?, capacity?, location?, equipment?, search? | page ≥ 1, limit 1–100, capacity ≥ 1                                            |
| `availableRoomSchema` | startTime, endTime, capacity?, equipment?                | startTime < endTime, cả hai phải là ISO datetime                               |

### 3. Service Layer

**`src/services/room.service.js`**:

| Method                                         | Logic                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `getAll(filters)`                            | Validate query → Lấy danh sách rooms (chỉ isActive=true cho non-admin) → Trả kèm totalCount cho phân trang |
| `getById(id)`                                | Tìm room → Nếu không tồn tại → 404                                                                          |
| `create(data)`                               | Validate → Kiểm tra tên phòng trùng → Tạo room                                                              |
| `update(id, data)`                           | Validate → Tìm room → Kiểm tra tên trùng (nếu đổi tên) → Cập nhật                                     |
| `delete(id)`                                 | Tìm room → Soft-delete (isActive = false)                                                                        |
| `findAvailable(startTime, endTime, filters)` | Validate thời gian → Query phòng trống → Filter thêm theo capacity, equipment                                |

### 4. Controller Layer

**`src/controllers/room.controller.js`**:

| Method                      | Request                                                       | Response                                                              |
| --------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| `getAll(req, res)`        | Query: page, limit, capacity, location, equipment, search     | 200: { data: Room[], pagination: { total, page, limit, totalPages } } |
| `getById(req, res)`       | Params: id                                                    | 200: { data: Room }                                                   |
| `create(req, res)`        | Body: { name, capacity, location, equipment }                 | 201: { data: Room }                                                   |
| `update(req, res)`        | Params: id, Body: { name?, capacity?, location?, equipment? } | 200: { data: Room }                                                   |
| `delete(req, res)`        | Params: id                                                    | 200: { message: "Room deactivated" }                                  |
| `findAvailable(req, res)` | Query: startTime, endTime, capacity?, equipment?              | 200: { data: Room[] }                                                 |

### 5. Routes

**`src/routes/room.routes.js`**:

```js
router.get('/',          authenticate, roomController.getAll);
router.get('/available', authenticate, roomController.findAvailable);
router.get('/:id',       authenticate, roomController.getById);
router.post('/',         authenticate, authorize('admin'), roomController.create);
router.put('/:id',       authenticate, authorize('admin'), roomController.update);
router.delete('/:id',    authenticate, authorize('admin'), roomController.delete);
```

> ⚠️ **Lưu ý**: Route `/available` phải đặt TRƯỚC `/:id` để tránh bị parse "available" thành UUID.

---

## PHẦN 2: FRONTEND

### 6. Service

**`src/services/room.service.js`**:

| Method                        | API Call                                      |
| ----------------------------- | --------------------------------------------- |
| `getRooms(params)`          | GET /api/rooms?page=&limit=&capacity=&search= |
| `getRoom(id)`               | GET /api/rooms/:id                            |
| `createRoom(data)`          | POST /api/rooms                               |
| `updateRoom(id, data)`      | PUT /api/rooms/:id                            |
| `deleteRoom(id)`            | DELETE /api/rooms/:id                         |
| `getAvailableRooms(params)` | GET /api/rooms/available?startTime=&endTime=  |

### 7. Pages

#### `src/pages/RoomsPage.jsx` — Danh sách phòng

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ 🏢 Phòng họp                      [+ Thêm phòng] │  ← Nút chỉ hiện cho Admin
├─────────────────────────────────────────────────┤
│ [🔍 Tìm kiếm...] [Sức chứa ▾] [Thiết bị ▾]     │  ← Filter bar
├─────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ Phòng A1 │ │ Phòng B2 │ │ Phòng C3 │          │  ← Card grid
│ │ 10 người │ │ 20 người │ │ 30 người │          │
│ │ Tầng 3   │ │ Tầng 5   │ │ Tầng 1   │          │
│ │ 📽️🎤🖥️   │ │ 📽️🎤     │ │ 📽️🖥️     │          │  ← Equipment icons
│ │[Xem] [Sửa]│ │[Xem] [Sửa]│ │[Xem] [Sửa]│        │
│ └──────────┘ └──────────┘ └──────────┘          │
├─────────────────────────────────────────────────┤
│ ◀ 1 2 3 ▶                                       │  ← Pagination
└─────────────────────────────────────────────────┘
```

**Features:**

- Card grid responsive (3 cols desktop, 2 cols tablet)
- Mỗi card hiển thị: tên, sức chứa, vị trí, equipment badges
- Filter: search text, capacity range, equipment checkboxes
- Admin thấy nút "Thêm phòng", "Sửa", "Xóa" trên mỗi card
- User thường chỉ thấy nút "Xem chi tiết"
- Phân trang (10 phòng/trang)

#### `src/pages/RoomDetailPage.jsx` — Chi tiết phòng

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ ← Quay lại               [Sửa] [Xóa]           │
├─────────────────────────────────────────────────┤
│                                                  │
│  Phòng họp A1                                    │
│  📍 Tầng 3, Tòa A    👥 Sức chứa: 10 người      │
│                                                  │
│  Thiết bị:                                       │
│  [📽️ Máy chiếu] [🎤 Micro] [🖥️ TV] [📋 Bảng]    │
│                                                  │
│  ─────────────────────────────────────────       │
│  Lịch sử dụng hôm nay:                          │  ← Mini timeline
│  08:00-09:30 ██████████░░░░░░░░░░ Họp team       │
│  14:00-15:00 ░░░░░░░░░░██████░░░░ Sprint review  │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 8. Components

#### `src/components/rooms/RoomCard.jsx`

- Props: room, onEdit, onDelete, isAdmin
- Hiển thị: tên, capacity badge, location, equipment icons
- Hover effect: subtle lift + shadow
- Badges cho equipment: icon + label

#### `src/components/rooms/RoomForm.jsx` (Modal)

- Dùng cho cả Create và Edit (prop: `room?` để prefill)
- Fields: tên phòng, sức chứa (number input), vị trí (text), thiết bị (checkbox group)
- Thiết bị options: Máy chiếu, Micro, Bảng trắng, TV, Webcam, Loa, Điều hòa
- Validation inline
- Hiển thị dạng modal overlay

#### `src/components/rooms/RoomFilter.jsx`

- Search input (debounce 300ms)
- Capacity dropdown: Tất cả / 1-5 / 6-10 / 11-20 / 20+
- Equipment multi-select checkboxes

#### `src/components/common/Modal.jsx`

- Reusable modal component
- Props: isOpen, onClose, title, children
- Animation: fade-in + scale
- Click outside hoặc ESC để đóng
- Backdrop blur

#### `src/components/common/Pagination.jsx`

- Props: currentPage, totalPages, onPageChange
- Hiển thị: ◀ 1 ... 4 [5] 6 ... 20 ▶
- Disable ◀ ở trang 1, ▶ ở trang cuối

#### `src/components/common/Badge.jsx`

- Props: text, variant (info, success, warning, error)
- Nhỏ gọn, rounded, background nhạt

#### `src/components/common/ConfirmDialog.jsx`

- Props: isOpen, onConfirm, onCancel, title, message
- Dùng khi xóa phòng: "Bạn có chắc muốn xóa phòng X?"

### 9. Equipment Icon Mapping

```js
const EQUIPMENT_ICONS = {
  'Máy chiếu': '📽️',
  'Micro': '🎤',
  'Bảng trắng': '📋',
  'TV': '🖥️',
  'Webcam': '📷',
  'Loa': '🔊',
  'Điều hòa': '❄️',
};
```

---

## Cấu trúc file tạo mới

```
backend/src/
├── repositories/room.repository.js    ★ MỚI
├── validators/room.validator.js       ★ MỚI
├── services/room.service.js           ★ MỚI
├── controllers/room.controller.js     ★ MỚI
├── routes/room.routes.js              ★ MỚI
└── routes/index.js                    (sửa — mount room routes)

frontend/src/
├── services/room.service.js           ★ MỚI
├── pages/
│   ├── RoomsPage.jsx                  ★ MỚI
│   ├── RoomsPage.css                  ★ MỚI
│   ├── RoomDetailPage.jsx             ★ MỚI
│   └── RoomDetailPage.css             ★ MỚI
├── components/
│   ├── rooms/
│   │   ├── RoomCard.jsx               ★ MỚI
│   │   ├── RoomCard.css               ★ MỚI
│   │   ├── RoomForm.jsx               ★ MỚI
│   │   ├── RoomForm.css               ★ MỚI
│   │   └── RoomFilter.jsx             ★ MỚI
│   └── common/
│       ├── Modal.jsx                  ★ MỚI
│       ├── Modal.css                  ★ MỚI
│       ├── Pagination.jsx             ★ MỚI
│       ├── Badge.jsx                  ★ MỚI
│       └── ConfirmDialog.jsx          ★ MỚI
└── App.jsx                            (sửa — thêm routes)
```

---

## Tiêu chí hoàn thành

### Backend

- [X] GET /api/rooms trả danh sách phòng, hỗ trợ phân trang + filter
- [X] GET /api/rooms/:id trả chi tiết phòng
- [X] POST /api/rooms tạo phòng (chỉ admin) — validation đúng
- [X] PUT /api/rooms/:id sửa phòng (chỉ admin)
- [X] DELETE /api/rooms/:id soft-delete phòng (chỉ admin)
- [X] GET /api/rooms/available trả phòng trống theo thời gian
- [X] Tên phòng trùng → 409 Conflict
- [X] User thường gọi POST/PUT/DELETE → 403 Forbidden

### Frontend

- [X] Trang danh sách phòng hiển thị card grid, responsive
- [X] Filter search hoạt động (debounce)
- [X] Filter capacity, equipment hoạt động
- [X] Phân trang hoạt động
- [X] Admin thấy nút Thêm/Sửa/Xóa
- [X] User thường không thấy nút Thêm/Sửa/Xóa
- [X] Modal thêm/sửa phòng hoạt động đúng
- [X] Confirm dialog khi xóa phòng
- [X] Trang chi tiết phòng hiển thị đầy đủ thông tin
- [X] Toast notification khi thao tác thành công/thất bại
