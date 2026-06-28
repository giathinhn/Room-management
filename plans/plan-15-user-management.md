# Plan 15 — User Management (Quản lý User dành cho Admin)

> **Mục tiêu**: Xây dựng trang quản lý người dùng (`/admin/users`) cho phép Admin xem danh sách, tìm kiếm/lọc, thay đổi vai trò và kích hoạt/vô hiệu hóa tài khoản.
> **Thời lượng ước tính**: 2–3 giờ
> **Phụ thuộc**: Plan 01 (Auth Backend), Plan 02 (Auth Frontend)
> **Độc lập với**: Plan 05, 06, 07, 08, 10, 11, 12, 13, 14

---

## Tổng quan

Sau khi hoàn thành plan này:

- Admin có thể truy cập `/admin/users` qua Sidebar.
- Admin xem danh sách người dùng, tìm kiếm theo Tên/Email, lọc theo Vai trò và Trạng thái.
- Admin có thể kích hoạt hoặc vô hiệu hóa (soft-delete) tài khoản.
- Admin có thể thay đổi vai trò của người dùng (Admin, Người duyệt, Nhân viên).
- Admin có thể tạo tài khoản trực tiếp cho nhân viên mới.

---

## BACKEND

Backend đã hoàn thiện đầy đủ các API cần thiết từ các plan trước:

- `GET /api/users` — Danh sách users (phân trang, lọc, tìm kiếm)
- `GET /api/users/:id` — Chi tiết user
- `PATCH /api/users/:id/role` — Đổi role
- `PATCH /api/users/:id` — Cập nhật `fullName`, `isActive`

> **Note**: Tất cả các API trên đều đã tích hợp middleware `authenticate` và `authorize('admin')`.

---

## FRONTEND

### 1. Services

**`src/services/user.service.js`**:
Giao tiếp với API backend:

- `getUsers(params)`: lấy danh sách kèm filter (`page`, `limit`, `role`, `search`, `isActive`)
- `getUserById(id)`: xem chi tiết
- `updateUserRole(id, role)`: thay đổi quyền
- `updateUser(id, data)`: cập nhật thông tin (`fullName`, `isActive`)

### 2. Components

#### `src/components/users/EditUserModal.jsx`

- Chỉnh sửa `fullName` (validation: không rỗng, tối thiểu 2 ký tự).
- Toggle switch thay đổi trạng thái `isActive`.
- Hiển thị email dạng Read-only.

#### `src/components/users/ChangeRoleModal.jsx`

- Lựa chọn role mới qua radio/card interface (Admin, Người duyệt, Nhân viên).
- Hiển thị cảnh báo nếu thay đổi hạ role của Admin khác.

#### `src/components/users/CreateUserModal.jsx`

- Form đăng ký user mới: Email, Họ tên, Mật khẩu, Nhập lại mật khẩu, Chọn vai trò.
- Validation mật khẩu (ít nhất 8 ký tự, chứa chữ hoa, số, ký tự đặc biệt).
- **Quy trình xử lý**: Gọi `POST /api/auth/register` để tạo, sau đó gọi `PATCH /api/users/:id/role` nếu role chọn khác `user`.

### 3. Pages

**`src/pages/UsersPage.jsx`**:

- Toolbar: Tìm kiếm (debounced 400ms) + Lọc theo Role + Lọc theo Trạng thái + Button "Thêm user".
- Bảng danh sách user:
  - Avatar chữ viết tắt (màu gradient theo role).
  - Tên & Email, Role badge, Trạng thái badge, Ngày tạo.
  - Cột hành động: Sửa, Đổi role, Kích hoạt/Vô hiệu hóa nhanh.
- Phân trang (Pagination).
- Trạng thái trống (Empty state) & Skeleton Loading.

---

## Cấu trúc file tạo mới & sửa

```
backend/ (Không cần sửa đổi)

frontend/src/
├── services/user.service.js           ★ MỚI
├── pages/
│   ├── UsersPage.jsx                  ★ MỚI
│   └── UsersPage.css                  ★ MỚI
├── components/users/
│   ├── EditUserModal.jsx              ★ MỚI
│   ├── EditUserModal.css              ★ MỚI
│   ├── ChangeRoleModal.jsx            ★ MỚI
│   ├── ChangeRoleModal.css            ★ MỚI
│   ├── CreateUserModal.jsx            ★ MỚI
│   └── CreateUserModal.css            ★ MỚI
└── App.jsx                            (sửa — thêm route /admin/users)
```

---

## Tiêu chí hoàn thành

- [X] Route `/admin/users` được bảo vệ, chỉ Admin truy cập được (User thường vào bị redirect).
- [X] Bảng hiển thị danh sách user phân trang và đầy đủ thông tin.
- [X] Ô tìm kiếm (debounced) hoạt động chính xác với tên và email.
- [X] Các bộ lọc Role và Trạng thái cập nhật danh sách tức thì.
- [X] Sửa thông tin user (fullName, isActive) thành công qua modal.
- [X] Đổi role thành công và badge UI cập nhật tương ứng.
- [X] Tạo mới user thành công với mật khẩu hợp lệ và gán đúng role.
- [X] Nút kích hoạt/vô hiệu hóa nhanh ngoài bảng hoạt động chuẩn xác.
