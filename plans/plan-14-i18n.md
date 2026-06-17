# Plan 14 — Đa ngôn ngữ (i18n)

> **Mục tiêu**: Hỗ trợ 2 ngôn ngữ (Tiếng Việt + English) cho toàn bộ frontend. Backend trả error codes thay vì messages.
> **Thời lượng ước tính**: 2–3 giờ
> **Phụ thuộc**: Nên làm sau khi frontend ổn định (sau Plan 02, 03, 04 ít nhất)
> **Độc lập với**: Tất cả plan khác (nhưng nên làm cuối vì phải dịch toàn bộ UI text)

---

## Tổng quan

Sau khi hoàn thành:
- Toggle 🇻🇳/🇬🇧 ở header để chuyển ngôn ngữ
- Tất cả text trên UI đều thay đổi theo ngôn ngữ
- Ngôn ngữ lưu vào localStorage, giữ lại khi refresh
- Backend trả error codes → frontend map sang ngôn ngữ

---

## PHẦN 1: BACKEND

### 1. Error Code Convention

**Sửa backend trả error code thay vì message text:**

```js
// TRƯỚC (hiện tại):
throw new ApiError(409, 'Email already exists');

// SAU:
throw new ApiError(409, 'EMAIL_ALREADY_EXISTS');
// hoặc:
throw new ApiError(409, { code: 'EMAIL_ALREADY_EXISTS', message: 'Email already exists' });
```

**`src/utils/errorCodes.js`** — Danh sách error codes:

```js
module.exports = {
  // Auth
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Rooms
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_NAME_EXISTS: 'ROOM_NAME_EXISTS',
  ROOM_INACTIVE: 'ROOM_INACTIVE',

  // Bookings
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  BOOKING_PAST_TIME: 'BOOKING_PAST_TIME',
  BOOKING_OUTSIDE_HOURS: 'BOOKING_OUTSIDE_HOURS',
  BOOKING_TOO_SHORT: 'BOOKING_TOO_SHORT',
  BOOKING_TOO_LONG: 'BOOKING_TOO_LONG',
  BOOKING_TOO_FAR_AHEAD: 'BOOKING_TOO_FAR_AHEAD',
  BOOKING_INVALID_STATUS: 'BOOKING_INVALID_STATUS',
  BOOKING_NOT_OWNER: 'BOOKING_NOT_OWNER',

  // Comments
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  COMMENT_EDIT_TIMEOUT: 'COMMENT_EDIT_TIMEOUT',

  // Templates
  TEMPLATE_LIMIT_REACHED: 'TEMPLATE_LIMIT_REACHED',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};
```

**Sửa error.middleware.js** — format error response:
```js
res.status(err.statusCode).json({
  success: false,
  error: {
    code: err.code || 'INTERNAL_ERROR',
    message: err.message, // Fallback message (English)
    details: err.details,  // Validation details (nếu có)
  }
});
```

---

## PHẦN 2: FRONTEND

### 2. Cài dependencies

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

### 3. i18n Config

**`src/i18n/index.js`**:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import vi from './locales/vi.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: 'vi',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

**Import vào `src/main.jsx`**:
```js
import './i18n';
```

### 4. Translation Files

**`src/i18n/locales/vi.json`**:

```json
{
  "common": {
    "appName": "Quản lý Phòng họp",
    "save": "Lưu",
    "cancel": "Hủy",
    "delete": "Xóa",
    "edit": "Sửa",
    "create": "Tạo mới",
    "search": "Tìm kiếm",
    "filter": "Lọc",
    "loading": "Đang tải...",
    "noData": "Không có dữ liệu",
    "confirm": "Xác nhận",
    "back": "Quay lại",
    "submit": "Gửi",
    "close": "Đóng",
    "all": "Tất cả",
    "actions": "Thao tác"
  },
  "auth": {
    "login": "Đăng nhập",
    "register": "Đăng ký",
    "logout": "Đăng xuất",
    "email": "Email",
    "password": "Mật khẩu",
    "confirmPassword": "Xác nhận mật khẩu",
    "fullName": "Họ tên",
    "forgotPassword": "Quên mật khẩu?",
    "noAccount": "Chưa có tài khoản?",
    "hasAccount": "Đã có tài khoản?",
    "loginSuccess": "Đăng nhập thành công",
    "registerSuccess": "Đăng ký thành công",
    "logoutSuccess": "Đã đăng xuất"
  },
  "rooms": {
    "title": "Phòng họp",
    "addRoom": "Thêm phòng",
    "editRoom": "Sửa phòng",
    "deleteRoom": "Xóa phòng",
    "name": "Tên phòng",
    "capacity": "Sức chứa",
    "location": "Vị trí",
    "equipment": "Thiết bị",
    "available": "Phòng trống",
    "people": "người",
    "confirmDelete": "Bạn có chắc muốn xóa phòng {{name}}?"
  },
  "bookings": {
    "title": "Lịch đặt phòng",
    "create": "Đặt phòng",
    "detail": "Chi tiết đặt phòng",
    "approve": "Duyệt",
    "reject": "Từ chối",
    "cancelBooking": "Hủy đặt phòng",
    "meetingTitle": "Tiêu đề cuộc họp",
    "startTime": "Giờ bắt đầu",
    "endTime": "Giờ kết thúc",
    "date": "Ngày",
    "duration": "Thời lượng",
    "bookedBy": "Người đặt",
    "approvedBy": "Người duyệt",
    "rejectionReason": "Lý do từ chối",
    "status": {
      "pending": "Chờ duyệt",
      "approved": "Đã duyệt",
      "rejected": "Từ chối",
      "cancelled": "Đã hủy"
    },
    "selectRoom": "Chọn phòng",
    "selectTime": "Chọn thời gian",
    "conflict": "Trùng lịch",
    "conflictMessage": "Phòng đã có lịch trong khung giờ này"
  },
  "calendar": {
    "title": "Lịch đặt phòng",
    "day": "Ngày",
    "week": "Tuần",
    "month": "Tháng",
    "today": "Hôm nay",
    "allRooms": "Tất cả phòng"
  },
  "notifications": {
    "title": "Thông báo",
    "markAllRead": "Đọc tất cả",
    "noNotifications": "Không có thông báo",
    "viewAll": "Xem tất cả",
    "types": {
      "booking_approved": "Booking đã được duyệt",
      "booking_rejected": "Booking bị từ chối",
      "booking_cancelled": "Booking đã bị hủy",
      "booking_reminder": "Nhắc lịch họp",
      "new_booking_pending": "Có booking mới cần duyệt"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "totalBookings": "Tổng booking",
    "approved": "Đã duyệt",
    "rejected": "Từ chối",
    "pending": "Chờ duyệt",
    "roomUsage": "Tần suất sử dụng phòng",
    "peakHours": "Giờ cao điểm",
    "topUsers": "Top người đặt",
    "trends": "Xu hướng"
  },
  "templates": {
    "title": "Mẫu đặt phòng",
    "create": "Tạo mẫu",
    "bookNow": "Đặt ngay",
    "saveAsTemplate": "Lưu làm mẫu",
    "limitReached": "Đã đạt giới hạn 10 mẫu",
    "templateName": "Tên mẫu"
  },
  "comments": {
    "title": "Bình luận",
    "placeholder": "Viết bình luận...",
    "send": "Gửi",
    "editTimeout": "Chỉ sửa được trong 5 phút đầu"
  },
  "suggestions": {
    "alternativeRooms": "Phòng thay thế cùng giờ",
    "alternativeSlots": "Giờ thay thế cùng phòng",
    "smartTitle": "Gợi ý cho bạn",
    "bookNow": "Đặt ngay"
  },
  "sidebar": {
    "dashboard": "Dashboard",
    "calendar": "Lịch đặt phòng",
    "rooms": "Phòng họp",
    "newBooking": "Đặt phòng",
    "pendingApproval": "Duyệt lịch",
    "manageUsers": "Quản lý users",
    "templates": "Mẫu đặt phòng"
  },
  "errors": {
    "EMAIL_ALREADY_EXISTS": "Email đã được sử dụng",
    "INVALID_CREDENTIALS": "Email hoặc mật khẩu không đúng",
    "ACCOUNT_DISABLED": "Tài khoản đã bị khóa",
    "TOKEN_EXPIRED": "Phiên đăng nhập đã hết hạn",
    "UNAUTHORIZED": "Vui lòng đăng nhập",
    "FORBIDDEN": "Bạn không có quyền thực hiện thao tác này",
    "ROOM_NOT_FOUND": "Phòng không tồn tại",
    "ROOM_NAME_EXISTS": "Tên phòng đã tồn tại",
    "BOOKING_NOT_FOUND": "Booking không tồn tại",
    "BOOKING_CONFLICT": "Phòng đã có lịch trong khung giờ này",
    "BOOKING_PAST_TIME": "Không thể đặt phòng trong quá khứ",
    "BOOKING_OUTSIDE_HOURS": "Chỉ đặt phòng từ 07:00 đến 22:00",
    "BOOKING_TOO_SHORT": "Thời lượng tối thiểu là 30 phút",
    "BOOKING_TOO_LONG": "Thời lượng tối đa là 8 giờ",
    "BOOKING_TOO_FAR_AHEAD": "Chỉ đặt trước tối đa 30 ngày",
    "VALIDATION_ERROR": "Dữ liệu không hợp lệ",
    "INTERNAL_ERROR": "Có lỗi xảy ra, vui lòng thử lại",
    "TEMPLATE_LIMIT_REACHED": "Đã đạt giới hạn 10 mẫu"
  },
  "time": {
    "justNow": "Vừa xong",
    "minutesAgo": "{{count}} phút trước",
    "hoursAgo": "{{count}} giờ trước",
    "yesterday": "Hôm qua",
    "daysAgo": "{{count}} ngày trước"
  }
}
```

**`src/i18n/locales/en.json`** — Tương tự nhưng tiếng Anh:

```json
{
  "common": {
    "appName": "Meeting Room Manager",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "loading": "Loading...",
    "noData": "No data",
    "confirm": "Confirm",
    "back": "Back",
    "submit": "Submit",
    "close": "Close",
    "all": "All",
    "actions": "Actions"
  },
  "auth": {
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "fullName": "Full Name",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?",
    "loginSuccess": "Login successful",
    "registerSuccess": "Registration successful",
    "logoutSuccess": "Logged out successfully"
  },
  "bookings": {
    "title": "Bookings",
    "create": "Book Room",
    "approve": "Approve",
    "reject": "Reject",
    "cancelBooking": "Cancel Booking",
    "status": {
      "pending": "Pending",
      "approved": "Approved",
      "rejected": "Rejected",
      "cancelled": "Cancelled"
    }
  },
  "errors": {
    "EMAIL_ALREADY_EXISTS": "Email is already in use",
    "INVALID_CREDENTIALS": "Invalid email or password",
    "BOOKING_CONFLICT": "Room is already booked for this time slot",
    "BOOKING_PAST_TIME": "Cannot book in the past",
    "BOOKING_OUTSIDE_HOURS": "Bookings must be between 07:00 and 22:00",
    "INTERNAL_ERROR": "Something went wrong, please try again"
  }
}
```

> Lưu ý: file en.json trên chỉ là mẫu rút gọn. File thực tế phải có đầy đủ tất cả keys giống vi.json.

### 5. Sử dụng trong Components

**Cách dùng:**
```jsx
import { useTranslation } from 'react-i18next';

function LoginPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('auth.login')}</h1>
      <input placeholder={t('auth.email')} />
      <input placeholder={t('auth.password')} />
      <button>{t('auth.login')}</button>
      <p>{t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link></p>
    </div>
  );
}
```

**Error handling:**
```jsx
// Trong API interceptor hoặc catch block:
function handleApiError(error) {
  const errorCode = error.response?.data?.error?.code || 'INTERNAL_ERROR';
  const message = t(`errors.${errorCode}`);
  toast.error(message);
}
```

### 6. Language Switcher

**`src/components/common/LanguageSwitcher.jsx`**:

```
┌────────────────┐
│ 🇻🇳 Tiếng Việt ▾ │   ← Dropdown
├────────────────┤
│ 🇻🇳 Tiếng Việt   │
│ 🇬🇧 English      │
└────────────────┘
```

```jsx
function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)}>
      <option value="vi">🇻🇳 Tiếng Việt</option>
      <option value="en">🇬🇧 English</option>
    </select>
  );
}
```

Thêm vào Header, bên trái NotificationBell.

### 7. Quá trình migration

**Chiến lược thay thế text:**
1. Liệt kê tất cả files chứa hardcoded Vietnamese text
2. Với mỗi file: thay text bằng `t('key')` tương ứng
3. Đảm bảo keys có trong cả 2 file vi.json và en.json

**Files cần sửa (ước tính):**
- Tất cả pages: LoginPage, RegisterPage, DashboardPage, RoomsPage, BookingsPage, CalendarPage, NotificationsPage, TemplatesPage...
- Tất cả components: Sidebar, Header, BookingCard, RoomCard, StatusBadge, modals, forms...
- Toast messages trong services
- Validation messages trong forms

---

## Cấu trúc file tạo mới

```
frontend/src/
├── i18n/
│   ├── index.js                        ★ MỚI (i18n config)
│   └── locales/
│       ├── vi.json                     ★ MỚI (full Vietnamese)
│       └── en.json                     ★ MỚI (full English)
├── components/common/
│   └── LanguageSwitcher.jsx            ★ MỚI
├── components/layout/
│   └── Header.jsx                      (sửa — thêm LanguageSwitcher)
├── main.jsx                            (sửa — import i18n)
└── [tất cả pages & components]         (sửa — thay hardcoded text)

backend/src/
├── utils/errorCodes.js                 ★ MỚI
├── middlewares/error.middleware.js      (sửa — trả error code)
└── [tất cả services]                   (sửa — dùng error codes)
```

---

## Tiêu chí hoàn thành

- [ ] i18n config hoạt động, detect ngôn ngữ từ localStorage
- [ ] File vi.json chứa tất cả translation keys
- [ ] File en.json chứa tất cả translation keys
- [ ] LanguageSwitcher hiển thị ở header
- [ ] Chuyển ngôn ngữ → toàn bộ UI text thay đổi
- [ ] Refresh page → giữ nguyên ngôn ngữ đã chọn
- [ ] Error messages từ API → hiển thị đúng ngôn ngữ
- [ ] Toast notifications hiển thị đúng ngôn ngữ
- [ ] Validation messages hiển thị đúng ngôn ngữ
- [ ] Calendar labels (tên thứ, tháng) thay đổi theo ngôn ngữ
- [ ] Không còn hardcoded Vietnamese text trong code
- [ ] Backend trả error codes thay vì text messages
