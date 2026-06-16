# Plan 00 — Project Setup & Database Foundation

> **Mục tiêu**: Khởi tạo toàn bộ project skeleton, cấu hình Docker, thiết lập database schema với Prisma, và seed data mẫu.
> **Thời lượng ước tính**: 1–2 giờ
> **Phụ thuộc**: Không (đây là plan đầu tiên)

---

## Tổng quan

Plan này tạo nền tảng cho toàn bộ dự án. Sau khi hoàn thành, bạn sẽ có:

- Backend Express server chạy được
- Frontend React (Vite) chạy được
- PostgreSQL database với schema đầy đủ
- Docker Compose chạy cả 3 service
- Seed data mẫu để test

---

## Checklist

### 1. Khởi tạo Backend (Node.js + Express)

```
backend/
├── src/
│   ├── app.js                 # Express app setup (cors, json parser, routes)
│   ├── server.js              # Entry point (listen port)
│   ├── config/
│   │   ├── env.js             # Đọc biến môi trường từ .env
│   │   └── database.js        # Prisma client singleton
│   ├── middlewares/
│   │   └── error.middleware.js # Global error handler
│   ├── routes/
│   │   └── index.js           # Route aggregator (health check: GET /api/health)
│   └── utils/
│       └── ApiError.js        # Custom error class (statusCode, message)
├── prisma/
│   ├── schema.prisma          # Toàn bộ schema
│   └── seed.js                # Seed data
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── Dockerfile
└── package.json
```

**Dependencies cần cài:**

```json
{
  "dependencies": {
    "express": "^4.18",
    "cors": "^2.8",
    "@prisma/client": "^5",
    "dotenv": "^16"
  },
  "devDependencies": {
    "prisma": "^5",
    "nodemon": "^3",
    "eslint": "^8",
    "prettier": "^3"
  }
}
```

**Scripts:**

```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "db:migrate": "npx prisma migrate dev",
  "db:seed": "npx prisma db seed",
  "db:studio": "npx prisma studio",
  "lint": "eslint src/",
  "format": "prettier --write src/"
}
```

### 2. Prisma Schema (Toàn bộ database)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  admin
  approver
  user
}

enum BookingStatus {
  pending
  approved
  rejected
  cancelled
}

enum Frequency {
  daily
  weekly
  monthly
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  fullName      String    @map("full_name") @db.VarChar(100)
  role          Role      @default(user)
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  bookings          Booking[]       @relation("UserBookings")
  approvedBookings  Booking[]       @relation("ApprovedBookings")
  refreshTokens     RefreshToken[]
  recurringBookings RecurringBooking[]

  @@map("users")
}

model Room {
  id        String   @id @default(uuid())
  name      String   @unique @db.VarChar(100)
  capacity  Int
  location  String   @db.VarChar(200)
  equipment String[]
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  bookings          Booking[]
  recurringBookings RecurringBooking[]

  @@map("rooms")
}

model Booking {
  id              String        @id @default(uuid())
  roomId          String        @map("room_id")
  userId          String        @map("user_id")
  title           String        @db.VarChar(200)
  startTime       DateTime      @map("start_time")
  endTime         DateTime      @map("end_time")
  status          BookingStatus @default(pending)
  approvedBy      String?       @map("approved_by")
  approvedAt      DateTime?     @map("approved_at")
  rejectionReason String?       @map("rejection_reason")
  recurringId     String?       @map("recurring_id")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  room      Room              @relation(fields: [roomId], references: [id])
  user      User              @relation("UserBookings", fields: [userId], references: [id])
  approver  User?             @relation("ApprovedBookings", fields: [approvedBy], references: [id])
  recurring RecurringBooking? @relation(fields: [recurringId], references: [id])

  @@map("bookings")
}

model RecurringBooking {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  roomId    String    @map("room_id")
  frequency Frequency
  startDate DateTime  @map("start_date") @db.Date
  endDate   DateTime  @map("end_date") @db.Date
  startTime DateTime  @map("start_time") @db.Time()
  endTime   DateTime  @map("end_time") @db.Time()
  createdAt DateTime  @default(now()) @map("created_at")

  user     User      @relation(fields: [userId], references: [id])
  room     Room      @relation(fields: [roomId], references: [id])
  bookings Booking[]

  @@map("recurring_bookings")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @db.VarChar(500)
  expiresAt DateTime @map("expires_at")
  isRevoked Boolean  @default(false) @map("is_revoked")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("refresh_tokens")
}
```

### 3. Seed Data

Tạo dữ liệu mẫu trong `prisma/seed.js`:

| Dữ liệu          | Chi tiết                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Users**    | 1 admin (`admin@company.com`), 1 approver (`approver@company.com`), 2 users (`user1@company.com`, `user2@company.com`) — password: `Password123!` |
| **Rooms**    | 5 phòng họp với sức chứa khác nhau (4–30 người), thiết bị đa dạng                                                                               |
| **Bookings** | 5–10 booking mẫu ở các trạng thái khác nhau (pending, approved, rejected, cancelled)                                                                  |

### 4. Khởi tạo Frontend (React + Vite)

```
frontend/
├── src/
│   ├── main.jsx
│   ├── App.jsx               # Router setup (react-router-dom)
│   ├── App.css
│   ├── index.css              # Global styles, CSS variables
│   ├── components/            # (trống, các plan sau sẽ thêm)
│   ├── pages/
│   │   └── HomePage.jsx       # Landing page đơn giản
│   ├── services/
│   │   └── api.js             # Axios instance (baseURL, interceptors)
│   ├── context/               # (trống)
│   ├── hooks/                 # (trống)
│   └── utils/                 # (trống)
├── Dockerfile
├── vite.config.js             # Proxy /api → backend:5000
└── package.json
```

**Dependencies:**

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "axios": "^1"
  }
}
```

### 5. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: meeting_room_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/meeting_room_db
      JWT_SECRET: your-secret-key
      PORT: 5000
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  pgdata:
```

### 6. File `.env.example`

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meeting_room_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=5000
NODE_ENV=development

# Email (Plan 07)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

---

## Tiêu chí hoàn thành

- [ ] `docker-compose up` chạy thành công cả 3 service (db, backend, frontend)
- [ ] `GET /api/health` trả về `{ status: "ok", timestamp: "..." }`
- [ ] Prisma migrate tạo đúng 5 bảng: `users`, `rooms`, `bookings`, `recurring_bookings`, `refresh_tokens`
- [ ] Seed data chạy thành công, có thể xem qua `npx prisma studio`
- [ ] Frontend hiển thị trang HomePage tại `http://localhost:5173`
- [ ] Axios instance đã cấu hình proxy tới backend
- [ ] ESLint + Prettier chạy không lỗi
- [ ] Global error handler middleware hoạt động (trả JSON error response)
