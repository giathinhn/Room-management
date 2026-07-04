# Plan 22 — Hồ sơ cá nhân (Personal Profile Page)

> **Mục tiêu**: Xây dựng trang Hồ sơ cá nhân (Profile Page) toàn diện cho người dùng, cho phép xem và cập nhật thông tin cá nhân (Họ tên, Số điện thoại, Phòng ban, Ảnh đại diện), đổi mật khẩu bảo mật và xem thống kê lịch sử đặt phòng họp của bản thân.
> **Thời lượng ước tính**: 2–3 giờ
> **Phụ thuộc**: Plan 02 (Auth Frontend), Plan 04 (Booking System)
> **Độc lập với**: Plan 05, Plan 06, Plan 07, Plan 08, Plan 10, Plan 11, Plan 12, Plan 13, Plan 14, Plan 15, Plan 16, Plan 17, Plan 18, Plan 19, Plan 20, Plan 21

---

## Tổng quan

Sau khi hoàn thành plan này:

- Người dùng có thể click vào mục "Hồ sơ cá nhân" từ Menu dropdown ở Header để điều hướng đến `/profile`.
- **Trang Hồ sơ cá nhân** được thiết kế hiện đại, premium với giao diện thẻ gồm các tab:
  1. **Thông tin cá nhân**: Cập nhật Họ tên, Số điện thoại, Phòng ban. Email và Vai trò được hiển thị ở chế độ đọc (Read-only) với icon khóa.
  2. **Đổi mật khẩu**: Form đổi mật khẩu yêu cầu nhập Mật khẩu hiện tại, Mật khẩu mới và Xác nhận mật khẩu mới kèm thước đo độ mạnh mật khẩu (Password Strength Meter).
  3. **Thống kê & Lịch sử đặt phòng**: Hiển thị các thẻ chỉ số (Tổng số booking, Tỷ lệ duyệt, Số giờ họp) kèm biểu đồ phân bổ trạng thái cuộc họp và danh sách các cuộc họp gần nhất của chính user.
- Hỗ trợ **Tải lên ảnh đại diện (Avatar Upload)**: Sử dụng thư viện `multer` ở backend để lưu trữ ảnh vào thư mục tĩnh của server, hiển thị preview tức thời trên giao diện frontend và cập nhật avatar trên Header ngay khi thay đổi thành công.

---

## 🗄️ DATABASE & SCHEMA CHANGES

### 1. Cập nhật `backend/prisma/schema.prisma`

Bổ sung các trường thông tin cá nhân vào model `User`:

```prisma
model User {
  // ... các fields hiện có
  phone      String?  @db.VarChar(20) @map("phone")
  avatar     String?  @db.VarChar(255) @map("avatar") // Lưu đường dẫn tương đối của ảnh, VD: "/uploads/avatars/abc.jpg"
  department String?  @db.VarChar(100) @map("department") // Phòng ban/Lớp học
  
  // ... các relations hiện có
}
```

### 2. Chạy lệnh Migration

Tại thư mục `backend`, cài đặt `multer` và chạy migration:

```bash
# Cài đặt multer cho việc upload file ở backend
npm install multer

# Chạy migration để cập nhật database
npx prisma migrate dev --name add_user_profile_fields
```

---

## ⚙️ BACKEND IMPLEMENTATION

### 1. Thiết lập thư mục upload tĩnh & Middleware Multer

Tạo middleware cấu hình upload file giới hạn dung lượng ảnh đại diện tối đa 2MB và chỉ nhận file hình ảnh (`jpg`, `jpeg`, `png`, `webp`).

**`backend/src/middlewares/upload.middleware.js` [NEW]**:

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

// Tạo thư mục lưu trữ nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Định dạng file không hợp lệ. Chỉ chấp nhận ảnh JPEG, JPG, PNG, WEBP.'));
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // Giới hạn 2MB
});

module.exports = { uploadAvatar };
```

Cấu hình route tĩnh cho Express phục vụ các file upload trong `backend/src/server.js`:

**`backend/src/server.js` [MODIFY]**:

```javascript
// Thêm import path ở đầu file nếu chưa có
const path = require('path');

// ... cấu hình middleware khác
// Phục vụ thư mục uploads dạng static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

### 2. Cập nhật Repository người dùng

Cần cập nhật `select` của userRepository để trả về thêm `phone`, `avatar`, `department`.

**`backend/src/repositories/user.repository.js` [MODIFY]**:

```javascript
const userRepository = {
  // Cập nhật findById:
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        phone: true,
        avatar: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  // Cập nhật update:
  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        phone: true,
        avatar: true,
        department: true,
        updatedAt: true,
      },
    });
  }
};
```

### 3. Cập nhật Profile Service & Validators

Cập nhật hàm `updateProfile` nhận thêm `phone`, `avatar`, `department`. Đồng thời viết thêm logic lấy thống kê cá nhân.

**`backend/src/services/profile.service.js` [MODIFY]**:

```javascript
const prisma = require('../config/database');

const profileService = {
  // ... các hàm getProfile, changePassword giữ nguyên
  
  async updateProfile(userId, { fullName, phone, avatar, department }) {
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (department !== undefined) updateData.department = department;

    const user = await userRepository.update(userId, updateData);
    if (!user) throw ApiError.notFound('Không tìm thấy người dùng');
    return user;
  },

  async getPersonalStats(userId) {
    const [bookingsCount, bookings] = await Promise.all([
      // Thống kê đếm số lượng theo trạng thái
      prisma.booking.groupBy({
        by: ['status'],
        where: { userId },
        _count: true
      }),
      // Danh sách 5 booking gần nhất
      prisma.booking.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: 5,
        include: { room: true }
      })
    ]);

    // Tính tổng số giờ họp của các booking đã duyệt (approved)
    const approvedBookings = await prisma.booking.findMany({
      where: { userId, status: 'approved' },
      select: { startTime: true, endTime: true }
    });

    let totalHours = 0;
    approvedBookings.forEach(b => {
      const diffMs = new Date(b.endTime) - new Date(b.startTime);
      totalHours += diffMs / (1000 * 60 * 60);
    });

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      total: 0
    };

    bookingsCount.forEach(item => {
      stats[item.status] = item._count;
      stats.total += item._count;
    });

    return {
      stats,
      totalMeetingHours: Math.round(totalHours * 10) / 10,
      recentBookings: bookings
    };
  }
};
```

Cập nhật Zod validator để validate dữ liệu gửi lên:

**`backend/src/validators/auth.validator.js` [MODIFY]**:

```javascript
const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  avatar: z.string().max(255).nullable().optional(),
});
```

### 4. Đăng ký API Routes

Cập nhật route profile và bổ sung các endpoint mới.

**`backend/src/routes/profile.routes.js` [MODIFY]**:

```javascript
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../validators/auth.validator');
const { uploadAvatar } = require('../middlewares/upload.middleware');

// Route tải lên avatar
router.post(
  '/avatar',
  authenticate,
  uploadAvatar.single('avatar'),
  profileController.uploadAvatar
);

// Route lấy thống kê cá nhân
router.get('/stats', authenticate, profileController.getStats);
```

**`backend/src/controllers/profile.controller.js` [MODIFY]**:

```javascript
const profileController = {
  // ... các handlers hiện có getProfile, updateProfile, changePassword

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('Vui lòng chọn ảnh để tải lên');
      }
    
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      // Cập nhật ngay vào database cho user
      const user = await profileService.updateProfile(req.user.id, { avatar: avatarUrl });

      return res.json({
        success: true,
        message: 'Tải lên ảnh đại diện thành công',
        data: {
          avatar: user.avatar
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const statsData = await profileService.getPersonalStats(req.user.id);
      return res.json({
        success: true,
        data: statsData
      });
    } catch (err) {
      next(err);
    }
  }
};
```

---

## 🎨 FRONTEND IMPLEMENTATION

### 1. Cập nhật Auth Context & API Service

Đồng bộ thông tin user mới từ API cập nhật thông tin trong context.

**`frontend/src/services/auth.service.js` [MODIFY]**:

```javascript
// Cập nhật API calls
export const updateProfile = async (profileData) => {
  const { data } = await api.put('/profile', profileData);
  return data; // Trả về thông tin user mới
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await api.post('/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
};

export const getPersonalStats = async () => {
  const { data } = await api.get('/profile/stats');
  return data;
};
```

**`frontend/src/context/AuthContext.jsx` [MODIFY]**:

Cung cấp thêm hàm `refreshUser` để reload thông tin cá nhân trên header khi cập nhật:

```javascript
export const AuthProvider = ({ children }) => {
  // ... code hiện tại
  
  const refreshUser = async () => {
    try {
      const { data } = await getProfile();
      setUser(data);
    } catch (err) {
      console.error("Failed to refresh user data", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

Cập nhật component `Header.jsx` để hiển thị ảnh đại diện thực tế thay vì ký tự viết tắt nếu có `user.avatar`:

**`frontend/src/components/layout/Header.jsx` [MODIFY]**:

```jsx
// Sử dụng thẻ img nếu user có avatar
<div className="user-avatar">
  {user?.avatar ? (
    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`} alt="Avatar" className="avatar-img" />
  ) : (
    getInitials(user?.fullName)
  )}
</div>
```

*Thiết kế CSS cho `.avatar-img` đảm bảo hình tròn, co giãn tốt (`object-fit: cover`).*

### 2. Tạo Trang Profile (Giao diện)

**`frontend/src/pages/ProfilePage.jsx` [NEW]**:
Tạo trang profile với giao diện chia làm 2 phần chính:

- **Bên trái (hoặc bên trên ở Mobile)**: Card người dùng chứa ảnh đại diện hình tròn lớn, nút tải lên ảnh mới (hover effect đổi ảnh), Họ tên, Email, Vai trò, Phòng ban hiển thị nổi bật.
- **Bên phải**: Tabs chuyển đổi:
  - **Tab 1: Thông tin**: Các trường `Họ tên`, `Số điện thoại`, `Phòng ban` có thể sửa đổi + Nút lưu. Trạng thái `Email` và `Vai trò` hiển thị kèm icon khóa, tooltip "Không thể chỉnh sửa trường này".
  - **Tab 2: Đổi mật khẩu**: 3 trường mật khẩu hiện tại, mới, xác nhận. Validation khớp mật khẩu và hiển thị thanh báo độ mạnh (Yếu - Đỏ, Trung bình - Vàng, Mạnh - Xanh lá).
  - **Tab 3: Thống kê & Lịch sử**: Hiển thị 3 cards chính (Tổng số booking, Tổng giờ họp, Tỷ lệ được duyệt) và danh sách 5 cuộc họp đã đăng ký gần nhất hiển thị dưới dạng timeline hoặc table mini đẹp mắt kèm nhãn màu trạng thái.

**`frontend/src/pages/ProfilePage.css` [NEW]**:
Thiết kế theo phong cách Glassmorphism và tối ưu Dark Mode sử dụng biến CSS:

- Box shadow tinh tế, border-radius lớn (16px).
- Nút bấm với micro-animations (scale nhẹ khi hover).
- Avatar hover overlay: Hiện icon máy ảnh kèm text "Thay ảnh" mượt mà.
- Thiết kế Responsive Grid (2 cột trên Desktop, 1 cột trên Mobile/Tablet).

### 3. Đăng ký Route trong App

**`frontend/src/App.jsx` [MODIFY]**:

```jsx
import ProfilePage from './pages/ProfilePage';
// ...
<Route path="/profile" element={<ProfilePage />} />
```

---

## 🧪 VERIFICATION PLAN

### Automated Tests

Thực hiện chạy kiểm thử backend API:

```bash
# Test upload avatar không hợp lệ (sai định dạng file, dung lượng > 2MB) -> Phải báo lỗi 400.
# Test đổi mật khẩu: sai mật khẩu hiện tại -> Phải báo lỗi 400.
# Test xem thông tin profile -> Trả về đủ các trường mới.
```

### Manual Verification

1. **Thay đổi Avatar**: Tải lên 1 file ảnh PNG lớn hơn 2MB -> Báo lỗi. Tải lên file ảnh hợp lệ -> Avatar góc trên bên phải ở Header và trên trang Profile lập tức thay đổi đồng bộ.
2. **Cập nhật thông tin**: Đổi Họ tên, số điện thoại -> Bấm lưu -> F5 trình duyệt -> Dữ liệu vẫn được giữ nguyên.
3. **Đổi mật khẩu**:
   - Nhập mật khẩu hiện tại sai -> Báo lỗi toast.
   - Nhập mật khẩu khớp, đúng chuẩn -> Đăng xuất và đăng nhập lại bằng mật khẩu mới thành công.
4. **Thống kê**: Đăng ký 1 cuộc họp mới và duyệt nó -> Số lượng thống kê cuộc họp và tổng số giờ họp tự động tăng tương ứng.

---

## 📋 CHECKLIST HOÀN THÀNH

- [X] Cập nhật database schema của model `User` trong Prisma và chạy migration thành công.
- [X] Thiết lập thư mục upload tĩnh, cấu hình route static cho Express và viết middleware upload `multer` bảo mật.
- [X] Viết API upload avatar (`POST /api/profile/avatar`) và test thành công.
- [X] Cập nhật API cập nhật profile (`PUT /api/profile`) và API lấy thống kê cá nhân (`GET /api/profile/stats`).
- [X] Thiết kế trang frontend `ProfilePage.jsx` cùng stylesheet CSS responsive, hỗ trợ Dark Mode và light Mode.
- [X] Tích hợp API đổi thông tin, tải avatar lên Header, đổi mật khẩu và xem thống kê trực quan.
- [X] Kiểm thử luồng hoạt động thành công cả backend và frontend.
