# Plan 10 — Dashboard & Analytics (Admin)

> **Mục tiêu**: Xây dựng trang Dashboard cho Admin với các biểu đồ thống kê: tổng quan booking, tần suất phòng, heatmap giờ cao điểm, top users, xu hướng theo thời gian.
> **Thời lượng ước tính**: 2–3 giờ
> **Phụ thuộc**: Plan 04 (booking system — cần data bookings)
> **Độc lập với**: Plan 05, 06, 07, 08, 11, 12, 13, 14

---

## Tổng quan

Sau khi hoàn thành:
- Admin có trang Dashboard với 5 biểu đồ/thống kê
- Dữ liệu aggregate từ bookings table
- Charts sử dụng **Recharts** (hoặc Chart.js)
- Filter theo khoảng thời gian (7 ngày / 30 ngày / 3 tháng / custom)

---

## PHẦN 1: BACKEND

### 1. Repository Layer

**`src/repositories/dashboard.repository.js`**:

| Method | Mô tả | Query |
|--------|--------|-------|
| `getOverview(startDate, endDate)` | Tổng quan | COUNT bookings GROUP BY status, COUNT theo ngày |
| `getRoomUsage(startDate, endDate)` | Tần suất phòng | COUNT bookings GROUP BY room_id, JOIN rooms |
| `getPeakHours(startDate, endDate)` | Giờ cao điểm | COUNT bookings GROUP BY EXTRACT(dow, hour) |
| `getTopUsers(startDate, endDate, limit)` | Top người đặt | COUNT bookings GROUP BY user_id, ORDER DESC, LIMIT |
| `getTrends(startDate, endDate, granularity)` | Xu hướng | COUNT bookings GROUP BY DATE_TRUNC(week/month) |

### 2. Service Layer

**`src/services/dashboard.service.js`**:

| Method | Logic |
|--------|-------|
| `getOverview(dateRange)` | Trả về: totalBookings, approved, rejected, cancelled, pending, approvalRate (%), bookingsToday, bookingsThisWeek |
| `getRoomUsage(dateRange)` | Trả về: [{ roomId, roomName, bookingCount, totalHours }] sắp xếp giảm dần |
| `getPeakHours(dateRange)` | Trả về: matrix 7×16 (7 ngày × 16 giờ từ 07:00-22:00), value = booking count |
| `getTopUsers(dateRange, limit=10)` | Trả về: [{ userId, fullName, email, bookingCount, totalHours }] |
| `getTrends(dateRange, granularity)` | Trả về: [{ period: "2026-W25", total, approved, rejected }] |

### 3. Controller & Routes

**`src/controllers/dashboard.controller.js`**:

| Method | Endpoint | Query Params | Response |
|--------|----------|-------------|----------|
| `getOverview` | GET `/api/dashboard/overview` | startDate, endDate | { totalBookings, approved, rejected, ... } |
| `getRoomUsage` | GET `/api/dashboard/room-usage` | startDate, endDate | { data: RoomUsage[] } |
| `getPeakHours` | GET `/api/dashboard/peak-hours` | startDate, endDate | { data: number[][] } (7×16 matrix) |
| `getTopUsers` | GET `/api/dashboard/top-users` | startDate, endDate, limit | { data: TopUser[] } |
| `getTrends` | GET `/api/dashboard/trends` | startDate, endDate, granularity(week/month) | { data: Trend[] } |

**Routes** — tất cả require `authenticate` + `authorize('admin')`:
```js
router.get('/overview',   authenticate, authorize('admin'), dashboardController.getOverview);
router.get('/room-usage', authenticate, authorize('admin'), dashboardController.getRoomUsage);
router.get('/peak-hours', authenticate, authorize('admin'), dashboardController.getPeakHours);
router.get('/top-users',  authenticate, authorize('admin'), dashboardController.getTopUsers);
router.get('/trends',     authenticate, authorize('admin'), dashboardController.getTrends);
```

---

## PHẦN 2: FRONTEND

### 4. Cài dependencies

```bash
npm install recharts date-fns
```

### 5. DashboardPage

**`src/pages/DashboardPage.jsx`**

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Dashboard                    [7 ngày ▾] [Từ] [Đến]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ 📋 156   │ │ ✅ 120    │ │ ❌ 18     │ │ 🟡 18    │    │
│ │ Tổng     │ │ Đã duyệt │ │ Từ chối   │ │ Chờ duyệt│    │
│ │ booking  │ │ 76.9%    │ │ 11.5%    │ │ 11.5%    │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                          │
│ ┌──────────────────────┐ ┌──────────────────────┐       │
│ │ 📊 Tần suất phòng     │ │ 🔥 Heatmap giờ cao điểm│      │
│ │                       │ │                       │       │
│ │ Phòng A1 ████████ 45 │ │      T2 T3 T4 T5 T6  │       │
│ │ Phòng B2 ██████ 38   │ │ 08:00 ░░ ██ ░░ ██ ░░ │       │
│ │ Phòng C3 █████ 32    │ │ 09:00 ██ ██ ██ ██ ██ │       │
│ │ Phòng D4 ███ 20      │ │ 10:00 ██ ░░ ██ ░░ ██ │       │
│ │ Phòng E5 ██ 15       │ │ 14:00 ░░ ██ ░░ ██ ░░ │       │
│ │                       │ │ 15:00 ██ ██ ██ ░░ ░░ │       │
│ └──────────────────────┘ └──────────────────────┘       │
│                                                          │
│ ┌──────────────────────┐ ┌──────────────────────┐       │
│ │ 👤 Top người đặt      │ │ 📈 Xu hướng booking    │      │
│ │                       │ │                       │       │
│ │ 1. Nguyễn A   45 lần │ │ ╱╲    ╱╲              │       │
│ │ 2. Trần B     38 lần │ │╱  ╲╱╱  ╲╱╲            │       │
│ │ 3. Lê C       32 lần │ │          ╲╱            │       │
│ │ 4. Phạm D     20 lần │ │ W22 W23 W24 W25 W26  │       │
│ │ 5. Hoàng E    15 lần │ │                       │       │
│ └──────────────────────┘ └──────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 6. Components

#### `src/components/dashboard/StatCard.jsx`
- Props: icon, label, value, percentage, color
- Glassmorphism card, số lớn ở giữa, percentage nhỏ ở dưới
- Hover: subtle glow effect

#### `src/components/dashboard/RoomUsageChart.jsx`
- Horizontal bar chart (Recharts `BarChart`)
- Mỗi bar = 1 phòng, chiều dài = booking count
- Tooltip: hiện booking count + total hours
- Gradient fill bars

#### `src/components/dashboard/PeakHoursHeatmap.jsx`
- Grid 7 cột (T2-CN) × 16 hàng (07:00-22:00)
- Mỗi ô màu từ nhạt → đậm tùy booking count
- Color scale: trắng → vàng → cam → đỏ
- Tooltip khi hover: "Thứ 3, 09:00: 12 bookings"

#### `src/components/dashboard/TopUsersTable.jsx`
- Table top 10: STT, Tên, Email, Số lượt đặt, Tổng giờ
- Highlight hàng đầu tiên
- Avatar placeholder

#### `src/components/dashboard/TrendChart.jsx`
- Line chart (Recharts `LineChart`)
- 3 lines: Total (xanh), Approved (xanh lá), Rejected (đỏ)
- X-axis: tuần/tháng, Y-axis: booking count
- Tooltip + dots on hover

#### `src/components/dashboard/DateRangeFilter.jsx`
- Quick buttons: 7 ngày, 30 ngày, 3 tháng
- Custom range: date picker từ – đến
- Active button highlighted

---

## Cấu trúc file tạo mới

```
backend/src/
├── repositories/dashboard.repository.js  ★ MỚI
├── services/dashboard.service.js         ★ MỚI
├── controllers/dashboard.controller.js   ★ MỚI
├── routes/dashboard.routes.js            ★ MỚI
└── routes/index.js                       (sửa — mount route)

frontend/src/
├── services/dashboard.service.js          ★ MỚI
├── pages/
│   ├── DashboardPage.jsx                  (sửa — thay skeleton bằng charts)
│   └── DashboardPage.css                  (sửa)
├── components/dashboard/
│   ├── StatCard.jsx                       ★ MỚI
│   ├── StatCard.css                       ★ MỚI
│   ├── RoomUsageChart.jsx                 ★ MỚI
│   ├── PeakHoursHeatmap.jsx               ★ MỚI
│   ├── PeakHoursHeatmap.css               ★ MỚI
│   ├── TopUsersTable.jsx                  ★ MỚI
│   ├── TrendChart.jsx                     ★ MỚI
│   └── DateRangeFilter.jsx                ★ MỚI
```

---

## Tiêu chí hoàn thành

- [ ] API overview trả đúng thống kê tổng quan
- [ ] API room-usage trả đúng tần suất sử dụng từng phòng
- [ ] API peak-hours trả đúng heatmap data
- [ ] API top-users trả đúng top N người đặt
- [ ] API trends trả đúng xu hướng theo week/month
- [ ] 4 stat cards hiển thị đúng số liệu
- [ ] Bar chart phòng hiển thị đúng
- [ ] Heatmap giờ cao điểm hiển thị đúng, có tooltip
- [ ] Top users table hiển thị đúng
- [ ] Trend line chart hiển thị đúng
- [ ] Date range filter thay đổi → tất cả charts cập nhật
- [ ] Chỉ admin truy cập được dashboard
- [ ] Responsive trên tablet
