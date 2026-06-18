# Plan 06 — Calendar View (Giao diện lịch)

> **Mục tiêu**: Xây dựng giao diện calendar trực quan (giống Google Calendar) để hiển thị lịch đặt phòng theo ngày/tuần/tháng.
> **Thời lượng ước tính**: 2–3 giờ
> **Phụ thuộc**: Plan 04 (booking system — cần API GET /api/bookings)
> **Độc lập với**: Plan 05, Plan 07, Plan 08

---

## Tổng quan

Sau khi hoàn thành:

- Giao diện calendar view 3 chế độ: ngày, tuần, tháng
- Bookings hiển thị dạng events trên calendar, mã màu theo status
- Click vào slot trống → mở form đặt phòng nhanh
- Click vào booking → xem chi tiết
- Filter theo phòng
- Sử dụng thư viện **FullCalendar** hoặc **React Big Calendar**

---

## Chọn thư viện Calendar

### Khuyến nghị: **FullCalendar** (`@fullcalendar/react`)

```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

**Lý do chọn:**

- Hỗ trợ sẵn day/week/month views
- Drag-and-drop events
- Click vào slot trống
- Responsive
- Customizable event rendering
- Miễn phí cho open-source

---

## BACKEND — API bổ sung

### Endpoint cho Calendar

Cần thêm **1 endpoint** tối ưu cho calendar (lấy bookings theo range lớn, trả gọn):

**`GET /api/bookings/calendar`**

| Param      | Mô tả                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| `start`  | ISO datetime — bắt đầu khoảng thời gian (bắt buộc)                  |
| `end`    | ISO datetime — kết thúc khoảng thời gian (bắt buộc)                  |
| `roomId` | UUID — lọc theo phòng (optional, nếu không truyền → tất cả phòng) |

**Response** (format tối ưu cho FullCalendar):

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Họp sprint planning",
      "start": "2026-06-20T09:00:00",
      "end": "2026-06-20T10:30:00",
      "status": "approved",
      "roomId": "uuid",
      "roomName": "Phòng A1",
      "userId": "uuid",
      "userName": "Nguyễn Văn A",
      "isRecurring": false
    }
  ]
}
```

**Thêm vào `booking.repository.js`:**

```js
findByDateRange(start, end, roomId?) {
  // Lấy tất cả bookings trong range
  // Chỉ lấy status: pending, approved (không hiển thị rejected/cancelled trên calendar)
  // Include: room.name, user.fullName
  // Trả về format gọn (không kèm rejectionReason, timestamps...)
}
```

**Thêm route:**

```js
router.get('/calendar', authenticate, bookingController.getCalendarEvents);
```

---

## FRONTEND

### 1. CalendarPage

**`src/pages/CalendarPage.jsx`**

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│ 📅 Lịch đặt phòng                                       │
├─────────────────────────────────────────────────────────┤
│ [Phòng: Tất cả ▾]    ◀ Tháng 6/2026 ▶   [Ngày][Tuần][Tháng] │
├─────────────────────────────────────────────────────────┤
│ (Month View)                                             │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐            │
│ │ T2  │ T3  │ T4  │ T5  │ T6  │ T7  │ CN  │            │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤            │
│ │     │ 🟢  │     │ 🟡  │ 🟢  │     │     │            │
│ │     │ Họp │     │ Đặt │ 2   │     │     │            │
│ │     │ team│     │ mới │events│     │     │            │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤            │
│ │ 🟢  │     │ 🟢  │     │     │ 🟡  │     │            │
│ │ 3   │     │ Ret │     │     │ New │     │            │
│ │evts │     │ ro  │     │     │     │     │            │
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘            │
│                                                          │
│ (Week View — time grid)                                  │
│      │ T2    │ T3    │ T4    │ T5    │ T6    │           │
│ 08:00│       │       │       │       │       │           │
│ 09:00│ ██████│       │       │       │ ██████│           │
│ 10:00│ ██████│       │ ██████│       │ ██████│           │
│ 11:00│       │       │ ██████│       │       │           │
│ 12:00│       │       │       │       │       │           │
│ 13:00│       │       │       │       │       │           │
│ 14:00│       │ ██████│       │ ██████│       │           │
│ 15:00│       │ ██████│       │       │       │           │
│                                                          │
│ (Day View — detailed time grid)                          │
│ 07:00 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │
│ 08:00 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │
│ 09:00 ████████████████████████████████████              │
│       🟢 Họp sprint planning - Phòng A1                 │
│ 10:00 ████████████████████████████████████              │
│ 10:30 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │
│ 11:00 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │
└─────────────────────────────────────────────────────────┘
```

### 2. FullCalendar Configuration

```jsx
<FullCalendar
  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  headerToolbar={{
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  }}
  locale="vi"                          // Tiếng Việt
  firstDay={1}                         // Thứ 2 đầu tuần
  slotMinTime="07:00:00"              // Bắt đầu 07:00
  slotMaxTime="22:00:00"              // Kết thúc 22:00
  slotDuration="00:30:00"             // Chia 30 phút
  selectable={true}                    // Cho phép click chọn range
  selectMirror={true}
  editable={false}                     // Không cho drag-and-drop
  events={fetchEvents}                 // Hàm fetch events từ API
  eventClick={handleEventClick}        // Click vào event → xem chi tiết
  select={handleDateSelect}            // Click vào slot trống → đặt phòng
  eventContent={renderEventContent}    // Custom render event
  datesSet={handleDatesSet}            // Khi user chuyển tháng/tuần → re-fetch
  height="auto"
/>
```

### 3. Event Color Mapping

```js
const STATUS_COLORS = {
  pending:   { backgroundColor: '#f59e0b', borderColor: '#d97706', textColor: '#fff' },
  approved:  { backgroundColor: '#22c55e', borderColor: '#16a34a', textColor: '#fff' },
  // rejected và cancelled không hiển thị trên calendar
};
```

### 4. Event Rendering

**Custom event content** (hiển thị trong mỗi ô event):

```jsx
function renderEventContent(eventInfo) {
  // Month view: chỉ hiển thị title (truncated)
  // Week/Day view: hiển thị title + room name + time
  //
  // Ví dụ week view:
  // ┌─────────────────────┐
  // │ 🟢 Họp sprint       │
  // │ 📍 Phòng A1          │
  // │ 👤 Nguyễn Văn A      │
  // └─────────────────────┘
}
```

### 5. Interactions

#### Click vào slot trống (select):

```js
function handleDateSelect(selectInfo) {
  // Mở modal đặt phòng nhanh hoặc redirect tới BookingCreatePage
  // Pre-fill: startTime = selectInfo.start, endTime = selectInfo.end
  // Nếu month view: chỉ có ngày, không có giờ → mặc định 09:00-10:00
}
```

#### Click vào booking (eventClick):

```js
function handleEventClick(clickInfo) {
  // Mở modal chi tiết booking
  // Hoặc navigate tới /bookings/:id
  // Hiển thị: title, room, user, time, status
  // Nút: Duyệt/Từ chối (nếu approver), Hủy (nếu owner)
}
```

### 6. Room Filter

**`src/components/calendar/RoomFilter.jsx`**:

- Dropdown chọn phòng: "Tất cả phòng" + danh sách phòng
- Khi chọn phòng → re-fetch events chỉ cho phòng đó
- Optional: Multi-select phòng, mỗi phòng 1 màu riêng

### 7. Quick Booking Modal

**`src/components/calendar/QuickBookingModal.jsx`**:

- Mở khi click vào slot trống trên calendar
- Pre-filled: ngày/giờ đã chọn
- Form gọn: chọn phòng (dropdown phòng trống) + tiêu đề
- Submit → tạo booking → refresh calendar

### 8. Event Detail Popover

**`src/components/calendar/EventPopover.jsx`**:

- Hiển thị khi click vào event trên calendar
- Compact info: title, room, user, time, status badge
- Links: "Xem chi tiết", "Hủy"
- Đóng khi click ra ngoài

---

## Cấu trúc file tạo mới

```
backend/src/
├── controllers/booking.controller.js   (sửa — thêm getCalendarEvents)
├── repositories/booking.repository.js  (sửa — thêm findByDateRange)
└── routes/booking.routes.js            (sửa — thêm /calendar route)

frontend/src/
├── pages/
│   ├── CalendarPage.jsx                ★ MỚI
│   └── CalendarPage.css                ★ MỚI
├── components/calendar/
│   ├── RoomFilter.jsx                  ★ MỚI
│   ├── QuickBookingModal.jsx           ★ MỚI
│   ├── QuickBookingModal.css           ★ MỚI
│   ├── EventPopover.jsx                ★ MỚI
│   └── EventPopover.css                ★ MỚI
└── App.jsx                             (sửa — thêm /calendar route)
```

---

## Tiêu chí hoàn thành

- [X] API /api/bookings/calendar trả events theo date range + room filter
- [X] Calendar hiển thị 3 chế độ: ngày, tuần, tháng
- [X] Events mã màu theo status (vàng=pending, xanh=approved)
- [X] Click slot trống → mở quick booking modal
- [X] Click event → hiển thị popover chi tiết
- [X] Room filter hoạt động (lọc events theo phòng)
- [X] Chuyển tháng/tuần → auto re-fetch events
- [X] Calendar responsive (hoạt động trên tablet)
- [X] Locale tiếng Việt (tên thứ, tên tháng)
- [X] Quick booking modal → tạo booking thành công → calendar refresh
