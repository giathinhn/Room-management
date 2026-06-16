# Plan 08 — Email Notifications & Reminders

> **Mục tiêu**: Gửi email thông báo khi booking được duyệt/từ chối/hủy + nhắc lịch trước giờ họp.
> **Thời lượng ước tính**: 1–1.5 giờ
> **Phụ thuộc**: Plan 04 (booking system)
> **Độc lập với**: Plan 05, Plan 06, Plan 07

---

## Tổng quan

Sau khi hoàn thành:
- Gửi email tự động khi booking được duyệt, từ chối, hoặc hủy
- Gửi email nhắc lịch trước 15 phút khi cuộc họp sắp bắt đầu
- Email template HTML đẹp, có branding
- Cron job chạy nền để kiểm tra và gửi reminder

---

## BACKEND

### 1. Cài dependencies

```bash
npm install nodemailer node-cron
```

### 2. Email Config

**`.env` — thêm:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Meeting Room System <noreply@company.com>"
```

> 💡 **Tip cho dev**: Dùng [Ethereal](https://ethereal.email/) hoặc [Mailtrap](https://mailtrap.io/) để test email miễn phí, không cần SMTP thật.

**`src/config/email.js`**:
```js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = transporter;
```

### 3. Email Templates

**`src/utils/emailTemplates.js`**:

Tạo hàm sinh HTML email cho từng loại:

| Template | Khi nào gửi | Nội dung |
|----------|-------------|----------|
| `bookingApproved(booking)` | Booking được duyệt | "Lịch đặt phòng đã được duyệt" + chi tiết phòng/thời gian |
| `bookingRejected(booking)` | Booking bị từ chối | "Lịch đặt phòng bị từ chối" + lý do từ chối |
| `bookingCancelled(booking)` | Booking bị hủy | "Lịch đặt phòng đã bị hủy" |
| `bookingReminder(booking)` | 15 phút trước giờ họp | "Nhắc nhở: Cuộc họp sắp bắt đầu trong 15 phút" |
| `newBookingForApprover(booking)` | Booking mới được tạo | "Có lịch đặt phòng mới cần duyệt" |

**HTML template mẫu (bookingApproved):**
```html
<!-- Responsive email template -->
<div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', Arial, sans-serif;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0;">📅 Meeting Room</h1>
  </div>

  <!-- Body -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0;">
    <h2 style="color: #22c55e;">✅ Lịch đặt phòng đã được duyệt!</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; color: #64748b;">Phòng:</td>
        <td style="padding: 10px; font-weight: 600;">{roomName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; color: #64748b;">Ngày:</td>
        <td style="padding: 10px;">{date}</td>
      </tr>
      <tr>
        <td style="padding: 10px; color: #64748b;">Thời gian:</td>
        <td style="padding: 10px;">{startTime} – {endTime}</td>
      </tr>
      <tr>
        <td style="padding: 10px; color: #64748b;">Mục đích:</td>
        <td style="padding: 10px;">{title}</td>
      </tr>
      <tr>
        <td style="padding: 10px; color: #64748b;">Người duyệt:</td>
        <td style="padding: 10px;">{approverName}</td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
    <p style="color: #94a3b8; font-size: 12px;">Đây là email tự động, vui lòng không trả lời.</p>
  </div>
</div>
```

### 4. Email Service

**`src/services/email.service.js`**:

| Method | Mô tả |
|--------|--------|
| `sendBookingApproved(booking)` | Gửi email cho người đặt khi booking được duyệt |
| `sendBookingRejected(booking)` | Gửi email cho người đặt khi booking bị từ chối |
| `sendBookingCancelled(booking)` | Gửi email cho người đặt khi booking bị hủy |
| `sendBookingReminder(booking)` | Gửi email nhắc lịch cho người đặt |
| `sendNewBookingNotification(booking)` | Gửi email cho approvers khi có booking mới |

```js
async function sendBookingApproved(booking) {
  const html = emailTemplates.bookingApproved(booking);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: booking.user.email,
    subject: `✅ Lịch đặt phòng "${booking.title}" đã được duyệt`,
    html: html,
  });
}
```

> ⚠️ **Gửi email async, không block response**: Dùng `fire-and-forget` — gọi `sendEmail()` nhưng không `await`. Log error nếu gửi thất bại, không throw lên.

### 5. Tích hợp vào Booking Service

**Sửa `src/services/booking.service.js`** — thêm gọi email sau mỗi action:

```js
// Trong approve():
await bookingRepo.updateStatus(id, 'approved', { approvedBy, approvedAt });
emailService.sendBookingApproved(booking).catch(err => logger.error('Email failed:', err));

// Trong reject():
await bookingRepo.updateStatus(id, 'rejected', { rejectionReason });
emailService.sendBookingRejected(booking).catch(err => logger.error('Email failed:', err));

// Trong cancel():
await bookingRepo.updateStatus(id, 'cancelled');
emailService.sendBookingCancelled(booking).catch(err => logger.error('Email failed:', err));

// Trong create():
await bookingRepo.create(data);
emailService.sendNewBookingNotification(booking).catch(err => logger.error('Email failed:', err));
```

### 6. Reminder Cron Job

**`src/jobs/reminder.job.js`**:

```js
const cron = require('node-cron');

// Chạy mỗi 5 phút
cron.schedule('*/5 * * * *', async () => {
  // 1. Lấy bookings sắp diễn ra trong 15-20 phút tới
  //    WHERE status = 'approved'
  //    AND start_time BETWEEN now() + 15min AND now() + 20min
  //    AND reminder_sent = false (cần thêm cột này)

  // 2. Gửi email nhắc lịch cho từng booking

  // 3. Đánh dấu reminder_sent = true
});
```

**Database change** — thêm cột vào bảng `bookings`:
```prisma
model Booking {
  // ... existing fields
  reminderSent Boolean @default(false) @map("reminder_sent")
}
```

> 🔧 Chạy migration: `npx prisma migrate dev --name add_reminder_sent`

**Khởi chạy cron** — thêm vào `src/server.js`:
```js
// Chỉ chạy cron trong production hoặc khi có SMTP config
if (process.env.SMTP_HOST) {
  require('./jobs/reminder.job');
  console.log('📧 Reminder cron job started');
}
```

### 7. Logging

**`src/utils/logger.js`** (nếu chưa có):
```js
// Simple logger wrapper
// Log email send success/failure
// Log cron job execution
```

---

## Cấu trúc file tạo mới

```
backend/src/
├── config/email.js                   ★ MỚI
├── utils/emailTemplates.js           ★ MỚI
├── utils/logger.js                   ★ MỚI (nếu chưa có)
├── services/email.service.js         ★ MỚI
├── jobs/reminder.job.js              ★ MỚI
├── services/booking.service.js       (sửa — thêm gọi email)
├── server.js                         (sửa — khởi chạy cron)
└── prisma/
    └── schema.prisma                 (sửa — thêm reminderSent)

backend/.env.example                  (sửa — thêm SMTP vars)
```

---

## Test

### Test gửi email (dùng Ethereal):
```js
// 1. Tạo test account: https://ethereal.email/create
// 2. Cấu hình .env:
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=xxx@ethereal.email
SMTP_PASS=xxx
// 3. Duyệt 1 booking → check Ethereal inbox
```

### Test cron job:
```js
// Tạm thời đổi cron thành chạy mỗi 1 phút: '* * * * *'
// Tạo booking approved có start_time = now + 16 phút
// Chờ cron chạy → check log + email
```

---

## Tiêu chí hoàn thành

- [ ] Email gửi thành công khi booking được duyệt
- [ ] Email gửi thành công khi booking bị từ chối (kèm lý do)
- [ ] Email gửi thành công khi booking bị hủy
- [ ] Email thông báo cho approver khi có booking mới
- [ ] Email nhắc lịch gửi trước 15 phút khi họp
- [ ] Cron job chạy mỗi 5 phút, không gửi trùng (reminderSent flag)
- [ ] Email template HTML đẹp, responsive
- [ ] Gửi email không block API response (fire-and-forget)
- [ ] Email failure không gây crash server (có try-catch + log)
- [ ] Test thành công với Ethereal/Mailtrap
