# RoomSync - Hệ Thống Quản Lý Phòng Họp (Room Management)

RoomSync là ứng dụng hỗ trợ đặt phòng họp, quản lý phòng và duyệt yêu cầu đặt phòng. Dự án được chia làm hai phần chính: **Backend** (Node.js + Express + Prisma) và **Frontend** (Vite + React).

---

## 🛠️ Yêu Cầu Hệ Thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
* **Node.js** (Phiên bản khuyến nghị: v18 trở lên)
* **Docker & Docker Desktop** (Dùng để chạy cơ sở dữ liệu PostgreSQL)

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án

Bạn có thể chạy dự án bằng cách kết hợp chạy database qua Docker và ứng dụng qua node cục bộ trên máy.

### Bước 1: Khởi động Database bằng Docker
1. Mở ứng dụng **Docker Desktop** trên máy tính của bạn.
2. Mở Terminal tại thư mục gốc của dự án (`Room-management`) và chạy lệnh sau để khởi động container PostgreSQL:
   ```bash
   docker compose up -d db
   ```

> [!WARNING]
> **Lỗi trùng cổng 5432 (Nếu gặp phải):**  
> Nếu bạn cài PostgreSQL cục bộ trên Windows, dịch vụ Windows Service của nó sẽ chiếm cổng `5432` khiến Docker không chạy được hoặc Prisma kết nối sai database.  
> * **Cách sửa:** Mở PowerShell với quyền Admin và chạy lệnh sau trước khi bật Docker:
>   ```powershell
>   Stop-Service -Name postgresql-x64-18
   Set-Service -Name postgresql-x64-18 -StartupType Manual
>   ```

### Bước 2: Thiết Lập và Chạy Backend
1. Di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Chạy di chuyển cấu trúc cơ sở dữ liệu (Database Migration):
   ```bash
   npm run db:migrate
   ```
   *Nhập tên cho bản migration khi được yêu cầu (ví dụ: `init`).*
4. Nạp dữ liệu mẫu (Seed Database):
   ```bash
   npm run db:seed
   ```
5. Khởi chạy Server Backend dưới chế độ phát triển (Development Mode):
   ```bash
   npm run dev
   ```
   Server backend sẽ chạy tại địa chỉ: **[http://localhost:5000](http://localhost:5000)**

### Bước 3: Thiết Lập và Chạy Frontend
1. Mở một Terminal mới và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy ứng dụng Frontend:
   ```bash
   npm run dev
   ```
   Ứng dụng frontend sẽ chạy tại địa chỉ: **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Tài Khoản Đăng Nhập Mẫu (Mặc định sau khi Seed)

Sau khi chạy lệnh `npm run db:seed`, hệ thống sẽ có sẵn các tài khoản thử nghiệm sau (tất cả dùng chung mật khẩu **`Password123!`**):

| Email | Vai trò (Role) | Mô tả |
| :--- | :--- | :--- |
| `admin@company.com` | **Admin** | Quản lý hệ thống, quản lý phòng |
| `approver@company.com` | **Approver** | Người phê duyệt yêu cầu đặt phòng |
| `user1@company.com` | **User** | Nhân viên đặt phòng |
| `user2@company.com` | **User** | Nhân viên đặt phòng |

---

## 🛑 Cách Tắt Dự Án Khi Dùng Xong

Khi muốn dừng chạy ứng dụng để giải phóng tài nguyên máy tính:

1. **Dừng Backend & Frontend:** Nhấn tổ hợp phím **`Ctrl + C`** tại các màn hình terminal tương ứng (nhấn `Y` nếu có hỏi xác nhận).
2. **Dừng Database Docker:** Tại thư mục gốc của dự án, chạy lệnh:
   ```bash
   docker compose down
   ```
   *Lệnh này sẽ tắt container database sạch sẽ mà không làm mất dữ liệu đã lưu trữ.*
3. **Tắt Docker Desktop:** Nhấp chuột phải vào biểu tượng Docker ở khay hệ thống (System Tray) và chọn **Quit Docker Desktop**.
