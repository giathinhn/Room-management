# Plan 01 — Authentication & Authorization (Backend)

> **Mục tiêu**: Xây dựng toàn bộ hệ thống xác thực (register, login, logout, refresh token) và phân quyền (role-based middleware) ở phía backend.
> **Thời lượng ước tính**: 1.5–2 giờ
> **Phụ thuộc**: Plan 00 (project setup, database schema)

---

## Tổng quan

Plan này tập trung **100% backend**. Sau khi hoàn thành, tất cả API auth sẽ hoạt động và có thể test qua Postman/Swagger. Frontend auth UI sẽ ở Plan 02.

---

## Kiến trúc 3 lớp cho Auth

```
POST /api/auth/register
        │
        ▼
[Route]  auth.routes.js ──▶ [Controller] auth.controller.js
                                    │
                                    ▼
                            [Service] auth.service.js
                            ├── Validate input (Zod)
                            ├── Check email trùng
                            ├── Hash password (bcrypt)
                            ├── Tạo user
                            └── Tạo JWT tokens
                                    │
                                    ▼
                            [Repository] user.repository.js
                            └── prisma.user.create()
```

---

## Checklist

### 1. Cài thêm dependencies

```bash
npm install bcryptjs jsonwebtoken zod
npm install -D @types/jsonwebtoken
```

### 2. Config files

**`src/config/env.js`** — Thêm JWT config:

```js
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
};
```

**`src/utils/jwt.js`** — JWT helper:

```js
// generateAccessToken(payload) → token string
// generateRefreshToken(payload) → token string
// verifyToken(token) → decoded payload hoặc throw error
```

### 3. Validation Schemas (Zod)

**`src/validators/auth.validator.js`**:

| Schema             | Fields                    | Rules                                                                                                 |
| ------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `registerSchema` | email, password, fullName | email hợp lệ, password ≥ 8 ký tự + chữ hoa + số + ký tự đặc biệt, fullName 2–100 ký tự |
| `loginSchema`    | email, password           | email hợp lệ, password required                                                                     |

### 4. Repository Layer

**`src/repositories/user.repository.js`**:

| Method                   | Mô tả                        |
| ------------------------ | ------------------------------ |
| `findByEmail(email)`   | Tìm user theo email           |
| `findById(id)`         | Tìm user theo ID              |
| `create(data)`         | Tạo user mới                 |
| `findAll(filters)`     | Danh sách users (phân trang) |
| `updateRole(id, role)` | Cập nhật role                |
| `update(id, data)`     | Cập nhật thông tin          |

**`src/repositories/token.repository.js`**:

| Method                               | Mô tả                           |
| ------------------------------------ | --------------------------------- |
| `create(userId, token, expiresAt)` | Lưu refresh token                |
| `findByToken(token)`               | Tìm refresh token                |
| `revokeByUserId(userId)`           | Thu hồi tất cả token của user |
| `revokeByToken(token)`             | Thu hồi 1 token cụ thể         |

### 5. Service Layer

**`src/services/auth.service.js`**:

| Method                     | Logic                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `register(data)`         | Validate → Check email trùng → Hash password → Tạo user → Tạo tokens → Lưu refresh token → Return { user, accessToken, refreshToken } |
| `login(email, password)` | Validate → Tìm user → So sánh password (bcrypt.compare) → Tạo tokens → Lưu refresh token → Return { user, accessToken, refreshToken }  |
| `refreshToken(token)`    | Tìm refresh token trong DB → Kiểm tra hết hạn + revoked → Verify JWT → Tạo access token mới → Return { accessToken }                  |
| `logout(token)`          | Thu hồi refresh token trong DB                                                                                                                 |

**Error cases cần handle:**

- `register`: Email đã tồn tại → 409 Conflict
- `login`: Email không tồn tại → 401 Unauthorized
- `login`: Sai password → 401 Unauthorized
- `login`: Tài khoản bị khóa (isActive = false) → 403 Forbidden
- `refreshToken`: Token không hợp lệ / hết hạn → 401 Unauthorized

### 6. Controller Layer

**`src/controllers/auth.controller.js`**:

| Method                     | Request                             | Response                                                                |
| -------------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `register(req, res)`     | Body: { email, password, fullName } | 201: { user: { id, email, fullName, role }, accessToken, refreshToken } |
| `login(req, res)`        | Body: { email, password }           | 200: { user: { id, email, fullName, role }, accessToken, refreshToken } |
| `refreshToken(req, res)` | Body: { refreshToken }              | 200: { accessToken }                                                    |
| `logout(req, res)`       | Body: { refreshToken }              | 200: { message: "Logged out successfully" }                             |

### 7. Middlewares

**`src/middlewares/auth.middleware.js`**:

```js
// authenticate(req, res, next)
// - Lấy token từ header: Authorization: Bearer <token>
// - Verify JWT → gắn req.user = { id, email, role }
// - Nếu lỗi → 401 Unauthorized
```

**`src/middlewares/role.middleware.js`**:

```js
// authorize(...allowedRoles)
// - Trả về middleware function
// - Kiểm tra req.user.role có nằm trong allowedRoles không
// - Nếu không → 403 Forbidden
//
// Cách dùng: router.get('/admin', authenticate, authorize('admin'), handler)
```

**`src/middlewares/validate.middleware.js`**:

```js
// validate(schema)
// - Nhận Zod schema
// - Validate req.body
// - Nếu lỗi → 400 Bad Request với chi tiết lỗi validation
```

### 8. Routes

**`src/routes/auth.routes.js`**:

```js
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
```

Mount vào app: `app.use('/api/auth', authRoutes);`

### 9. Profile Routes (bonus, cùng module)

**`src/routes/profile.routes.js`**:

| Method | Endpoint                  | Mô tả                                                |
| ------ | ------------------------- | ------------------------------------------------------ |
| GET    | `/api/profile`          | Lấy thông tin user đang đăng nhập (từ req.user) |
| PUT    | `/api/profile`          | Cập nhật fullName                                    |
| PUT    | `/api/profile/password` | Đổi mật khẩu (cần xác minh mật khẩu cũ)       |

### 10. Admin — User Management Routes

**`src/routes/user.routes.js`**:

| Method | Endpoint                | Mô tả                                | Auth  |
| ------ | ----------------------- | -------------------------------------- | ----- |
| GET    | `/api/users`          | Danh sách users (phân trang, filter) | Admin |
| GET    | `/api/users/:id`      | Chi tiết user                         | Admin |
| PATCH  | `/api/users/:id/role` | Đổi role (admin/approver/user)       | Admin |
| PATCH  | `/api/users/:id`      | Cập nhật thông tin user             | Admin |

---

## Cấu trúc file tạo mới

```
backend/src/
├── config/env.js              (sửa — thêm JWT config)
├── utils/
│   ├── ApiError.js            (đã có từ Plan 00)
│   └── jwt.js                 ★ MỚI
├── validators/
│   └── auth.validator.js      ★ MỚI
├── repositories/
│   ├── user.repository.js     ★ MỚI
│   └── token.repository.js    ★ MỚI
├── services/
│   └── auth.service.js        ★ MỚI
├── controllers/
│   └── auth.controller.js     ★ MỚI
├── middlewares/
│   ├── auth.middleware.js     ★ MỚI
│   ├── role.middleware.js     ★ MỚI
│   ├── validate.middleware.js ★ MỚI
│   └── error.middleware.js    (đã có từ Plan 00)
├── routes/
│   ├── auth.routes.js         ★ MỚI
│   ├── profile.routes.js      ★ MỚI
│   ├── user.routes.js         ★ MỚI
│   └── index.js               (sửa — mount routes mới)
└── app.js                     (sửa — thêm routes)
```

---

## Test Cases (dùng Postman hoặc REST Client)

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "test@company.com",
  "password": "Password123!",
  "fullName": "Test User"
}
```

→ Expected: 201, trả về user info + tokens

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "Password123!"
}
```

→ Expected: 200, trả về user info + tokens

### Protected Route (dùng token từ login)

```http
GET /api/profile
Authorization: Bearer <accessToken>
```

→ Expected: 200, trả về user info

### Unauthorized

```http
GET /api/profile
```

→ Expected: 401, `{ error: "No token provided" }`

### Forbidden (user thường truy cập admin route)

```http
GET /api/users
Authorization: Bearer <user-token>
```

→ Expected: 403, `{ error: "Insufficient permissions" }`

---

## Tiêu chí hoàn thành

- [ ] Register tạo user mới, hash password, trả JWT tokens
- [ ] Login xác thực đúng, trả tokens
- [ ] Refresh token tạo access token mới
- [ ] Logout thu hồi refresh token
- [ ] Middleware `authenticate` chặn request không có token
- [ ] Middleware `authorize` chặn user không đủ quyền
- [ ] Validation trả lỗi chi tiết khi input sai format
- [ ] Profile API hoạt động (xem, sửa, đổi mật khẩu)
- [ ] Admin user management API hoạt động
- [ ] Tất cả error trả về JSON format thống nhất: `{ success: false, error: { message, details? } }`
