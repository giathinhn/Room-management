# 📋 Master Plan — Tổng quan các Plans

## Sơ đồ phụ thuộc

```
Plan 00: Project Setup & Database
    │
    ▼
Plan 01: Auth Backend (JWT, Roles)
    │
    ├──▶ Plan 02: Auth Frontend (Login/Register UI)
    │        │
    │        ▼
    │    Plan 03: Room Management (CRUD FE + BE)
    │        │
    │        ▼
    │    Plan 04: Booking System (Core — FE + BE)  ◀── CỐT LÕI
    │        │
    │        ├──▶ Plan 05: Recurring Booking ──────┐
    │        ├──▶ Plan 06: Calendar View ──────────┤
    │        ├──▶ Plan 07: Search & Export ─────────┤
    │        ├──▶ Plan 08: Email Notifications ────┤
    │        ├──▶ Plan 10: Dashboard & Analytics ──┤ ĐỘC LẬP
    │        ├──▶ Plan 11: In-app Notifications ───┤ VỚI NHAU
    │        ├──▶ Plan 12: Comments & Suggestions ─┤
    │        ├──▶ Plan 13: Booking Templates ──────┤
    │        ├──▶ Plan 15: User Management ────────┤
    │        ├──▶ Plan 16: AI Chatbot ─────────────┤
    │        ├──▶ Plan 17: Floor Map ──────────────┤
    │        ├──▶ Plan 18: Dark Mode ──────────────┤
    │        ├──▶ Plan 19: Favorite Rooms ─────────┤
    │        ├──▶ Plan 20: QR Code Booking ────────┤
    │        ├──▶ Plan 21: Auto-release (No-Show) ─┤
    │        ├──▶ Plan 22: Personal Profile ───────┤
    │        └──▶ Plan 23: Settings Management ────┘
    │
    ├──▶ Plan 14: i18n (nên làm sau khi UI ổn định)
    │
    ▼
Plan 09: Swagger & Docker (làm cuối cùng)
```

## Thứ tự thực hiện bắt buộc

| Thứ tự | Plan                                 | Mô tả                                                   | Thời lượng |
| :------: | ------------------------------------ | --------------------------------------------------------- | :-----------: |
|    1    | [Plan 00](plan-00-project-setup.md)   | Project setup, Docker, Prisma schema (8 bảng), seed data |     1–2h     |
|    2    | [Plan 01](plan-01-auth-backend.md)    | Auth backend: register, login, JWT, roles                 |    1.5–2h    |
|    3    | [Plan 02](plan-02-auth-frontend.md)   | Auth frontend: login/register UI, context, layout         |    1.5–2h    |
|    4    | [Plan 03](plan-03-room-management.md) | Room CRUD: backend API + frontend card grid               |     2–3h     |
|    5    | [Plan 04](plan-04-booking-system.md)  | Booking system: tạo, duyệt, hủy, kiểm tra trùng      |     3–4h     |

## Sau Plan 04 — Làm theo thứ tự bất kỳ

| Plan                                      | Mô tả                                            | Thời lượng |
| ----------------------------------------- | -------------------------------------------------- | :-----------: |
| [Plan 05](plan-05-recurring-booking.md)    | Đặt phòng định kỳ (daily/weekly/monthly)     |    1.5–2h    |
| [Plan 06](plan-06-calendar-view.md)        | Calendar view (FullCalendar)                       |     2–3h     |
| [Plan 07](plan-07-search-export.md)        | Tìm phòng trống nâng cao + Export Excel        |    1–1.5h    |
| [Plan 08](plan-08-notifications.md)        | Email thông báo + nhắc lịch                    |    1–1.5h    |
| [Plan 10](plan-10-dashboard.md)            | 📊 Dashboard thống kê (Admin) — charts, heatmap |     2–3h     |
| [Plan 11](plan-11-notifications-inapp.md)  | 🔔 In-app Notifications + SSE real-time            |    2–2.5h    |
| [Plan 12](plan-12-comments-suggestions.md) | 💬 Comments + 🔄 Đề xuất phòng thay thế       |    1.5–2h    |
| [Plan 13](plan-13-booking-templates.md)    | 📋 Booking Templates (mẫu đặt phòng)           |    1–1.5h    |
| [Plan 15](plan-15-user-management.md)      | 👥 Quản lý User (Admin) — list, role, status    |     2–3h     |
| [Plan 16](plan-16-ai-chatbot.md)          | 🤖 AI Chatbot trợ lý đặt phòng (Gemini)         |     3–4h     |
| [Plan 17](plan-17-floor-map.md)           | 🗺️ Floor Map (Sơ đồ phòng trực quan)           |     3–4h     |
| [Plan 18](plan-18-dark-mode.md)           | 🌓 Chế độ tối (Dark Mode / Theme Switcher)     |    1.5–2h    |
| [Plan 19](plan-19-favorite-rooms.md)      | ⭐ Phòng họp yêu thích (Favorite/Pinned Rooms) |     2–3h     |
| [Plan 20](plan-20-qr-code-booking.md)      | 📱 Mã QR Đặt phòng nhanh (Quick Booking QR)   |     2–3h     |
| [Plan 21](plan-21-auto-release-no-show.md) | ⏳ Tự động giải phóng phòng (Auto-release)     |     2–3h     |
| [Plan 22](plan-22-personal-profile.md)    | 👤 Hồ sơ cá nhân (avatar, mật khẩu, thống kê) |     2–3h     |
| [Plan 23](plan-23-settings.md)            | ⚙️ Cài đặt (nhận thông báo, Admin config)     |     2–3h     |

## Nên làm sau khi UI ổn định

| Plan                      | Mô tả                                    | Thời lượng |
| ------------------------- | ------------------------------------------ | :-----------: |
| [Plan 14](plan-14-i18n.md) | 🌐 Đa ngôn ngữ (Tiếng Việt + English) |     2–3h     |

## Luôn làm cuối cùng

| Plan                                | Mô tả                              | Thời lượng |
| ----------------------------------- | ------------------------------------ | :-----------: |
| [Plan 09](plan-09-swagger-docker.md) | Swagger API docs + Docker production |    1–1.5h    |

---

## Tổng thời lượng ước tính: **42.5–62 giờ**

## Tổng quan tính năng mới (Plan 10–21)

| Plan | Feature                | Highlight                                                             |
| ---- | ---------------------- | --------------------------------------------------------------------- |
| 10   | Dashboard              | Recharts: bar chart, heatmap, line chart, stat cards                  |
| 11   | Notifications          | SSE real-time, bell icon + badge, notification dropdown               |
| 12   | Comments + Suggestions | Thread comments trên booking, smart room/time alternatives           |
| 13   | Templates              | Lưu & đặt từ mẫu, save-as-template, max 10/user                  |
| 14   | i18n                   | react-i18next, VI/EN, error codes, language switcher                  |
| 15   | User Management        | Bảng quản lý người dùng, đổi role, kích hoạt/vô hiệu hóa |
| 16   | AI Chatbot             | Trợ lý AI đặt phòng, tra cứu lịch họp qua Gemini API (`gemini-2.5-flash`) |
| 17   | Floor Map              | Bản đồ phòng họp trực quan (SVG/Grid) hiển thị trạng thái real-time |
| 18   | Dark Mode              | Chế độ tối (Dark Mode) sử dụng CSS Variables + ThemeProvider |
| 19   | Favorite Rooms         | Phòng họp yêu thích (Favorite) tự động ghim lên đầu danh sách |
| 20   | QR Code Booking        | Sinh mã QR in ấn & Trang đặt phòng nhanh trên Mobile `/quick-book` |
| 21   | Auto-release           | Tự động hủy đặt phòng sau 15 phút nếu người dùng không Check-in      |
| 22   | Personal Profile       | Thống kê đặt phòng, đổi mật khẩu, upload avatar bằng multer           |
| 23   | Settings Management    | Lưu cấu hình nhận thông báo (email/in-app), cấu hình hệ thống Admin  |

## Database mới & Thay đổi Database

| Bảng / Thay đổi       | Plan    | Mô tả                                                       |
| --------------------- | ------- | ----------------------------------------------------------- |
| `notifications`       | Plan 11 | In-app notifications, SSE events                            |
| `booking_comments`    | Plan 12 | Thread comments trên booking                                |
| `booking_templates`   | Plan 13 | Mẫu đặt phòng nhanh                                         |
| `chat_messages`       | Plan 16 | Lưu lịch sử hội thoại của AI Chatbot                         |
| `rooms` (cập nhật)    | Plan 17 | Thêm `floor`, `mapX`, `mapY`, `mapWidth`, `mapHeight`        |
| `_UserFavoriteRooms`  | Plan 19 | Bảng liên kết nhiều-nhiều lưu vết phòng yêu thích của User   |
| `users` (cập nhật)    | Plan 22 | Thêm `phone`, `avatar`, `department`                        |
| `user_settings`       | Plan 23 | Bảng lưu cấu hình cá nhân (ngôn ngữ, theme, thông báo)      |
| `system_settings`     | Plan 23 | Bảng cấu hình vận hành hệ thống của Admin (work hours,...)   |

---

## Ghi chú cho Vibe Coding

1. **Mỗi plan = 1 session**: Mỗi plan được thiết kế để hoàn thành trong 1 session code. Bắt đầu session, mở file plan, code theo checklist.
2. **Copy checklist vào prompt**: Khi bắt đầu code với AI, copy nội dung file plan tương ứng vào prompt. Plan đã chứa đủ: file structure, function signatures, validation rules, error cases.
3. **Tiêu chí hoàn thành**: Mỗi plan có checklist cuối — kiểm tra trước khi chuyển sang plan tiếp theo.
4. **Plan 05–13 & 15–23 độc lập**: Sau Plan 04, bạn có thể làm các plan này theo thứ tự tùy thích, hoặc song song nếu nhiều người.
5. **Plan 14 nên làm cuối**: i18n cần dịch tất cả text, nên làm khi UI đã ổn định để tránh dịch lại.
6. **Chạy test sau mỗi plan**: Sau mỗi plan, test thủ công các tiêu chí hoàn thành trước khi tiếp tục.
7. **Gợi ý thứ tự hay cho features mới**:

   - Plan 11 (Notifications) trước → vì các plan khác có thể tận dụng notification system
   - Plan 12 (Comments + Suggestions) → cải thiện UX booking
   - Plan 17 (Floor Map) → cải thiện visual trực quan của hệ thống phòng họp
   - Plan 18 (Dark Mode) → tối ưu trải nghiệm đọc và thẩm mỹ giao diện
   - Plan 19 (Favorite Rooms) → tăng hiệu suất tìm kiếm và đặt phòng thường dùng
   - Plan 20 (QR Code Booking) → đặt phòng cực nhanh tại thực địa bằng điện thoại
   - Plan 21 (Auto-release) → giải phóng tài nguyên phòng họp bị bỏ quên
   - Plan 10 (Dashboard) → cần đủ data để có chart đẹp
   - Plan 13 (Templates) → productivity feature
   - Plan 15 (User Management) → quản lý người dùng
   - Plan 16 (AI Chatbot) → tăng tiện ích trải nghiệm người dùng
   - Plan 22 (Personal Profile) & Plan 23 (Settings) → Nên làm sau các tính năng cốt lõi để đồng bộ cài đặt nhận thông báo và tùy chọn cá nhân
   - Plan 14 (i18n) → cuối cùng vì touch mọi file
