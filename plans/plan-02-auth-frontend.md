# Plan 02 — Authentication Frontend (Login/Register UI)

> **Mục tiêu**: Xây dựng giao diện đăng nhập, đăng ký, quản lý auth state (Context), và protected routes ở phía frontend.
> **Thời lượng ước tính**: 1.5–2 giờ
> **Phụ thuộc**: Plan 00 (project setup), Plan 01 (auth backend API)

---

## Tổng quan

Plan này tập trung **100% frontend**. Sau khi hoàn thành:

- User có thể đăng ký, đăng nhập, đăng xuất qua UI
- Auth state được quản lý bằng React Context
- Access token tự động refresh khi hết hạn
- Protected routes redirect về login nếu chưa đăng nhập
- Layout cơ bản với header/sidebar (skeleton cho các plan sau)

---

## Checklist

### 1. Cài thêm dependencies

```bash
npm install react-router-dom axios react-icons react-hot-toast
```

### 2. Design System — CSS Variables

**`src/index.css`** — Thiết lập toàn bộ design tokens:

```css
:root {
  /* Colors — Dark theme làm default */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --bg-hover: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --border: #334155;

  /* Spacing */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.5);
}
```

**Thêm Google Font** vào `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 3. Axios Instance với Token Interceptor

**`src/services/api.js`**:

```js
// Tạo axios instance với baseURL = '/api'
// Request interceptor: gắn Authorization header từ localStorage
// Response interceptor:
//   - Nếu 401 → thử refresh token
//   - Nếu refresh thành công → retry request gốc
//   - Nếu refresh thất bại → clear auth state, redirect /login
```

**`src/services/auth.service.js`**:

| Method                                       | Mô tả                   |
| -------------------------------------------- | ------------------------- |
| `register(email, password, fullName)`      | POST /api/auth/register   |
| `login(email, password)`                   | POST /api/auth/login      |
| `logout(refreshToken)`                     | POST /api/auth/logout     |
| `refreshToken(refreshToken)`               | POST /api/auth/refresh    |
| `getProfile()`                             | GET /api/profile          |
| `updateProfile(data)`                      | PUT /api/profile          |
| `changePassword(oldPassword, newPassword)` | PUT /api/profile/password |

### 4. Auth Context

**`src/context/AuthContext.jsx`**:

```jsx
// State:
//   - user: { id, email, fullName, role } | null
//   - isAuthenticated: boolean
//   - isLoading: boolean (đang kiểm tra token lần đầu)
//
// Actions:
//   - login(email, password) → gọi API, lưu tokens vào localStorage, set user
//   - register(email, password, fullName) → tương tự login
//   - logout() → gọi API, xóa localStorage, set user = null
//
// On mount:
//   - Kiểm tra localStorage có token không
//   - Nếu có → gọi getProfile() để verify token và lấy user info
//   - Nếu thất bại → clear tokens
```

**localStorage keys:**

- `accessToken`
- `refreshToken`

### 5. Pages

#### `src/pages/LoginPage.jsx`

- Form: email + password + nút "Đăng nhập"
- Link: "Chưa có tài khoản? Đăng ký"
- Design: Centered card, glassmorphism effect, gradient background
- Validation: email format, password required
- Sau login thành công → redirect về `/dashboard`

#### `src/pages/RegisterPage.jsx`

- Form: fullName + email + password + confirmPassword + nút "Đăng ký"
- Link: "Đã có tài khoản? Đăng nhập"
- Design: Tương tự LoginPage
- Validation: fullName required, email format, password rules (hiển thị checklist), password match
- Sau register thành công → redirect về `/dashboard`

#### `src/pages/DashboardPage.jsx` (skeleton)

- Hiển thị: "Xin chào, {fullName}!"
- Hiển thị role badge
- Placeholder cho nội dung tương lai (các plan sau sẽ bổ sung)

#### `src/pages/NotFoundPage.jsx`

- Trang 404 đẹp

### 6. Components

#### `src/components/layout/AppLayout.jsx`

- Layout chung cho trang sau login:
  - **Header**: Logo + tên app + user dropdown (profile, logout)
  - **Sidebar**: Navigation links (thay đổi theo role)
  - **Main content**: Outlet (react-router)
- Responsive: Sidebar collapse trên tablet

#### `src/components/layout/Sidebar.jsx`

- Navigation items theo role:

| Menu item          | Icon | Route             | Admin | Approver | User |
| ------------------ | ---- | ----------------- | :---: | :------: | :--: |
| Dashboard          | 🏠   | /dashboard        |  ✅  |    ✅    |  ✅  |
| Lịch đặt phòng | 📅   | /calendar         |  ✅  |    ✅    |  ✅  |
| Phòng họp        | 🏢   | /rooms            |  ✅  |    ✅    |  ✅  |
| Đặt phòng       | ➕   | /bookings/new     |  ✅  |    ✅    |  ✅  |
| Duyệt lịch       | ✅   | /bookings/pending |  ✅  |    ✅    |  ❌  |
| Quản lý users    | 👥   | /admin/users      |  ✅  |    ❌    |  ❌  |

#### `src/components/common/ProtectedRoute.jsx`

```jsx
// Nếu chưa login → Navigate to /login
// Nếu đang loading → hiển thị spinner
// Nếu đã login → render Outlet
// Optional: kiểm tra allowedRoles
```

#### `src/components/common/Button.jsx`

- Variants: primary, secondary, danger, ghost
- States: loading (spinner), disabled
- Sizes: sm, md, lg

#### `src/components/common/Input.jsx`

- Label + input + error message
- Types: text, email, password (toggle show/hide)
- Validation error styling

#### `src/components/common/Toast.jsx`

- Dùng react-hot-toast cho notifications
- Types: success, error, info

### 7. Router Setup

**`src/App.jsx`**:

```jsx
<AuthProvider>
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Các route khác sẽ thêm ở plan sau */}
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppLayout />}>
          {/* Admin routes sẽ thêm ở plan sau */}
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

---

## Yêu cầu UI/UX

### Login/Register pages

- **Background**: Gradient tối (dark navy → deep purple)
- **Card**: Glassmorphism (backdrop-filter: blur, border rgba trắng)
- **Animation**: Card fade-in slide-up khi load
- **Input focus**: Border glow effect (box-shadow accent color)
- **Button**: Gradient background, scale animation on hover
- **Password strength**: Real-time indicator (weak/medium/strong)

### AppLayout

- **Sidebar**: Dark background, neon accent highlights cho active item
- **Header**: Blur backdrop, subtle border bottom
- **Transitions**: Smooth page transitions

---

## Cấu trúc file tạo mới

```
frontend/src/
├── index.css                           (sửa — design system)
├── App.jsx                             (sửa — router)
├── App.css                             (sửa — layout styles)
├── context/
│   └── AuthContext.jsx                 ★ MỚI
├── services/
│   ├── api.js                          (sửa — interceptors)
│   └── auth.service.js                 ★ MỚI
├── pages/
│   ├── LoginPage.jsx                   ★ MỚI
│   ├── LoginPage.css                   ★ MỚI
│   ├── RegisterPage.jsx                ★ MỚI
│   ├── RegisterPage.css                ★ MỚI
│   ├── DashboardPage.jsx               ★ MỚI
│   ├── DashboardPage.css               ★ MỚI
│   └── NotFoundPage.jsx                ★ MỚI
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx               ★ MỚI
│   │   ├── AppLayout.css               ★ MỚI
│   │   ├── Header.jsx                  ★ MỚI
│   │   └── Sidebar.jsx                 ★ MỚI
│   └── common/
│       ├── ProtectedRoute.jsx          ★ MỚI
│       ├── Button.jsx                  ★ MỚI
│       ├── Button.css                  ★ MỚI
│       ├── Input.jsx                   ★ MỚI
│       ├── Input.css                   ★ MỚI
│       └── LoadingSpinner.jsx          ★ MỚI
```

---

## Tiêu chí hoàn thành

- [X] Trang Login hiển thị đẹp, responsive, có animation
- [X] Trang Register hiển thị đẹp, có password strength indicator
- [X] Đăng ký thành công → redirect `/dashboard`
- [X] Đăng nhập thành công → redirect `/dashboard`
- [X] Đăng xuất → redirect `/login`, xóa tokens
- [X] Truy cập `/dashboard` khi chưa login → redirect `/login`
- [X] Refresh page khi đã login → vẫn giữ session (không bị logout)
- [X] Token hết hạn → tự động refresh, không bị logout
- [X] Sidebar hiển thị đúng menu theo role
- [X] Toast notifications hiển thị khi login/register thành công/thất bại
- [X] Error messages hiển thị inline trên form khi validation lỗi
