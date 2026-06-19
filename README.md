# 🏢 RoomSync - Hệ thống Quản lý Phòng họp (Meeting Room Management System)

RoomSync là ứng dụng hỗ trợ quản lý phòng họp, đặt phòng họp (booking), quản lý thiết bị, kiểm tra trạng thái phòng trống, duyệt yêu cầu đặt phòng và báo cáo thống kê. Dự án sử dụng **React (Vite)** cho Frontend, **Express** & **Prisma (PostgreSQL)** cho Backend.

---

## 🛠️ Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
*   [Node.js](https://nodejs.org/) (Khuyên dùng phiên bản **LTS v20 trở lên**)
*   [Docker](https://www.docker.com/) & **Docker Compose** (Để chạy nhanh toàn bộ môi trường hoặc cơ sở dữ liệu)
*   **PostgreSQL** (Nếu bạn chọn chạy cơ sở dữ liệu trực tiếp trên máy thay vì dùng Docker)

---

## 🚀 Hướng dẫn khởi chạy dự án

Có 2 cách để khởi chạy dự án: **Chạy nhanh bằng Docker (Khuyên dùng)** hoặc **Chạy thủ công từng phần**.

### 🐳 Cách 1: Sử dụng Docker & Docker Compose (Khuyên dùng)

Cách này sẽ tự động thiết lập và chạy cơ sở dữ liệu PostgreSQL, Backend API và Frontend React trong các container Docker.

**Bước 1:** Khởi chạy các dịch vụ Docker (chạy ở chế độ background):
```bash
docker compose up -d
```

**Bước 2:** Chạy migrations để khởi tạo cấu trúc cơ sở dữ liệu và seed dữ liệu mẫu:
```bash
# Tạo cấu trúc các bảng dữ liệu
docker exec -it roomsync_backend npx prisma migrate deploy

# Khởi tạo dữ liệu mẫu (Tài khoản, Phòng họp mẫu, v.v...)
docker exec -it roomsync_backend npx prisma db seed
```

**Bước 3:** Truy cập ứng dụng:
*   **Giao diện người dùng (Frontend):** [http://localhost:5173](http://localhost:5173)
*   **Cổng API Backend:** [http://localhost:5000](http://localhost:5000)

**Bước 4:** Để dừng các dịch vụ:
```bash
docker compose down
```

---

### 💻 Cách 2: Chạy thủ công từng phần (Dành cho lập trình viên)

Cách này phù hợp khi bạn cần chỉnh sửa code liên tục ở Frontend/Backend và muốn theo dõi logs trực tiếp ở máy cá nhân.

#### ⚡ Mẹo chạy nhanh từ Thư mục gốc (Root)
Tại thư mục gốc của dự án, bạn có thể cài đặt và khởi chạy cả Backend và Frontend đồng thời:
*   **Cài đặt thư viện cho cả hai:**
    ```bash
    npm run install:all
    ```
*   **Khởi chạy song song cả hai:**
    ```bash
    npm run dev
    ```

---

#### 1. Khởi chạy nhanh Cơ sở dữ liệu (PostgreSQL) bằng Docker
Nếu không muốn cài đặt PostgreSQL thủ công trên máy, bạn có thể chạy chỉ riêng cơ sở dữ liệu từ file `docker-compose.yml`:
```bash
docker compose up -d db
```
*Cơ sở dữ liệu sẽ chạy tại cổng mặc định `5432`.*

#### 2. Cài đặt và khởi chạy Backend
**Bước 2.1:** Di chuyển vào thư mục backend:
```bash
cd backend
```

**Bước 2.2:** Tạo file cấu hình môi trường `.env` từ file mẫu:
```bash
cp .env.example .env
```
*(Trên Windows PowerShell, sử dụng lệnh: `copy .env.example .env`)*

**Bước 2.3:** Cài đặt các thư viện phụ thuộc:
```bash
npm install
```

**Bước 2.4:** Khởi chạy Prisma client, migration và seed dữ liệu mẫu:
```bash
# Tạo prisma client dựa trên schema
npx prisma generate

# Tạo các bảng cơ sở dữ liệu
npx prisma migrate dev --name init

# Gieo dữ liệu mẫu (Seed data)
npx prisma db seed
```

**Bước 2.5:** Khởi động Backend API ở chế độ phát triển:
```bash
npm run dev
```
*API Backend sẽ chạy tại: [http://localhost:5000](http://localhost:5000)*

#### 3. Cài đặt và khởi chạy Frontend
Mở một terminal mới tại thư mục gốc của dự án.

**Bước 3.1:** Di chuyển vào thư mục frontend:
```bash
cd frontend
```

**Bước 3.2:** Cài đặt các thư viện phụ thuộc:
```bash
npm install
```

**Bước 3.3:** Khởi động ứng dụng React + Vite:
```bash
npm run dev
```
*Giao diện Frontend sẽ chạy tại: [http://localhost:5173](http://localhost:5173)*

---

## 🔑 Tài khoản đăng nhập dùng thử (Seed Data)

Hệ thống đi kèm dữ liệu mẫu được khởi tạo sẵn với các phân quyền khác nhau. Tất cả tài khoản sử dụng chung một mật khẩu:

*   **Mật khẩu mặc định:** `Password123!`

| Vai trò (Role) | Email đăng nhập | Tên người dùng | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | Admin User | Quản lý phòng họp, cấu hình hệ thống, xem dashboard |
| **Approver** | `approver@company.com` | Approver User | Duyệt/Từ chối yêu cầu đặt phòng họp |
| **User** | `user1@company.com` | Nguyễn Văn A | Đặt phòng họp, xem lịch phòng, quản lý templates cá nhân |
| **User** | `user2@company.com` | Trần Thị B | Đặt phòng họp, xem lịch phòng, quản lý templates cá nhân |

---

## 📂 Cấu trúc thư mục chính

```text
Room-management/
├── backend/               # Mã nguồn API (NodeJS/Express)
│   ├── prisma/            # Schema và Seed script của Prisma ORM
│   └── src/               # Thư mục chứa controllers, routes, middlewares
├── frontend/              # Giao diện người dùng (ReactJS / Vite)
│   ├── src/               # Components, pages, contexts, hooks, assets
│   └── index.html
├── plans/                 # Các tài liệu thiết kế và kế hoạch phát triển dự án
├── docker-compose.yml     # File cấu hình Docker Compose (DB + BE + FE)
└── README.md              # File hướng dẫn này
```

---

## 🛠️ Một số lệnh hữu ích cho Developer

*   **Xem Prisma Studio** (Trình giao diện quản lý DB trực quan):
    ```bash
    cd backend
    npx prisma studio
    ```
*   **Format code bằng Prettier** (Backend):
    ```bash
    cd backend
    npm run format
    ```
*   **Kiểm tra lỗi Lint** (Frontend & Backend):
    ```bash
    npm run lint
    ```
