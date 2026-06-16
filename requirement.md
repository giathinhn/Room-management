# Hệ thống Quản lý Phòng họp và Đăng ký Lịch sử dụng

## 1. Tổng quan dự án

### 1.1 Mô tả
Xây dựng ứng dụng web cho phép nhân viên đăng ký sử dụng phòng họp trong công ty/trường học. Hệ thống hỗ trợ kiểm tra trùng lịch, quản lý danh sách phòng họp, theo dõi lịch đặt phòng và phê duyệt/hủy lịch khi cần.

Đây là bài toán thực tế, dễ hiểu, có thể áp dụng ngay trong nội bộ đơn vị.

### 1.2 Mục tiêu
- Số hóa quy trình đặt phòng họp, thay thế đăng ký thủ công (giấy, email, chat).
- Tránh xung đột lịch đặt phòng bằng cơ chế kiểm tra trùng tự động.
- Cung cấp giao diện lịch trực quan giúp nhân viên dễ dàng tra cứu và đặt phòng.
- Hỗ trợ quy trình phê duyệt lịch đặt phòng theo phân quyền.

---

## 2. Tech Stack

| Thành phần       | Công nghệ                          |
| ---------------- | ----------------------------------- |
| **Frontend**     | React (Vite) + CSS/UI Library       |
| **Backend**      | Node.js + Express.js                |
| **Database**     | PostgreSQL                          |
| **ORM**          | Prisma hoặc Sequelize               |
| **Auth**         | JWT (Access Token + Refresh Token)  |
| **API Docs**     | Swagger / OpenAPI 3.0               |
| **Email**        | Nodemailer (SMTP)                   |
| **Scheduling**   | node-cron (nhắc lịch)              |
| **Export**        | ExcelJS (export Excel)              |
| **Container**    | Docker + Docker Compose             |
| **Calendar UI**  | FullCalendar hoặc React Big Calendar |

---

## 3. Actors & Phân quyền

### 3.1 Các vai trò (Roles)

| Role            | Mô tả                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| **Admin**       | Quản trị hệ thống: CRUD phòng họp, quản lý người dùng, xem toàn bộ lịch, export báo cáo |
| **Người duyệt** | Duyệt/từ chối lịch đặt phòng, xem lịch đặt của phòng mình phụ trách  |
| **Người đăng ký** | Đăng ký đặt phòng, hủy lịch của mình, xem lịch phòng trống           |

### 3.2 Ma trận phân quyền

| Chức năng                     | Admin | Người duyệt | Người đăng ký |
| ----------------------------- | :---: | :----------: | :-----------: |
| CRUD phòng họp                |  ✅   |      ❌       |      ❌       |
| Quản lý tài khoản người dùng |  ✅   |      ❌       |      ❌       |
| Đặt phòng họp                |  ✅   |      ✅       |      ✅       |
| Hủy lịch đặt (của mình)      |  ✅   |      ✅       |      ✅       |
| Hủy lịch đặt (của người khác)|  ✅   |      ❌       |      ❌       |
| Duyệt/Từ chối lịch đặt      |  ✅   |      ✅       |      ❌       |
| Xem lịch đặt phòng           |  ✅   |      ✅       |      ✅       |
| Tìm kiếm/lọc lịch đặt       |  ✅   |      ✅       |      ✅       |
| Export Excel                  |  ✅   |      ✅       |      ❌       |
| Xem Swagger API docs          |  ✅   |      ❌       |      ❌       |

---

## 4. Chức năng chính (Core Features)

### 4.1 Xác thực & Bảo mật
- **Đăng ký tài khoản**: email + mật khẩu (validate email hợp lệ, mật khẩu tối thiểu 8 ký tự, chứa chữ hoa + số + ký tự đặc biệt).
- **Đăng nhập**: email + mật khẩu → nhận JWT (Access Token: 15 phút, Refresh Token: 7 ngày).
- **Mã hóa mật khẩu**: bcrypt (salt rounds = 10).
- **Phân quyền**: middleware kiểm tra role trước khi truy cập API.
- **Đăng xuất**: vô hiệu hóa Refresh Token.

### 4.2 Quản lý phòng họp (CRUD)
- **Thêm phòng**: tên phòng, sức chứa, vị trí (tầng/tòa nhà), danh sách thiết bị hỗ trợ.
- **Sửa phòng**: cập nhật thông tin phòng.
- **Xóa phòng**: soft-delete (đánh dấu inactive, không xóa khỏi DB).
- **Xem danh sách phòng**: phân trang, filter theo sức chứa, vị trí, thiết bị.
- **Thiết bị hỗ trợ**: máy chiếu, micro, bảng trắng, TV, webcam, loa, điều hòa.

### 4.3 Đặt phòng họp
- Người dùng chọn phòng → chọn ngày/giờ bắt đầu và kết thúc → nhập mục đích cuộc họp → gửi yêu cầu.
- **Validation**:
  - Không đặt phòng trong quá khứ.
  - Thời lượng tối thiểu: 30 phút.
  - Thời lượng tối đa: 8 giờ.
  - Chỉ đặt trong giờ hành chính: 07:00 – 22:00.
  - Đặt trước tối đa: 30 ngày.
- **Kiểm tra trùng lịch**: Hệ thống tự động kiểm tra không cho đặt trùng phòng trong cùng khoảng thời gian. Nếu trùng → trả về thông báo lỗi kèm danh sách lịch đang chiếm phòng.

### 4.4 Đặt phòng định kỳ (Recurring Booking)
- Hỗ trợ đặt phòng lặp lại theo: **hàng ngày**, **hàng tuần**, **hàng tháng**.
- Người dùng chọn tần suất + ngày kết thúc chuỗi đặt.
- Hệ thống tự sinh ra các booking riêng lẻ, mỗi booking được kiểm tra trùng lịch độc lập.
- Nếu một số slot bị trùng → thông báo danh sách slot bị trùng, cho phép đặt các slot còn lại.
- Cho phép hủy từng booking đơn lẻ hoặc hủy toàn bộ chuỗi.

### 4.5 Quản lý trạng thái lịch đặt
- **Luồng trạng thái**:

```
[Người đăng ký tạo] → PENDING (Chờ duyệt)
                          │
              ┌───────────┼───────────┐
              ▼                       ▼
    APPROVED (Đã duyệt)     REJECTED (Từ chối)
              │
              ▼
    CANCELLED (Đã hủy - bởi người đặt hoặc admin)
```

- Chỉ **Admin** và **Người duyệt** được phép duyệt/từ chối.
- Chỉ booking ở trạng thái **PENDING** hoặc **APPROVED** mới được hủy.
- Booking ở trạng thái **REJECTED** không thể hủy, phải tạo booking mới.

### 4.6 Hiển thị lịch đặt phòng
- Giao diện calendar trực quan (tương tự Google Calendar).
- Hỗ trợ 3 chế độ xem: **ngày**, **tuần**, **tháng**.
- Mã màu theo trạng thái: Pending (vàng), Approved (xanh lá), Rejected (đỏ), Cancelled (xám).
- Click vào slot trống → mở form đặt phòng nhanh.
- Click vào booking → xem chi tiết / hủy.

### 4.7 Tìm kiếm & Lọc
- Lọc lịch đặt theo:
  - Phòng họp
  - Người đặt
  - Trạng thái (Pending / Approved / Rejected / Cancelled)
  - Khoảng thời gian (từ ngày – đến ngày)
- Tìm kiếm phòng trống theo: ngày/giờ mong muốn, sức chứa tối thiểu, thiết bị cần có.

---

## 5. Chức năng mở rộng (Nice-to-have)

| #  | Chức năng                              | Mô tả                                                                 |
| -- | -------------------------------------- | ---------------------------------------------------------------------- |
| 1  | Gửi email thông báo                   | Gửi email khi lịch đặt được duyệt/từ chối/hủy (Nodemailer + SMTP)    |
| 2  | Nhắc lịch trước giờ họp               | Gửi email/notification trước 15 phút khi cuộc họp sắp bắt đầu         |
| 3  | Export Excel                           | Export danh sách lịch đặt theo bộ lọc ra file .xlsx                    |
| 4  | Dashboard thống kê (Admin)             | Thống kê: tần suất sử dụng phòng, phòng hot nhất, giờ cao điểm        |
| 5  | OAuth đăng nhập                        | Hỗ trợ đăng nhập bằng Google/Microsoft SSO                            |
| 6  | Real-time notification                 | Thông báo real-time khi booking được duyệt/từ chối (WebSocket/SSE)    |
| 7  | Đính kèm file                         | Cho phép đính kèm tài liệu cuộc họp khi đặt phòng                    |

---

## 6. Mô hình dữ liệu (ERD)

### 6.1 Bảng `users`

| Cột            | Kiểu dữ liệu     | Mô tả                                      |
| -------------- | ------------------ | ------------------------------------------- |
| id             | UUID (PK)          | Khóa chính                                  |
| email          | VARCHAR(255)       | Email đăng nhập (unique)                    |
| password_hash  | VARCHAR(255)       | Mật khẩu đã mã hóa bcrypt                  |
| full_name      | VARCHAR(100)       | Họ tên                                      |
| role           | ENUM               | `admin`, `approver`, `user`                 |
| is_active      | BOOLEAN            | Trạng thái tài khoản                        |
| created_at     | TIMESTAMP          | Ngày tạo                                    |
| updated_at     | TIMESTAMP          | Ngày cập nhật                               |

### 6.2 Bảng `rooms`

| Cột            | Kiểu dữ liệu     | Mô tả                                      |
| -------------- | ------------------ | ------------------------------------------- |
| id             | UUID (PK)          | Khóa chính                                  |
| name           | VARCHAR(100)       | Tên phòng (unique)                          |
| capacity       | INTEGER            | Sức chứa (số người)                         |
| location       | VARCHAR(200)       | Vị trí (VD: "Tầng 3, Tòa A")               |
| equipment      | TEXT[]             | Mảng thiết bị hỗ trợ                        |
| is_active      | BOOLEAN            | Phòng đang hoạt động hay không (soft-delete)|
| created_at     | TIMESTAMP          | Ngày tạo                                    |
| updated_at     | TIMESTAMP          | Ngày cập nhật                               |

### 6.3 Bảng `bookings`

| Cột              | Kiểu dữ liệu     | Mô tả                                      |
| ---------------- | ------------------ | ------------------------------------------- |
| id               | UUID (PK)          | Khóa chính                                  |
| room_id          | UUID (FK → rooms)  | Phòng được đặt                              |
| user_id          | UUID (FK → users)  | Người đặt                                   |
| title            | VARCHAR(200)       | Tiêu đề / mục đích cuộc họp                 |
| start_time       | TIMESTAMP          | Thời gian bắt đầu                           |
| end_time         | TIMESTAMP          | Thời gian kết thúc                           |
| status           | ENUM               | `pending`, `approved`, `rejected`, `cancelled` |
| approved_by      | UUID (FK → users)  | Người duyệt (nullable)                      |
| approved_at      | TIMESTAMP          | Thời gian duyệt (nullable)                  |
| rejection_reason | TEXT               | Lý do từ chối (nullable)                    |
| recurring_id     | UUID (FK → recurring_bookings) | Thuộc chuỗi đặt định kỳ nào (nullable) |
| created_at       | TIMESTAMP          | Ngày tạo                                    |
| updated_at       | TIMESTAMP          | Ngày cập nhật                               |

### 6.4 Bảng `recurring_bookings`

| Cột            | Kiểu dữ liệu     | Mô tả                                      |
| -------------- | ------------------ | ------------------------------------------- |
| id             | UUID (PK)          | Khóa chính                                  |
| user_id        | UUID (FK → users)  | Người tạo chuỗi                             |
| room_id        | UUID (FK → rooms)  | Phòng đặt                                   |
| frequency      | ENUM               | `daily`, `weekly`, `monthly`                |
| start_date     | DATE               | Ngày bắt đầu chuỗi                          |
| end_date       | DATE               | Ngày kết thúc chuỗi                          |
| start_time     | TIME               | Giờ bắt đầu mỗi buổi                        |
| end_time       | TIME               | Giờ kết thúc mỗi buổi                        |
| created_at     | TIMESTAMP          | Ngày tạo                                    |

### 6.5 Bảng `refresh_tokens`

| Cột            | Kiểu dữ liệu     | Mô tả                                      |
| -------------- | ------------------ | ------------------------------------------- |
| id             | UUID (PK)          | Khóa chính                                  |
| user_id        | UUID (FK → users)  | Người sở hữu token                          |
| token          | VARCHAR(500)       | Refresh token                               |
| expires_at     | TIMESTAMP          | Thời gian hết hạn                            |
| is_revoked     | BOOLEAN            | Đã bị thu hồi chưa                          |
| created_at     | TIMESTAMP          | Ngày tạo                                    |

### 6.6 Sơ đồ quan hệ

```
users ──< bookings >── rooms
  │            │
  │            └── recurring_bookings
  │
  └──< refresh_tokens
```

- `users` 1:N `bookings` (một user đặt nhiều booking)
- `rooms` 1:N `bookings` (một phòng có nhiều booking)
- `users` 1:N `refresh_tokens` (một user có nhiều token trên nhiều thiết bị)
- `recurring_bookings` 1:N `bookings` (một chuỗi đặt định kỳ sinh ra nhiều booking)

---

## 7. Luồng nghiệp vụ chính

### 7.1 Luồng đặt phòng

```
Người đăng ký                    Hệ thống                      Người duyệt
     │                              │                               │
     │──  Chọn phòng + ngày/giờ  ──▶│                               │
     │                              │── Validate thời gian          │
     │                              │── Kiểm tra trùng lịch         │
     │                              │                               │
     │◀── Nếu trùng: trả lỗi  ─────│                               │
     │                              │                               │
     │◀── Nếu OK: tạo booking ─────│                               │
     │    (status = PENDING)        │── Gửi thông báo ────────────▶│
     │                              │                               │
     │                              │◀── Duyệt / Từ chối ──────────│
     │                              │                               │
     │◀── Gửi email kết quả ───────│                               │
     │    (APPROVED / REJECTED)     │                               │
```

### 7.2 Luồng hủy booking

```
Người đặt / Admin                Hệ thống
     │                              │
     │── Yêu cầu hủy booking ─────▶│
     │                              │── Kiểm tra trạng thái
     │                              │   (chỉ PENDING/APPROVED được hủy)
     │                              │── Cập nhật status = CANCELLED
     │◀── Xác nhận đã hủy ─────────│
     │                              │── Gửi email thông báo hủy
```

### 7.3 Luồng đặt phòng định kỳ

```
Người đăng ký                    Hệ thống
     │                              │
     │── Chọn phòng + giờ          │
     │   + tần suất + ngày kết thúc │
     │──────────────────────────────▶│
     │                              │── Sinh danh sách slots
     │                              │── Kiểm tra trùng từng slot
     │                              │
     │◀── Trả kết quả: ────────────│
     │    ✅ Slots đặt OK           │
     │    ❌ Slots bị trùng         │
     │                              │
     │── Xác nhận đặt slots OK ───▶│
     │                              │── Tạo recurring_booking
     │                              │── Tạo bookings (status=PENDING)
     │◀── Xác nhận thành công ─────│
```

---

## 8. Yêu cầu phi chức năng (Non-functional Requirements)

| Tiêu chí         | Yêu cầu                                                         |
| ----------------- | ---------------------------------------------------------------- |
| **Performance**   | API response time ≤ 500ms cho các thao tác thông thường          |
| **Concurrency**   | Hỗ trợ tối thiểu 50 người dùng đồng thời                       |
| **Availability**  | Uptime ≥ 99% (trong môi trường production)                      |
| **Security**      | Mã hóa mật khẩu bcrypt, JWT, HTTPS, SQL injection prevention    |
| **Scalability**   | Kiến trúc tách biệt FE/BE, dễ scale từng service               |
| **Maintainability** | Code clean, có ESLint, Prettier, folder structure rõ ràng      |
| **Compatibility** | Hỗ trợ Chrome, Firefox, Edge, Safari (2 phiên bản mới nhất)    |
| **Responsive**    | Giao diện responsive trên desktop và tablet (≥ 768px)           |

---

## 9. Yêu cầu đầu ra (Deliverables)

### 9.1 Tài liệu
- [ ] Tài liệu requirement (file này).
- [ ] Tài liệu mô tả nghiệp vụ và luồng xử lý đặt phòng.
- [ ] API documentation (Swagger/OpenAPI).
- [ ] Hướng dẫn cài đặt và chạy project (README.md).

### 9.2 Source code
- [ ] Frontend: React app với giao diện calendar, form đặt phòng, quản lý phòng.
- [ ] Backend: Express.js API server với đầy đủ endpoints.
- [ ] Database: PostgreSQL schema + seed data mẫu.

### 9.3 DevOps
- [ ] Dockerfile cho frontend và backend.
- [ ] docker-compose.yml để chạy toàn bộ hệ thống (FE + BE + DB).
- [ ] File `.env.example` cho các biến môi trường.

### 9.4 Cấu trúc thư mục dự kiến

```
Mini_Project/
├── frontend/                # React (Vite)
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API calls
│   │   ├── context/         # React Context (auth, theme)
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Helper functions
│   ├── Dockerfile
│   └── package.json
│
├── backend/                 # Node.js + Express
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Prisma/Sequelize models
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Auth, validation, error handling
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── config/          # DB, email, JWT config
│   ├── prisma/              # Prisma schema & migrations
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── requirement.md
└── README.md
```

---

## 10. API Endpoints (Tổng quan)

### Auth
| Method | Endpoint              | Mô tả                    | Auth |
| ------ | --------------------- | ------------------------- | ---- |
| POST   | `/api/auth/register`  | Đăng ký tài khoản         | ❌   |
| POST   | `/api/auth/login`     | Đăng nhập                  | ❌   |
| POST   | `/api/auth/refresh`   | Refresh access token       | ❌   |
| POST   | `/api/auth/logout`    | Đăng xuất                  | ✅   |

### Rooms
| Method | Endpoint              | Mô tả                    | Auth  |
| ------ | --------------------- | ------------------------- | ----- |
| GET    | `/api/rooms`          | Danh sách phòng            | ✅    |
| GET    | `/api/rooms/:id`      | Chi tiết phòng             | ✅    |
| POST   | `/api/rooms`          | Thêm phòng                 | Admin |
| PUT    | `/api/rooms/:id`      | Sửa phòng                  | Admin |
| DELETE | `/api/rooms/:id`      | Xóa phòng (soft-delete)   | Admin |
| GET    | `/api/rooms/available`| Tìm phòng trống            | ✅    |

### Bookings
| Method | Endpoint                        | Mô tả                       | Auth     |
| ------ | ------------------------------- | ---------------------------- | -------- |
| GET    | `/api/bookings`                 | Danh sách booking (có filter)| ✅       |
| GET    | `/api/bookings/:id`             | Chi tiết booking             | ✅       |
| POST   | `/api/bookings`                 | Tạo booking                  | ✅       |
| POST   | `/api/bookings/recurring`       | Tạo booking định kỳ          | ✅       |
| PATCH  | `/api/bookings/:id/cancel`      | Hủy booking                  | ✅       |
| PATCH  | `/api/bookings/:id/approve`     | Duyệt booking                | Approver |
| PATCH  | `/api/bookings/:id/reject`      | Từ chối booking               | Approver |
| DELETE | `/api/bookings/recurring/:id`   | Hủy toàn bộ chuỗi            | ✅       |

### Users (Admin)
| Method | Endpoint              | Mô tả                    | Auth  |
| ------ | --------------------- | ------------------------- | ----- |
| GET    | `/api/users`          | Danh sách người dùng       | Admin |
| GET    | `/api/users/:id`      | Chi tiết người dùng        | Admin |
| PATCH  | `/api/users/:id/role` | Thay đổi role              | Admin |
| PATCH  | `/api/users/:id`      | Cập nhật thông tin         | Admin |

### Export
| Method | Endpoint                     | Mô tả                      | Auth     |
| ------ | ---------------------------- | --------------------------- | -------- |
| GET    | `/api/export/bookings`       | Export booking ra Excel      | Approver+|

### Profile
| Method | Endpoint              | Mô tả                    | Auth  |
| ------ | --------------------- | ------------------------- | ----- |
| GET    | `/api/profile`        | Xem profile bản thân       | ✅    |
| PUT    | `/api/profile`        | Cập nhật profile            | ✅    |
| PUT    | `/api/profile/password` | Đổi mật khẩu             | ✅    |