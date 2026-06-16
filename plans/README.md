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
    │        ├──▶ Plan 05: Recurring Booking ─────┐
    │        ├──▶ Plan 06: Calendar View ─────────┤ ĐỘC LẬP
    │        ├──▶ Plan 07: Search & Export ────────┤ VỚI NHAU
    │        └──▶ Plan 08: Email Notifications ───┘
    │
    ▼
Plan 09: Swagger & Docker (làm cuối cùng)
```

## Thứ tự thực hiện bắt buộc

| Thứ tự | Plan | Mô tả | Thời lượng |
|:------:|------|-------|:----------:|
| 1 | [Plan 00](plan-00-project-setup.md) | Project setup, Docker, Prisma schema, seed data | 1–2h |
| 2 | [Plan 01](plan-01-auth-backend.md) | Auth backend: register, login, JWT, roles | 1.5–2h |
| 3 | [Plan 02](plan-02-auth-frontend.md) | Auth frontend: login/register UI, context, layout | 1.5–2h |
| 4 | [Plan 03](plan-03-room-management.md) | Room CRUD: backend API + frontend card grid | 2–3h |
| 5 | [Plan 04](plan-04-booking-system.md) | Booking system: tạo, duyệt, hủy, kiểm tra trùng | 3–4h |

## Sau Plan 04 — Làm theo thứ tự bất kỳ

| Plan | Mô tả | Thời lượng |
|------|-------|:----------:|
| [Plan 05](plan-05-recurring-booking.md) | Đặt phòng định kỳ (daily/weekly/monthly) | 1.5–2h |
| [Plan 06](plan-06-calendar-view.md) | Calendar view (FullCalendar) | 2–3h |
| [Plan 07](plan-07-search-export.md) | Tìm phòng trống nâng cao + Export Excel | 1–1.5h |
| [Plan 08](plan-08-notifications.md) | Email thông báo + nhắc lịch | 1–1.5h |

## Luôn làm cuối cùng

| Plan | Mô tả | Thời lượng |
|------|-------|:----------:|
| [Plan 09](plan-09-swagger-docker.md) | Swagger API docs + Docker production | 1–1.5h |

---

## Tổng thời lượng ước tính: **15–22 giờ**

## Ghi chú cho Vibe Coding

1. **Mỗi plan = 1 session**: Mỗi plan được thiết kế để hoàn thành trong 1 session code. Bắt đầu session, mở file plan, code theo checklist.

2. **Copy checklist vào prompt**: Khi bắt đầu code với AI, copy nội dung file plan tương ứng vào prompt. Plan đã chứa đủ: file structure, function signatures, validation rules, error cases.

3. **Tiêu chí hoàn thành**: Mỗi plan có checklist cuối — kiểm tra trước khi chuyển sang plan tiếp theo.

4. **Plan 05–08 độc lập**: Sau Plan 04, bạn có thể làm 4 plan này theo thứ tự tùy thích, hoặc song song nếu nhiều người.

5. **Chạy test sau mỗi plan**: Sau mỗi plan, test thủ công các tiêu chí hoàn thành trước khi tiếp tục.
