# Plan 19 — Phòng họp yêu thích (Favorite/Pinned Rooms)

> **Mục tiêu**: Cho phép người dùng "ghim" hoặc "yêu thích" (star/favorite) các phòng họp thường dùng. Các phòng họp yêu thích sẽ tự động được ưu tiên xếp lên đầu danh sách phòng và danh sách chọn phòng khi đặt lịch họp.
> **Thời lượng ước tính**: 2–3 giờ
> **Phụ thuộc**: Plan 03 (Room Management), Plan 04 (Booking System)
> **Độc lập với**: Plan 05, Plan 06, Plan 07, Plan 08, Plan 10, Plan 11, Plan 12, Plan 13, Plan 14, Plan 15, Plan 16, Plan 17, Plan 18

---

## Tổng quan

Sau khi hoàn thành plan này:

- Người dùng có thể nhấn vào biểu tượng Ngôi sao (Star icon) trên thẻ phòng họp để đưa vào danh sách yêu thích.
- Hệ thống lưu trữ trạng thái yêu thích vào database (liên kết theo từng tài khoản), hoạt động đồng bộ trên mọi thiết bị.
- Danh sách phòng họp tại Trang chủ, danh sách phòng trong Form đặt lịch sẽ tự động sắp xếp đưa các phòng yêu thích lên trên cùng kèm hiệu ứng viền nổi bật hoặc huy hiệu (badge) Ngôi sao.
- Thêm bộ lọc nhanh "Chỉ xem phòng yêu thích" trên thanh Toolbar tìm kiếm phòng.

---

## 🗄️ DATABASE & SCHEMA CHANGES

Chúng ta sẽ sử dụng mối quan hệ Nhiều - Nhiều (Many-to-Many) ngầm định (Implicit relations) của Prisma giữa `User` và `Room` để lưu vết các phòng đã được người dùng thích.

### 1. Cập nhật `backend/prisma/schema.prisma`

**Cập nhật model `User`**:

```prisma
model User {
  // ... các fields khác
  favoriteRooms Room[] @relation("UserFavoriteRooms")
}
```

**Cập nhật model `Room`**:

```prisma
model Room {
  // ... các fields khác
  favoritedBy User[] @relation("UserFavoriteRooms")
}
```

### 2. Chạy lệnh Migration

Chạy lệnh sau tại thư mục `backend` để tạo bảng liên kết trong database:

```bash
npx prisma migrate dev --name add_favorite_rooms
```

---

## ⚙️ BACKEND API IMPLEMENTATION

### 1. Routes

Tạo các API endpoint để Toggle trạng thái yêu thích phòng họp.

**`backend/src/routes/room.routes.js` [MODIFY]**:

```javascript
// Thêm các endpoints sau (yêu cầu đăng nhập)
router.post('/:id/favorite', authenticate, roomController.favoriteRoom);
router.delete('/:id/favorite', authenticate, roomController.unfavoriteRoom);
```

### 2. Controller

Xử lý HTTP requests.

**`backend/src/controllers/room.controller.js` [MODIFY]**:

```javascript
const roomController = {
  // ... các controllers hiện có

  async favoriteRoom(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
    
      await roomService.favoriteRoom(userId, id);
      return res.json({
        success: true,
        message: 'Đã thêm phòng họp vào danh sách yêu thích',
      });
    } catch (err) {
      next(err);
    }
  },

  async unfavoriteRoom(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await roomService.unfavoriteRoom(userId, id);
      return res.json({
        success: true,
        message: 'Đã xóa phòng họp khỏi danh sách yêu thích',
      });
    } catch (err) {
      next(err);
    }
  }
};
```

### 3. Service

Xử lý logic kết nối dữ liệu nhiều-nhiều của Prisma.

**`backend/src/services/room.service.js` [MODIFY]**:

```javascript
const roomService = {
  // ... các services hiện có

  async favoriteRoom(userId, roomId) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        favoriteRooms: {
          connect: { id: roomId }
        }
      }
    });
  },

  async unfavoriteRoom(userId, roomId) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        favoriteRooms: {
          disconnect: { id: roomId }
        }
      }
    });
  }
};
```

*Lưu ý:* Khi lấy danh sách phòng họp (`GET /api/rooms`), controller cần kiểm tra xem user hiện tại đã thích phòng đó chưa bằng cách bổ sung include relation hoặc xử lý maps dữ liệu trả về thêm trường `isFavorite: true/false`.

---

## 💻 FRONTEND IMPLEMENTATION

### 1. API Service

**`frontend/src/services/room.service.js` [MODIFY]**:

```javascript
// Thêm 2 phương thức giao tiếp API
export const favoriteRoom = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/favorite`);
  return response.data;
};

export const unfavoriteRoom = async (roomId) => {
  const response = await api.delete(`/rooms/${roomId}/favorite`);
  return response.data;
};
```

### 2. UI Components & Pages

#### A. Nút Star trên Thẻ phòng họp (`RoomCard.jsx`)

* Thêm biểu tượng ngôi sao ở góc thẻ phòng (`react-icons/fi` -> `FiStar` dạng viền và `FiStar` dạng màu tô đặc màu vàng khi đã thích).
* Khi hover vào nút ngôi sao hiển thị tooltip "Yêu thích phòng này".
* Bấm vào nút này sẽ kích hoạt API tương ứng, đổi màu biểu tượng ngay lập tức mà không cần reload trang.

#### B. Logic sắp xếp danh sách phòng

* Khi nhận danh sách phòng từ backend, thực hiện sắp xếp ở frontend đưa các phòng có `isFavorite: true` lên trước:
  ```javascript
  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0; // Giữ nguyên thứ tự ban đầu nếu cùng trạng thái
  });
  ```

#### C. Thêm Filter trên thanh Toolbar (`RoomsPage.jsx`)

* Bổ sung checkbox / switch filter: `"Chỉ hiển thị phòng yêu thích"`
* Khi bật bộ lọc này, frontend tự động lọc danh sách chỉ render những phòng có `isFavorite === true`.

---

## Cấu trúc file tạo mới & sửa

```text
backend/
├── prisma/schema.prisma               (sửa — thêm quan hệ nhiều-nhiều UserFavoriteRooms)
├── src/
│   ├── routes/room.routes.js          (sửa — thêm routes favorite)
│   ├── controllers/room.controller.js  (sửa — thêm API handlers)
│   └── services/room.service.js       (sửa — thêm database query logic)

frontend/src/
├── services/room.service.js           (sửa — thêm gọi API backend)
├── components/rooms/
│   ├── RoomCard.jsx                   (sửa — render nút Star & xử lý click)
│   └── RoomCard.css                   (sửa — style cho nút Star góc thẻ)
└── pages/
    └── RoomsPage.jsx                  (sửa — thêm filter & sắp xếp phòng yêu thích)
```

---

## 🏁 Tiêu chí hoàn thành (Checklist)

- [X] Chạy migration thành công, sinh ra bảng liên kết `_UserFavoriteRooms` trong PostgreSQL.
- [X] Nhấn nút Star trên thẻ phòng họp hoạt động mượt mà (ngôi sao chuyển từ rỗng -> tô vàng).
- [X] Reset/F5 lại trang danh sách phòng vẫn giữ nguyên trạng thái yêu thích.
- [X] Các phòng họp được yêu thích luôn được hiển thị ở vị trí đầu tiên trong danh sách phòng.
- [X] Bộ lọc "Chỉ hiển thị phòng yêu thích" hoạt động chính xác (ẩn toàn bộ các phòng chưa được thả sao).
- [X] Hai tài khoản khác nhau đăng nhập trên cùng một phòng họp thấy trạng thái yêu thích độc lập (không bị lẫn dữ liệu).
