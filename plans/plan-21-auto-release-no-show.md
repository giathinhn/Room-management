# Plan 21 — Tự động giải phóng phòng khi "No-Show" (Auto-release / Check-in)

> **Mục tiêu**: Bổ sung tính năng Check-in cho các lịch đặt phòng họp. Nếu sau 15 phút kể từ lúc cuộc họp bắt đầu mà không có ai thực hiện Check-in, hệ thống sẽ tự động hủy lịch đặt đó và giải phóng phòng họp cho người khác sử dụng.
> **Thời lượng ước tính**: 2–3 giờ
> **Phụ thuộc**: Plan 04 (Booking System), Plan 08 (Email Notifications), Plan 11 (In-app Notifications)
> **Độc lập với**: Plan 05, Plan 06, Plan 07, Plan 10, Plan 12, Plan 13, Plan 14, Plan 15, Plan 16, Plan 17, Plan 18, Plan 19, Plan 20

---

## Tổng quan

Sau khi hoàn thành plan này:

- Mỗi lịch đặt phòng họp sau khi được duyệt (`approved`) sẽ có thêm trạng thái Check-in.
- Người đặt phòng (hoặc Admin) có thể bấm nút **Check-in** trên giao diện trong khoảng thời gian từ **10 phút trước giờ họp** đến **15 phút sau giờ họp**.
- Nếu quá 15 phút kể từ giờ bắt đầu họp (`startTime`) mà cuộc họp chưa được check-in, một tác vụ nền (background job) chạy định kỳ sẽ tự động đổi trạng thái lịch họp thành `cancelled` (Hủy), ghi nhận lý do là "Hệ thống tự động hủy do quá giờ check-in (No-Show)".
- Hệ thống sẽ gửi email và thông báo trong app (In-app notification) báo cho người đặt phòng biết lịch họp của họ đã bị hủy tự động.

---

## 🗄️ DATABASE & SCHEMA CHANGES

### 1. Cập nhật `backend/prisma/schema.prisma`

Bổ sung các trường thông tin check-in vào model `Booking`:

```prisma
model Booking {
  // ... các fields hiện có
  checkedIn    Boolean   @default(false) @map("checked_in")
  checkInTime  DateTime? @map("check_in_time")
  cancelReason String?   @map("cancel_reason") @db.Text // ghi nhận lý do hủy (bao gồm cả No-Show)
}
```

### 2. Chạy lệnh Migration

Tại thư mục `backend`, chạy lệnh:

```bash
npx prisma migrate dev --name add_booking_checkin_fields
```

---

## ⚙️ BACKEND IMPLEMENTATION

### 1. Routes

Bổ sung endpoint check-in.

**`backend/src/routes/booking.routes.js` [MODIFY]**:

```javascript
router.post('/:id/check-in', authenticate, bookingController.checkIn);
```

### 2. Controller

Xử lý request check-in.

**`backend/src/controllers/booking.controller.js` [MODIFY]**:

```javascript
const bookingController = {
  // ... các handlers hiện có

  async checkIn(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const booking = await bookingService.checkIn(id, userId, userRole);
      return res.json({
        success: true,
        message: 'Check-in phòng họp thành công',
        data: booking,
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  }
};
```

### 3. Service

Xử lý logic nghiệp vụ check-in & Background Job tự động hủy phòng.

**`backend/src/services/booking.service.js` [MODIFY]**:

* **Hàm `checkIn`**:
  * Kiểm tra xem booking có tồn tại và trạng thái có phải là `approved` không.
  * Kiểm tra quyền sở hữu (chỉ người đặt phòng hoặc admin/approver mới được check-in).
  * Kiểm tra khung thời gian check-in: `startTime - 10 phút` ≤ `now` ≤ `startTime + 15 phút`.
  * Cập nhật `checkedIn = true` và `checkInTime = new Date()`.

```javascript
  async checkIn(bookingId, userId, userRole) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw ApiError.notFound('Không tìm thấy lịch đặt phòng');
    if (booking.status !== 'approved') throw ApiError.badRequest('Chỉ có thể check-in các lịch đặt đã được duyệt');
  
    // Quyền check-in
    if (booking.userId !== userId && userRole === 'user') {
      throw ApiError.forbidden('Bạn không có quyền check-in lịch đặt này');
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
  
    const checkInStart = new Date(startTime.getTime() - 10 * 60 * 1000); // Trước 10p
    const checkInEnd = new Date(startTime.getTime() + 15 * 60 * 1000);  // Sau 15p

    if (now < checkInStart) {
      throw ApiError.badRequest('Chưa đến giờ check-in (Có thể check-in trước giờ họp 10 phút)');
    }
    if (now > checkInEnd) {
      throw ApiError.badRequest('Đã quá thời hạn check-in (Hạn check-in tối đa là 15 phút sau khi cuộc họp bắt đầu)');
    }

    return bookingRepository.update(bookingId, {
      checkedIn: true,
      checkInTime: now,
    });
  }
```

* **Hàm quét và giải phóng phòng (`releaseNoShowBookings`)**:
  * Quét toàn bộ các booking có `status = 'approved'`, `checkedIn = false`.
  * Thời gian bắt đầu họp đã trôi qua quá 15 phút (`startTime < now - 15 phút`) và cuộc họp chưa kết thúc (`endTime > now`).
  * Cập nhật các lịch này thành `status = 'cancelled'`, `cancelReason = 'Hệ thống tự động hủy do quá giờ check-in (No-Show)'`.
  * Gửi email thông báo hủy + gửi In-app notification.

```javascript
  async releaseNoShowBookings() {
    const now = new Date();
    const limitTime = new Date(now.getTime() - 15 * 60 * 1000); // 15 phút trước

    // Tìm các booking quá hạn check-in
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'approved',
        checkedIn: false,
        startTime: { lt: limitTime },
        endTime: { gt: now },
      },
      include: { user: true, room: true }
    });

    if (expiredBookings.length === 0) return;

    console.log(`[Scheduler] Tìm thấy ${expiredBookings.length} lịch họp quá hạn check-in. Đang xử lý giải phóng phòng...`);

    for (const booking of expiredBookings) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'cancelled',
          cancelReason: 'Hệ thống tự động hủy do quá giờ check-in (No-Show)'
        }
      });

      // 1. Gửi email thông báo (Plan 08)
      if (emailService) {
        emailService.sendBookingCancelled(booking, 'Hệ thống tự động hủy do quá giờ check-in (No-Show)').catch(console.error);
      }

      // 2. Gửi In-app notification (Plan 11)
      if (notificationService) {
        await notificationService.createNotification(
          booking.userId,
          'booking_cancelled',
          'Lịch họp bị hủy tự động',
          `Lịch đặt phòng "${booking.title}" tại ${booking.room.name} đã bị tự động hủy do không check-in đúng giờ.`,
          booking.id
        ).catch(console.error);
      }
    }
  }
```

### 4. Background Job Scheduler

Để ứng dụng tự động kiểm tra định kỳ mà không cần cài đặt thêm thư viện, chúng ta thiết lập một hàm `setInterval` đơn giản chạy mỗi **5 phút** ở backend khi khởi động.

**`backend/src/server.js` [MODIFY]**:

```javascript
// Thêm scheduler kiểm tra giải phóng phòng
const bookingService = require('./services/booking.service');

// Chạy mỗi 5 phút (5 * 60 * 1000 ms)
setInterval(() => {
  console.log('[Scheduler] Đang quét các lịch đặt quá hạn check-in...');
  bookingService.releaseNoShowBookings().catch(err => {
    console.error('[Scheduler Error] Lỗi khi chạy giải phóng phòng:', err);
  });
}, 5 * 60 * 1000);
```

---

## 💻 FRONTEND IMPLEMENTATION

### 1. API Service

**`frontend/src/services/booking.service.js` [MODIFY]**:

```javascript
export const checkInBooking = async (bookingId) => {
  const response = await api.post(`/bookings/${bookingId}/check-in`);
  return response.data;
};
```

### 2. UI Components & Pages

#### A. Nút Check-in trên giao diện người dùng

* Tại trang Dashboard cá nhân, danh sách lịch họp của tôi (`MyBookings`), hoặc trang chi tiết cuộc họp:
  * Nếu lịch họp có trạng thái `approved` và chưa check-in (`checkedIn === false`):
    * Kiểm tra thời gian hiện tại.
    * Nếu nằm trong khung thời gian (`startTime - 10 phút` đến `startTime + 15 phút`): Hiển thị nút **`[ Điểm danh / Check-in ]`** nổi bật màu xanh lá kèm hiệu ứng nhấp nháy nhẹ (pulse effect) để thu hút sự chú ý.
    * Hiển thị dòng đếm ngược: `"Vui lòng check-in trước {thời gian đếm ngược} để không bị hủy phòng"`.
    * Nếu bấm vào nút: Gọi API `checkInBooking`, hiển thị Toast thông báo thành công và ẩn nút check-in đi (thay bằng badge `Đã check-in` màu xanh lá).
  * Nếu đã check-in: Hiển thị badge `Đã check-in` kèm theo thời gian check-in.
  * Nếu bị tự động hủy: Hiển thị trạng thái `Đã hủy (No-Show)` màu đỏ.

---

## Cấu trúc file tạo mới & sửa

```text
backend/
├── prisma/schema.prisma                 (sửa — thêm checkedIn, checkInTime, cancelReason vào model Booking)
├── src/
│   ├── routes/booking.routes.js         (sửa — thêm route check-in)
│   ├── controllers/booking.controller.js (sửa — thêm handler check-in)
│   ├── services/booking.service.js      (sửa — thêm logic checkIn & releaseNoShowBookings)
│   └── server.js                        (sửa — thiết lập setInterval chạy cron quét no-show)

frontend/src/
├── services/booking.service.js          (sửa — thêm call API check-in)
└── pages/
    ├── DashboardPage.jsx                (sửa — render nút Check-in và đếm ngược)
    └── BookingDetailsPage.jsx           (sửa — hiển thị trạng thái Check-in & cancelReason)
```

---

## 🏁 Tiêu chí hoàn thành (Checklist)

- [X] Chạy migration thành công, cập nhật bảng `bookings` thêm 3 trường mới trong database.
- [X] Nút "Check-in" chỉ hiển thị đúng khung thời gian quy định (từ trước 10p đến sau 15p của giờ họp).
- [X] Thực hiện check-in thành công: cập nhật `checkedIn: true` trong DB, đổi giao diện nút thành badge xanh lá.
- [X] Test background job: Đặt lịch họp mẫu có `startTime` cách đây 16 phút, trạng thái `approved`, `checkedIn: false`. Sau 5 phút, background job quét qua và tự động hủy lịch, giải phóng phòng họp về trạng thái trống.
- [X] Người đặt lịch nhận được cả email và thông báo trong app khi cuộc họp bị hủy tự động do quá giờ check-in.
