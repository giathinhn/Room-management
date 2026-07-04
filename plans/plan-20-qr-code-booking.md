# Plan 20 — Mã QR Đặt phòng nhanh (Quick Booking QR Code)

> **Mục tiêu**: Tích hợp tính năng sinh mã QR Code cho từng phòng họp. Người dùng quét mã QR bằng thiết bị di động để xem trạng thái phòng hiện tại và thực hiện đặt phòng nhanh (15p, 30p, 1h) ngay lập tức từ thời điểm hiện tại.
> **Thời lượng ước tính**: 2–3 giờ
> **Phụ thuộc**: Plan 03 (Room Management), Plan 04 (Booking System)
> **Độc lập với**: Plan 05, Plan 06, Plan 07, Plan 08, Plan 10, Plan 11, Plan 12, Plan 13, Plan 14, Plan 15, Plan 16, Plan 17, Plan 18, Plan 19

---

## Tổng quan

Sau khi hoàn thành plan này:

- Admin/Người dùng có thể xem mã QR riêng của từng phòng họp tại trang quản lý hoặc chi tiết phòng.
- Hệ thống hỗ trợ chế độ "Xem bản in" (Print View) để dễ dàng in mã QR ra giấy kèm tên phòng và vị trí để dán trước cửa phòng họp thực tế.
- Khi người dùng quét mã QR bằng camera điện thoại, họ sẽ được dẫn tới một trang đặt phòng nhanh tối ưu cho giao diện di động (`/rooms/:roomId/quick-book`).
- Trang đặt phòng nhanh hiển thị trạng thái thực tế của phòng (Trống / Đang họp / Sắp họp) và cho phép điền nhanh tiêu đề họp, chọn nhanh thời lượng (15 phút, 30 phút, 1 giờ) và tạo lịch đặt phòng bắt đầu ngay lập tức từ thời điểm hiện tại (nếu phòng đang trống).

---

## ⚙️ BACKEND IMPLEMENTATION

Backend không cần thay đổi cấu trúc Database. Chúng ta chỉ cần tận dụng các API hiện có:

- `GET /api/rooms/:id` — Lấy chi tiết phòng và các lịch đặt hiện có để kiểm tra trạng thái.
- `POST /api/bookings` — Tạo yêu cầu đặt phòng (sử dụng startTime là thời điểm hiện tại).

---

## 💻 FRONTEND IMPLEMENTATION

### 1. Thư viện sinh mã QR Code

Cài đặt thư viện tạo mã QR ở Frontend:

```bash
npm install qrcode.react --prefix frontend
```

### 2. Trang in mã QR (Print-friendly QR Code Page)

**`frontend/src/pages/RoomQRPrintPage.jsx` [NEW]**:
Một trang web tối giản, tối ưu cho việc in ấn (CSS `@media print`).

- Hiển thị tên phòng họp (cỡ chữ lớn), vị trí (Tầng, Toà nhà).
- Hiển thị mã QR Code kích thước lớn chứa URL: `{domain}/rooms/{roomId}/quick-book`.
- Nút "In trang này" (`window.print()`).

### 3. Trang đặt phòng nhanh trên Di động (Mobile-friendly Quick Book Page)

**`frontend/src/pages/QuickBookPage.jsx` [NEW]**:
Địa chỉ truy cập: `/rooms/:roomId/quick-book`.

- **Luồng xử lý (Middleware / Guard)**:
  - Kiểm tra xem người dùng đã đăng nhập chưa.
  - Nếu chưa, chuyển hướng sang trang Login và lưu lại đường dẫn `/rooms/:roomId/quick-book` vào query params để tự động điều hướng quay lại sau khi đăng nhập thành công.
- **Giao diện trang:**
  - Thiết kế dọc (layout mobile-first), nút bấm to, dễ thao tác bằng một tay.
  - Hiển thị thông tin phòng (Tên, Sức chứa, Thiết bị).
  - **Trạng thái phòng real-time:**
    - **Phòng đang trống:** Hiển thị màu xanh lá + Badge "Trống hiện tại".
    - **Phòng đang bận:** Hiển thị màu đỏ + Badge "Đang bận họp đến {endTime}" + Thời gian bận còn lại (đếm ngược).
    - **Phòng sắp bận:** Hiển thị màu cam + Badge "Sắp bận họp sau {số phút} phút nữa".
  - **Form đặt nhanh (Chỉ hiển thị khi phòng đang trống):**
    - Input: *Tiêu đề cuộc họp* (Mặc định gợi ý: "Họp nhanh - {Tên User}").
    - Lựa chọn nhanh thời lượng bằng các nút bấm to:
      - `[ 15 Phút ]`
      - `[ 30 Phút ]`
      - `[ 1 Giờ ]`
    - *Lưu ý:* Nếu phòng sắp bận sau X phút (X < 60), hệ thống chỉ cho phép chọn thời lượng đặt tối đa là X phút để tránh trùng lịch.
    - Nút bấm xác nhận: **[ ĐẶT PHÒNG NGAY ]**
- **Xử lý gọi API:**
  - Gửi request `POST /api/bookings` với:
    - `roomId`
    - `title`
    - `startTime`: thời điểm hiện tại (`new Date().toISOString()`)
    - `endTime`: `new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()`

### 4. Nút xem mã QR trên thẻ phòng hoặc trang quản trị

* Trên giao diện `RoomCard.jsx` hoặc trang danh sách phòng quản lý, thêm một biểu tượng mã QR nhỏ bên cạnh các nút chức năng.
* Click vào biểu tượng sẽ mở Modal hiển thị QR Code của phòng họp kèm nút "Tải xuống QR Code" (dưới dạng ảnh PNG) hoặc nút "Mở trang in" dẫn tới `/rooms/:roomId/qr`.

---

## Cấu trúc file tạo mới & sửa

```text
frontend/
├── package.json                       (sửa — thêm dependency qrcode.react)
├── src/
│   ├── pages/
│   │   ├── RoomQRPrintPage.jsx        ★ MỚI (Trang in mã QR)
│   │   ├── RoomQRPrintPage.css        ★ MỚI
│   │   ├── QuickBookPage.jsx          ★ MỚI (Trang đặt phòng nhanh trên Mobile)
│   │   └── QuickBookPage.css          ★ MỚI
│   ├── components/rooms/
│   │   ├── RoomCard.jsx               (sửa — thêm icon/modal mã QR)
│   │   └── RoomQRModal.jsx            ★ MỚI (Modal hiển thị & tải QR)
│   └── App.jsx                        (sửa — thêm các routes mới cho QR & Quick Book)
```

---

## 🏁 Tiêu chí hoàn thành (Checklist)

- [X] Cài đặt thành công thư viện `qrcode.react` mà không làm lỗi build frontend.
- [X] Giao diện trang in mã QR hiển thị đúng chuẩn, căn giữa, ẩn thanh menu/sidebar chính khi in.
- [X] Quét mã QR dẫn đúng tới URL `/rooms/:roomId/quick-book`.
- [X] Nếu người dùng chưa đăng nhập, quét QR sẽ dẫn họ đi đăng nhập rồi quay trở lại đúng trang đặt phòng nhanh đó.
- [X] Trang đặt phòng nhanh hiển thị chính xác trạng thái thực tế của phòng tại thời điểm quét.
- [X] Tạo đặt phòng nhanh hoạt động đúng thời gian hiện tại (mặc định) nhưng người dùng vẫn có thể sửa thời gian đặt và thời gian kết thúc do người dùng chọn, tự động kiểm tra trùng lịch (ví dụ không cho đặt vượt quá thời gian bắt đầu của ca họp tiếp theo), kiểm tra sức chứa,....
