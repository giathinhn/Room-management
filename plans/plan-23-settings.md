# Plan 23 — Cài đặt (Settings Management)

> **Mục tiêu**: Xây dựng hệ thống quản lý Cài đặt phân quyền toàn diện bao gồm: (1) Cài đặt cá nhân (tùy chỉnh nhận thông báo email/in-app, cài đặt ngôn ngữ mặc định, cấu hình chế độ xem calendar mặc định) và (2) Cấu hình hệ thống dành cho quản trị viên (cấu hình giờ hành chính làm việc, giới hạn thời gian đặt phòng tối đa/tối thiểu, số ngày được đặt trước và thời gian giải phóng phòng tự động No-Show).
> **Thời lượng ước tính**: 2–3 giờ
> **Phụ thuộc**: Plan 04 (Booking System), Plan 11 (In-app Notifications), Plan 14 (i18n), Plan 18 (Dark Mode), Plan 21 (Auto-release)
> **Độc lập với**: Plan 05, Plan 06, Plan 07, Plan 08, Plan 10, Plan 12, Plan 13, Plan 15, Plan 16, Plan 17, Plan 19, Plan 20

---

## Tổng quan

Sau khi hoàn thành plan này:

- Ứng dụng hỗ trợ trang `/settings` liên kết trực tiếp từ dropdown ở Header.
- **Trang Cài đặt** hiển thị dưới dạng Tab Panel:
  1. **Cấu hình cá nhân (Mọi User)**:
     - **Tùy chọn nhận thông báo**: Bật/tắt nhận Email hoặc In-app notification cho từng loại trạng thái booking (Approved, Rejected, Cancelled, Reminder).
     - **Tùy chọn hiển thị**: Chọn ngôn ngữ mặc định (Tiếng Việt / English), chủ đề mặc định (Sáng / Tối / Tự động đồng bộ hệ thống) và chế độ xem lịch mặc định (Ngày / Tuần / Tháng).
  2. **Cấu hình hệ thống (Chỉ Admin)**:
     - Cho phép chỉnh sửa các hằng số vận hành của hệ thống thay vì hardcode:
       - Giờ làm việc hành chính (Giờ bắt đầu, Giờ kết thúc).
       - Số ngày tối đa được đặt trước (ví dụ: 30 ngày).
       - Thời lượng đặt tối thiểu và tối đa (phút).
       - Hạn chót check-in phòng họp trước khi tự động hủy No-Show (phút).
       - Toggle cho phép/không cho phép người dùng tự hủy lịch khi đã được duyệt.
- **Tích hợp logic động**:
  - Backend validation khi đặt phòng họp sẽ tự động đọc từ bảng `SystemSettings` thay vì dùng hằng số cố định.
  - Frontend sẽ gọi API lấy cấu hình hệ thống khi tải trang đặt phòng để thiết lập min/max date, min/max time và các ràng buộc đầu vào một cách linh động.
  - Khi user đăng nhập, hệ thống tự động thiết lập ngôn ngữ hiển thị (i18n) và chủ đề giao diện (Theme) theo cấu hình lưu trong database của user đó.

---

## 🗄️ DATABASE & SCHEMA CHANGES

### 1. Cập nhật `backend/prisma/schema.prisma`

Định nghĩa 2 bảng mới `UserSettings` và `SystemSettings`:

```prisma
model User {
  // ... các fields hiện có
  settings     UserSettings?
}

model UserSettings {
  id                    String   @id @default(uuid())
  userId                String   @unique @map("user_id")
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Trạng thái nhận thông báo Email
  emailNotifyApproved   Boolean  @default(true) @map("email_notify_approved")
  emailNotifyRejected   Boolean  @default(true) @map("email_notify_rejected")
  emailNotifyCancelled  Boolean  @default(true) @map("email_notify_cancelled")
  emailNotifyReminder   Boolean  @default(true) @map("email_notify_reminder")
  
  // Trạng thái nhận thông báo Trong app
  inAppNotifyApproved   Boolean  @default(true) @map("in_app_notify_approved")
  inAppNotifyRejected   Boolean  @default(true) @map("in_app_notify_rejected")
  inAppNotifyCancelled  Boolean  @default(true) @map("in_app_notify_cancelled")
  inAppNotifyReminder   Boolean  @default(true) @map("in_app_notify_reminder")
  
  // Tùy chọn hiển thị giao diện
  language              String   @default("vi") @db.VarChar(5)
  theme                 String   @default("system") @db.VarChar(20) // "light" | "dark" | "system"
  defaultCalendarView   String   @default("timeGridWeek") @db.VarChar(20) @map("default_calendar_view") // "timeGridDay" | "timeGridWeek" | "dayGridMonth"
  
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  @@map("user_settings")
}

model SystemSettings {
  id                    Int      @id @default(1)
  workHourStart         String   @default("07:00") @db.VarChar(5) @map("work_hour_start") // Định dạng "HH:MM"
  workHourEnd           String   @default("22:00") @db.VarChar(5) @map("work_hour_end")
  maxBookingDaysAhead   Int      @default(30) @map("max_booking_days_ahead")
  minBookingDurationMin Int      @default(30) @map("min_booking_duration_min")
  maxBookingDurationMin Int      @default(480) @map("max_booking_duration_min") // 8 tiếng
  noShowReleaseTimeMin  Int      @default(15) @map("no_show_release_time_min") // Hủy sau X phút
  allowCancelApproved   Boolean  @default(true) @map("allow_cancel_approved")
  updatedAt             DateTime @updatedAt @map("updated_at")

  @@map("system_settings")
}
```

### 2. Cập nhật file Seed và chạy Migration

Bổ sung khởi tạo cấu hình hệ thống mặc định vào file `backend/prisma/seed.js`.

**`backend/prisma/seed.js` [MODIFY]**:

```javascript
// Thêm khởi tạo SystemSettings mặc định
await prisma.systemSettings.upsert({
  where: { id: 1 },
  update: {},
  create: {
    id: 1,
    workHourStart: "07:00",
    workHourEnd: "22:00",
    maxBookingDaysAhead: 30,
    minBookingDurationMin: 30,
    maxBookingDurationMin: 480,
    noShowReleaseTimeMin: 15,
    allowCancelApproved: true
  }
});
```

Chạy migration tạo bảng:

```bash
npx prisma migrate dev --name add_settings_tables
```

---

## ⚙️ BACKEND IMPLEMENTATION

### 1. Tự động tạo cấu hình User khi đăng ký tài khoản

Khi tài khoản được tạo mới, cần chèn bản ghi cài đặt mặc định vào bảng `user_settings`.

**`backend/src/services/auth.service.js` [MODIFY]**:

```javascript
// Cập nhật hàm register để tự tạo UserSettings
const user = await prisma.user.create({
  data: {
    email,
    passwordHash,
    fullName,
    settings: {
      create: {} // Tạo bản ghi settings với giá trị mặc định của Prisma schema
    }
  }
});
```

### 2. API Routes & Controllers cho Cài đặt

Tạo controller xử lý CRUD cấu hình của người dùng và hệ thống.

**`backend/src/routes/settings.routes.js` [NEW]**:

```javascript
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Routes cấu hình cá nhân
router.get('/user', authenticate, settingsController.getUserSettings);
router.put('/user', authenticate, settingsController.updateUserSettings);

// Routes cấu hình hệ thống
router.get('/system', authenticate, settingsController.getSystemSettings); // Public read cho user đã auth
router.put('/system', authenticate, authorize(['admin']), settingsController.updateSystemSettings); // Chỉ admin được sửa

module.exports = router;
```

Đăng ký route vào file định tuyến tổng:

**`backend/src/routes/index.js` [MODIFY]**:

```javascript
router.use('/settings', require('./settings.routes'));
```

**`backend/src/controllers/settings.controller.js` [NEW]**:

```javascript
const settingsService = require('../services/settings.service');

const settingsController = {
  async getUserSettings(req, res, next) {
    try {
      const settings = await settingsService.getUserSettings(req.user.id);
      return res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  async updateUserSettings(req, res, next) {
    try {
      const settings = await settingsService.updateUserSettings(req.user.id, req.body);
      return res.json({ success: true, message: 'Cập nhật cài đặt thành công', data: settings });
    } catch (err) {
      next(err);
    }
  },

  async getSystemSettings(req, res, next) {
    try {
      const settings = await settingsService.getSystemSettings();
      return res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  async updateSystemSettings(req, res, next) {
    try {
      const settings = await settingsService.updateSystemSettings(req.body);
      return res.json({ success: true, message: 'Cập nhật cấu hình hệ thống thành công', data: settings });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = settingsController;
```

**`backend/src/services/settings.service.js` [NEW]**:

```javascript
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

const settingsService = {
  async getUserSettings(userId) {
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    // Lazy creation nếu chưa có
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId }
      });
    }
    return settings;
  },

  async updateUserSettings(userId, data) {
    // Chỉ cho phép update các field hợp lệ
    const allowedFields = [
      'emailNotifyApproved', 'emailNotifyRejected', 'emailNotifyCancelled', 'emailNotifyReminder',
      'inAppNotifyApproved', 'inAppNotifyRejected', 'inAppNotifyCancelled', 'inAppNotifyReminder',
      'language', 'theme', 'defaultCalendarView'
    ];
  
    const updateData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    return prisma.userSettings.update({
      where: { userId },
      data: updateData
    });
  },

  async getSystemSettings() {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      // Tự phục hồi nếu bị mất dòng id=1 trong DB
      return prisma.systemSettings.create({
        data: { id: 1 }
      });
    }
    return settings;
  },

  async updateSystemSettings(data) {
    const allowedFields = [
      'workHourStart', 'workHourEnd', 'maxBookingDaysAhead',
      'minBookingDurationMin', 'maxBookingDurationMin', 'noShowReleaseTimeMin',
      'allowCancelApproved'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // Validate định dạng giờ HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (updateData.workHourStart && !timeRegex.test(updateData.workHourStart)) {
      throw ApiError.badRequest('Giờ bắt đầu làm việc không đúng định dạng HH:MM');
    }
    if (updateData.workHourEnd && !timeRegex.test(updateData.workHourEnd)) {
      throw ApiError.badRequest('Giờ kết thúc làm việc không đúng định dạng HH:MM');
    }

    return prisma.systemSettings.update({
      where: { id: 1 },
      data: updateData
    });
  }
};

module.exports = settingsService;
```

### 3. Tích hợp cấu hình động vào Nghiệp vụ đặt phòng & Nhắc nhở

Cần chỉnh sửa phần logic kiểm tra ràng buộc thời gian khi tạo phòng họp và scheduler check-in:

**`backend/src/services/booking.service.js` [MODIFY]**:

* **Trong hàm tạo booking (`createBooking`)**:

  * Đọc `SystemSettings` từ database:
    ```javascript
    const sysSettings = await settingsService.getSystemSettings();
    ```
  * Sử dụng các giá trị cấu hình thay vì giá trị hardcode để kiểm tra trùng:
    * Giờ hành chính: So khớp `startTime` và `endTime` với `sysSettings.workHourStart` và `sysSettings.workHourEnd`.
    * Đặt trước tối đa: So khớp `startTime` có vượt quá `sysSettings.maxBookingDaysAhead` ngày kể từ hôm nay không.
    * Thời lượng tối thiểu/tối đa: So khớp hiệu số thời gian họp có nằm trong khoảng `sysSettings.minBookingDurationMin` và `sysSettings.maxBookingDurationMin` không.
* **Trong background job quét giải phóng phòng (`releaseNoShowBookings`)**:

  * Lấy `sysSettings.noShowReleaseTimeMin` làm giới hạn hủy check-in.
    ```javascript
    const sysSettings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const releaseLimitMinutes = sysSettings?.noShowReleaseTimeMin || 15;
    const limitTime = new Date(now.getTime() - releaseLimitMinutes * 60 * 1000);
    ```
* **Trong dịch vụ thông báo (Email + In-app)**:

  * Trước khi gửi Email hoặc In-app notification cho user, kiểm tra cài đặt thông báo của user đó trong `UserSettings`. Ví dụ:
    ```javascript
    const userSettings = await prisma.userSettings.findUnique({ where: { userId } });
    if (type === 'booking_approved' && !userSettings?.inAppNotifyApproved) return; // Bỏ qua nếu user tắt nhận
    ```

---

## 🎨 FRONTEND IMPLEMENTATION

### 1. Viết API Service cho Settings

**`frontend/src/services/settings.service.js` [NEW]**:

```javascript
import api from './api';

export const getUserSettings = async () => {
  const { data } = await api.get('/settings/user');
  return data;
};

export const updateUserSettings = async (settingsData) => {
  const { data } = await api.put('/settings/user', settingsData);
  return data;
};

export const getSystemSettings = async () => {
  const { data } = await api.get('/settings/system');
  return data;
};

export const updateSystemSettings = async (systemData) => {
  const { data } = await api.put('/settings/system', systemData);
  return data;
};
```

### 2. Tạo Trang Settings (Giao diện)

**`frontend/src/pages/SettingsPage.jsx` [NEW]**:
Xây dựng giao diện trang cài đặt với Sidebar tab:

- **Tab 1: Thông báo (Notification Settings)**:
  - Chia làm 2 nhóm: **Email Notifications** và **In-App Notifications**.
  - Mỗi nhóm có các switch toggle cho: *Lịch đặt được duyệt*, *Lịch đặt bị từ chối*, *Lịch đặt bị hủy*, *Nhắc nhở họp trước 15 phút*.
- **Tab 2: Giao diện (Display Settings)**:
  - **Ngôn ngữ**: Dropdown chọn Tiếng Việt / English. Thay đổi sẽ kích hoạt `i18n.changeLanguage(lang)` đồng thời gửi request API lưu cài đặt.
  - **Giao diện**: Dropdown/Selector chọn "Sáng", "Tối", "Tự động (Đồng bộ hệ thống)". Liên kết thay đổi với `ThemeContext`.
  - **Chế độ xem mặc định**: Dropdown chọn "Lịch ngày", "Lịch tuần", "Lịch tháng". Lưu cấu hình để khi user truy cập `/calendar` sẽ tự động hiển thị chế độ tương ứng.
- **Tab 3: Quản trị hệ thống (System Settings) - Chỉ hiển thị khi role = 'admin'**:
  - Grid Form chứa các trường nhập liệu:
    - Bắt đầu giờ hành chính (VD: "08:00") & Kết thúc giờ hành chính (VD: "18:00").
    - Số ngày đặt trước tối đa (VD: 30).
    - Thời gian họp tối thiểu / tối đa (phút).
    - Thời gian hủy tự động khi trễ Check-in (phút).
    - Nút lưu cấu hình hệ thống.

**`frontend/src/pages/SettingsPage.css` [NEW]**:

- Thiết kế layout chia cột hiện đại.
- Switch toggle (slide button) mượt mà với hiệu ứng chuyển màu khi active.
- Hỗ trợ tốt Dark Mode qua CSS variables (`--bg-secondary`, `--border-color`).

### 3. Đăng ký Route trong App

**`frontend/src/App.jsx` [MODIFY]**:

```jsx
import SettingsPage from './pages/SettingsPage';
// ...
<Route path="/settings" element={<SettingsPage />} />
```

---

## 🧪 VERIFICATION PLAN

### Automated Tests

```bash
# Test API get/put settings:
# Đăng nhập -> Gửi request GET /api/settings/user -> Phải trả về Object settings của user.
# Gửi request PUT /api/settings/system từ tài khoản role 'user' -> Phải trả về lỗi 403 Forbidden.
# Gửi request PUT /api/settings/system từ tài khoản role 'admin' -> Phải cập nhật thành công.
```

### Manual Verification

1. **Kiểm tra đồng bộ giao diện & ngôn ngữ**:
   - Chuyển ngôn ngữ sang English ở trang Settings -> Toàn bộ text đổi sang Tiếng Anh. Refresh trang -> Vẫn giữ cấu hình Tiếng Anh.
   - Chuyển Theme sang Dark -> Giao diện chuyển tối. Refresh trang -> Vẫn giữ theme tối.
2. **Kiểm tra tắt nhận thông báo**:
   - Tắt Email notification khi booking được duyệt -> Gửi yêu cầu duyệt booking -> User không nhận được email chúc mừng/thông tin booking nữa.
3. **Kiểm tra Cấu hình hệ thống (Admin)**:
   - Admin đổi giờ hành chính thành `09:00 - 17:00` và lưu lại.
   - User thường truy cập đặt phòng họp -> Thử đặt lúc `08:00` -> Hệ thống frontend và backend chặn và hiển thị thông điệp lỗi: "Chỉ cho phép đặt phòng trong giờ hành chính từ 09:00 đến 17:00".
   - Admin đổi thời gian hủy check-in No-Show thành `5 phút`.
   - Một booking được duyệt bắt đầu lúc 10:00 -> Đến 10:06 chưa check-in -> Hệ thống tự động hủy và giải phóng phòng.

---

## 📋 CHECKLIST HOÀN THÀNH

- [X] Tạo bảng `UserSettings` và `SystemSettings` trong cơ sở dữ liệu và migrate thành công.
- [X] Cập nhật hàm tạo tài khoản tự động khởi tạo UserSettings.
- [X] Viết API routes và controller xử lý GET/PUT cấu hình cá nhân và hệ thống.
- [X] Tích hợp các ràng buộc cấu hình hệ thống động vào backend validator khi đặt phòng họp.
- [X] Thiết kế trang `SettingsPage.jsx` và liên kết với i18n, ThemeContext, API.
- [X] Đồng bộ hóa hiển thị mặc định của trang calendar theo cài đặt người dùng.
- [X] Kiểm thử toàn diện phân quyền Admin, tính năng cập nhật cấu hình và phản hồi thực tế của hệ thống.
- [X] Hỗ trợ Dark Mode và Light Mode
