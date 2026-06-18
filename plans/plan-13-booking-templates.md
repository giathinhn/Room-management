# Plan 13 — Booking Templates

> **Mục tiêu**: Cho phép user lưu cấu hình đặt phòng thường xuyên thành template, đặt phòng từ template chỉ 1 click.
> **Thời lượng ước tính**: 1–1.5 giờ
> **Phụ thuộc**: Plan 03 (rooms), Plan 04 (booking system)
> **Độc lập với**: Plan 05, 06, 07, 08, 10, 11, 12, 14

---

## Tổng quan

Sau khi hoàn thành:

- User tạo/sửa/xóa booking templates (tối đa 10)
- Đặt phòng từ template: chọn template → chọn ngày → submit
- Lưu booking hiện tại thành template ("Save as template")
- Templates hiển thị trên trang đặt phòng

---

## BACKEND

### 1. Repository

**`src/repositories/template.repository.js`**:

| Method                    | Mô tả                                           |
| ------------------------- | ------------------------------------------------- |
| `findByUserId(userId)`  | Danh sách templates của user, include room info |
| `findById(id)`          | Chi tiết template                                |
| `create(data)`          | Tạo template mới                                |
| `update(id, data)`      | Sửa template                                     |
| `delete(id)`            | Xóa template                                     |
| `countByUserId(userId)` | Đếm số templates (kiểm tra giới hạn 10)     |

### 2. Validation

**`src/validators/template.validator.js`**:

| Schema                   | Fields                                       | Rules                                                                      |
| ------------------------ | -------------------------------------------- | -------------------------------------------------------------------------- |
| `createTemplateSchema` | name, roomId?, title, startTime, endTime     | name: 1-100 ký tự, title: 1-200 ký tự, startTime/endTime: HH:mm format |
| `updateTemplateSchema` | name?, roomId?, title?, startTime?, endTime? | Tất cả optional                                                          |

### 3. Service

**`src/services/template.service.js`**:

| Method                                       | Logic                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| `getByUser(userId)`                        | Lấy danh sách templates, include room name                                    |
| `create(userId, data)`                     | Kiểm tra giới hạn 10 → Validate → Kiểm tra room (nếu có roomId) → Tạo |
| `update(id, userId, data)`                 | Kiểm tra ownership → Validate → Cập nhật                                   |
| `delete(id, userId)`                       | Kiểm tra ownership → Xóa                                                     |
| `createFromBooking(userId, booking, name)` | Từ booking → tạo template tự động                                         |

### 4. Controller & Routes

```js
router.get('/',     authenticate, templateController.getAll);
router.post('/',    authenticate, templateController.create);
router.put('/:id',  authenticate, templateController.update);
router.delete('/:id', authenticate, templateController.delete);

// Mount: app.use('/api/templates', templateRoutes);
```

---

## FRONTEND

### 5. Components

#### `src/components/templates/TemplateList.jsx`

```
┌──────────────────────────────────────────┐
│ 📋 Mẫu đặt phòng (3/10)    [+ Tạo mới] │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ 🔖 Họp sprint hàng tuần            │   │
│ │ Phòng A1 • 09:00–10:00             │   │
│ │            [Đặt ngay] [Sửa] [Xóa] │   │
│ └────────────────────────────────────┘   │
│ ┌────────────────────────────────────┐   │
│ │ 🔖 Standup daily                    │   │
│ │ Phòng B3 • 08:30–08:45             │   │
│ │            [Đặt ngay] [Sửa] [Xóa] │   │
│ └────────────────────────────────────┘   │
│ ┌────────────────────────────────────┐   │
│ │ 🔖 Họp khách hàng                  │   │
│ │ Phòng VIP • 14:00–16:00            │   │
│ │            [Đặt ngay] [Sửa] [Xóa] │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

#### `src/components/templates/TemplateCard.jsx`

- Props: template, onUse, onEdit, onDelete
- Hiển thị: name, room name, time range
- Hover effect
- "Đặt ngay" → navigate BookingCreatePage với pre-fill

#### `src/components/templates/TemplateForm.jsx` (Modal)

- Dùng cho Create + Edit
- Fields: tên template, chọn phòng (dropdown), tiêu đề cuộc họp, giờ bắt đầu, giờ kết thúc
- Validation inline

#### `src/components/templates/SaveAsTemplate.jsx`

- Nút "💾 Lưu làm mẫu" trên BookingDetailPage (cho booking approved)
- Click → modal nhập tên template → auto-fill từ booking info → save

### 6. Tích hợp

**BookingCreatePage:**

- Thêm section "📋 Đặt từ mẫu" phía trên form
- Hiển thị template cards ngang (carousel nếu > 3)
- Click template → pre-fill: roomId, title, startTime, endTime → user chỉ cần chọn ngày

**Sidebar:**

- Thêm menu item "📋 Mẫu đặt phòng" → /templates

### 7. TemplatesPage

**`src/pages/TemplatesPage.jsx`**:

- Danh sách templates dạng card grid
- Nút tạo mới (disabled nếu đã đạt 10)
- CRUD modal

---

## Cấu trúc file tạo mới

```
backend/src/
├── repositories/template.repository.js   ★ MỚI
├── validators/template.validator.js      ★ MỚI
├── services/template.service.js          ★ MỚI
├── controllers/template.controller.js    ★ MỚI
├── routes/template.routes.js             ★ MỚI
└── routes/index.js                       (sửa)

frontend/src/
├── services/template.service.js           ★ MỚI
├── pages/
│   ├── TemplatesPage.jsx                  ★ MỚI
│   ├── TemplatesPage.css                  ★ MỚI
│   └── BookingCreatePage.jsx              (sửa — thêm template section)
├── components/templates/
│   ├── TemplateList.jsx                   ★ MỚI
│   ├── TemplateCard.jsx                   ★ MỚI
│   ├── TemplateCard.css                   ★ MỚI
│   ├── TemplateForm.jsx                   ★ MỚI
│   ├── TemplateForm.css                   ★ MỚI
│   └── SaveAsTemplate.jsx                 ★ MỚI
├── components/layout/Sidebar.jsx          (sửa — thêm menu)
└── App.jsx                                (sửa — thêm /templates route)
```

---

## Tiêu chí hoàn thành

- [X] CRUD templates API hoạt động
- [X] Giới hạn 10 templates/user → 400 khi vượt quá
- [X] Chỉ owner mới sửa/xóa template
- [X] Trang templates hiển thị danh sách
- [X] Tạo/sửa template qua modal
- [X] Xóa template có confirm dialog
- [X] Click "Đặt ngay" → BookingCreatePage pre-filled
- [X] Templates hiển thị trên BookingCreatePage
- [X] "Lưu làm mẫu" trên BookingDetailPage hoạt động
- [X] Counter "3/10" hiển thị đúng
