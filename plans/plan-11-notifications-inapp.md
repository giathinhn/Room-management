# Plan 11 — In-app Notifications (SSE)

> **Mục tiêu**: Xây dựng hệ thống thông báo in-app với bell icon, notification dropdown, đánh dấu đã đọc, và real-time push qua Server-Sent Events.
> **Thời lượng ước tính**: 2–2.5 giờ
> **Phụ thuộc**: Plan 04 (booking system — cần booking events để trigger notifications)
> **Độc lập với**: Plan 05, 06, 07, 10, 12, 13, 14

---

## Tổng quan

Sau khi hoàn thành:

- Mỗi action booking (tạo/duyệt/từ chối/hủy) tạo notification trong DB
- Bell icon ở header hiển thị badge unread count
- Dropdown hiển thị danh sách notifications
- SSE stream push notification mới real-time (không cần refresh)
- Đánh dấu đã đọc / đọc tất cả

---

## PHẦN 1: BACKEND

### 1. Repository Layer

**`src/repositories/notification.repository.js`**:

| Method                                | Mô tả                                                              |
| ------------------------------------- | -------------------------------------------------------------------- |
| `create(data)`                      | Tạo notification mới                                               |
| `findByUserId(userId, page, limit)` | Danh sách notifications của user (phân trang, mới nhất trước) |
| `countUnread(userId)`               | Đếm số notification chưa đọc                                   |
| `markAsRead(id, userId)`            | Đánh dấu 1 notification đã đọc (kiểm tra ownership)          |
| `markAllAsRead(userId)`             | Đánh dấu tất cả đã đọc                                      |

### 2. Service Layer

**`src/services/notification.service.js`**:

| Method                                                           | Logic                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| `createNotification(userId, type, title, message, bookingId?)` | Tạo notification → Push qua SSE nếu user đang online |
| `getNotifications(userId, page, limit)`                        | Lấy danh sách + unread count                           |
| `getUnreadCount(userId)`                                       | Trả về { count: number }                               |
| `markAsRead(id, userId)`                                       | Kiểm tra ownership → đánh dấu đã đọc            |
| `markAllAsRead(userId)`                                        | Đánh dấu tất cả                                     |

### 3. SSE Manager

**`src/utils/sseManager.js`** — Quản lý SSE connections:

```js
class SSEManager {
  constructor() {
    this.clients = new Map(); // userId → Set<Response>
  }

  // Thêm client khi user connect SSE
  addClient(userId, res) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(res);

    // Cleanup khi client disconnect
    res.on('close', () => {
      this.clients.get(userId)?.delete(res);
      if (this.clients.get(userId)?.size === 0) {
        this.clients.delete(userId);
      }
    });
  }

  // Push notification tới user cụ thể
  sendToUser(userId, data) {
    const clients = this.clients.get(userId);
    if (clients) {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      clients.forEach(res => res.write(message));
    }
  }

  // Kiểm tra user có đang online không
  isOnline(userId) {
    return this.clients.has(userId) && this.clients.get(userId).size > 0;
  }
}

module.exports = new SSEManager(); // Singleton
```

### 4. SSE Endpoint

**`src/routes/notification.routes.js`**:

```js
// SSE stream endpoint
router.get('/stream', authenticate, (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Gửi heartbeat mỗi 30s để giữ connection
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Register client
  sseManager.addClient(req.user.id, res);

  // Cleanup
  res.on('close', () => {
    clearInterval(heartbeat);
  });
});
```

### 5. Tích hợp vào Booking Service

**Sửa `src/services/booking.service.js`** — thêm tạo notification sau mỗi action:

```js
// Trong create(): → Notify tất cả approvers
const approvers = await userRepo.findByRole('approver');
for (const approver of approvers) {
  await notificationService.createNotification(
    approver.id,
    'new_booking_pending',
    'Có booking mới cần duyệt',
    `${user.fullName} đặt phòng ${room.name} lúc ${startTime}`,
    booking.id
  );
}

// Trong approve(): → Notify người đặt
await notificationService.createNotification(
  booking.userId,
  'booking_approved',
  'Booking đã được duyệt',
  `Phòng ${room.name} lúc ${startTime} đã được duyệt`,
  booking.id
);

// Trong reject(): → Notify người đặt
await notificationService.createNotification(
  booking.userId,
  'booking_rejected',
  'Booking bị từ chối',
  `Phòng ${room.name} lúc ${startTime} bị từ chối. Lý do: ${reason}`,
  booking.id
);

// Trong cancel(): → Notify approvers + người đặt (nếu admin hủy)
```

### 6. Controller & Routes

**`src/controllers/notification.controller.js`**:

| Method             | Endpoint                                   | Response                                          |
| ------------------ | ------------------------------------------ | ------------------------------------------------- |
| `getAll`         | GET `/api/notifications?page=1&limit=20` | { data: Notification[], unreadCount, pagination } |
| `getUnreadCount` | GET `/api/notifications/unread-count`    | { count: number }                                 |
| `markAsRead`     | PATCH `/api/notifications/:id/read`      | { data: Notification }                            |
| `markAllAsRead`  | PATCH `/api/notifications/read-all`      | { message: "All marked as read" }                 |
| `stream`         | GET `/api/notifications/stream`          | SSE stream                                        |

---

## PHẦN 2: FRONTEND

### 7. SSE Hook

**`src/hooks/useNotifications.js`**:

```js
function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial data
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  // SSE connection
  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/stream', {
      // Cần gửi token → dùng custom fetch hoặc polyfill
    });

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Hiển thị toast cho notification mới
    };

    return () => eventSource.close();
  }, []);

  return { notifications, unreadCount, markAsRead, markAllAsRead, fetchMore };
}
```

> ⚠️ **SSE + JWT**: `EventSource` không hỗ trợ custom headers. Giải pháp:
>
> - Option A: Gửi token qua query param: `/api/notifications/stream?token=xxx`
> - Option B: Dùng `fetch` + `ReadableStream` thay `EventSource`
> - **Khuyến nghị Option A** cho đơn giản, token ngắn hạn (15 phút)

### 8. Components

#### `src/components/notifications/NotificationBell.jsx`

```
┌──────┐
│ 🔔   │ ← Bell icon
│  (3) │ ← Badge đỏ với unread count (ẩn nếu 0)
└──────┘
```

- Click → toggle dropdown
- Badge animation: scale pulse khi có notification mới

#### `src/components/notifications/NotificationDropdown.jsx`

```
┌──────────────────────────────────────────┐
│ Thông báo                [Đọc tất cả]   │
├──────────────────────────────────────────┤
│ 🟢 Booking đã được duyệt        2 phút  │
│ Phòng A1 lúc 09:00 ngày 20/06            │
├──────────────────────────────────────────┤
│ 🔴 Booking bị từ chối          15 phút   │
│ Phòng B2 lúc 14:00 ngày 21/06            │
├──────────────────────────────────────────┤
│ ● Có booking mới cần duyệt     1 giờ    │  ← ● = chưa đọc
│ Nguyễn Văn A đặt phòng C3               │
├──────────────────────────────────────────┤
│          [Xem tất cả thông báo]          │
└──────────────────────────────────────────┘
```

**Features:**

- Max 5 notifications gần nhất trong dropdown
- Unread: background nhạt + dot indicator
- Relative time: "2 phút", "1 giờ", "Hôm qua"
- Click notification → navigate tới booking detail → mark as read
- "Đọc tất cả" button
- "Xem tất cả" → navigate tới /notifications page

#### `src/components/notifications/NotificationItem.jsx`

- Props: notification, onRead, onClick
- Icon theo type: 🟢 approved, 🔴 rejected, ⚪ cancelled, ⏰ reminder, 📋 pending
- Unread styling: left border accent + bolder text
- Time ago display (dùng `date-fns/formatDistanceToNow`)

### 9. NotificationsPage (full list)

**`src/pages/NotificationsPage.jsx`**:

- Danh sách tất cả notifications, phân trang
- Nút "Đánh dấu tất cả đã đọc"
- Click → navigate tới booking
- Infinite scroll hoặc pagination

### 10. Tích hợp vào Header

**Sửa `src/components/layout/Header.jsx`**:

- Thêm `<NotificationBell />` vào header, bên trái user dropdown
- Inject `useNotifications` hook

---

## Cấu trúc file tạo mới

```
backend/src/
├── repositories/notification.repository.js   ★ MỚI
├── services/notification.service.js          ★ MỚI
├── controllers/notification.controller.js    ★ MỚI
├── routes/notification.routes.js             ★ MỚI
├── utils/sseManager.js                       ★ MỚI
├── services/booking.service.js               (sửa — thêm notify calls)
└── routes/index.js                           (sửa — mount route)

frontend/src/
├── hooks/useNotifications.js                  ★ MỚI
├── services/notification.service.js           ★ MỚI
├── pages/
│   ├── NotificationsPage.jsx                  ★ MỚI
│   └── NotificationsPage.css                  ★ MỚI
├── components/
│   ├── notifications/
│   │   ├── NotificationBell.jsx               ★ MỚI
│   │   ├── NotificationBell.css               ★ MỚI
│   │   ├── NotificationDropdown.jsx           ★ MỚI
│   │   ├── NotificationDropdown.css           ★ MỚI
│   │   └── NotificationItem.jsx               ★ MỚI
│   └── layout/
│       └── Header.jsx                         (sửa — thêm bell)
└── App.jsx                                    (sửa — thêm /notifications route)
```

---

## Tiêu chí hoàn thành

- [X] Tạo booking → notification gửi tới approvers
- [X] Duyệt booking → notification gửi tới người đặt
- [X] Từ chối booking → notification gửi tới người đặt
- [X] Hủy booking → notification gửi tới liên quan
- [X] Bell icon hiển thị unread count đúng
- [X] Dropdown hiển thị 5 notifications gần nhất
- [X] Click notification → navigate tới booking + mark as read
- [X] "Đọc tất cả" hoạt động
- [X] SSE push notification real-time (không cần refresh)
- [X] Notification mới → toast hiển thị + badge cập nhật
- [X] Trang /notifications hiển thị danh sách đầy đủ
- [X] SSE reconnect tự động khi mất connection
