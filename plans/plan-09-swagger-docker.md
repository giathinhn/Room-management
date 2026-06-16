# Plan 09 — Swagger API Docs & Docker Polish

> **Mục tiêu**: Thêm Swagger/OpenAPI documentation cho tất cả API + hoàn thiện Docker setup cho production.
> **Thời lượng ước tính**: 1–1.5 giờ
> **Phụ thuộc**: Tất cả plan backend (01, 03, 04, 05, 07, 08)
> **Nên làm cuối cùng** sau khi tất cả API đã hoàn thiện.

---

## Tổng quan

Sau khi hoàn thành:
- Swagger UI truy cập tại `/api-docs`
- Tất cả endpoints được document đầy đủ (request/response/auth)
- Docker Compose chạy production-ready
- README.md hướng dẫn cài đặt và sử dụng

---

## PHẦN 1: SWAGGER / OPENAPI

### 1. Cài dependencies

```bash
npm install swagger-jsdoc swagger-ui-express
```

### 2. Swagger Config

**`src/config/swagger.js`**:

```js
const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meeting Room Booking API',
      version: '1.0.0',
      description: 'API quản lý phòng họp và đăng ký lịch sử dụng',
    },
    servers: [
      { url: '/api', description: 'API Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // Định nghĩa schemas cho User, Room, Booking, etc.
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],  // Đọc JSDoc comments từ route files
};

module.exports = swaggerJsDoc(options);
```

### 3. Mount Swagger UI

**Thêm vào `src/app.js`**:
```js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Meeting Room API Docs',
}));
```

### 4. JSDoc Comments cho Routes

Thêm JSDoc swagger comments vào mỗi route file. Ví dụ:

```js
/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@company.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login thành công
 *       401:
 *         description: Sai email hoặc password
 */
router.post('/login', validate(loginSchema), authController.login);
```

### 5. Schemas cần document

| Schema | Properties |
|--------|------------|
| User | id, email, fullName, role, isActive, createdAt |
| Room | id, name, capacity, location, equipment, isActive |
| Booking | id, roomId, userId, title, startTime, endTime, status, approvedBy, rejectionReason |
| Pagination | total, page, limit, totalPages |
| Error | success (false), error: { message, details? } |

### 6. Tags (nhóm API)

```js
tags: [
  { name: 'Auth', description: 'Xác thực & đăng ký' },
  { name: 'Profile', description: 'Quản lý profile cá nhân' },
  { name: 'Rooms', description: 'Quản lý phòng họp' },
  { name: 'Bookings', description: 'Đặt phòng & quản lý lịch' },
  { name: 'Users', description: 'Quản lý người dùng (Admin)' },
  { name: 'Export', description: 'Xuất báo cáo' },
]
```

---

## PHẦN 2: DOCKER PRODUCTION

### 7. Backend Dockerfile

**`backend/Dockerfile`**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### 8. Frontend Dockerfile

**`frontend/Dockerfile`**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`frontend/nginx.conf`**:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy Swagger
    location /api-docs {
        proxy_pass http://backend:5000;
    }
}
```

### 9. Docker Compose (Production)

**`docker-compose.yml`** — cập nhật:
```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: meeting_room_db
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    restart: unless-stopped
    ports:
      - "${BACKEND_PORT:-5000}:5000"
    environment:
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@db:5432/meeting_room_db
      JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 5000
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "npx prisma migrate deploy && npx prisma db seed && node src/server.js"

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

### 10. README.md

**`README.md`** — nội dung:

```markdown
# 🏢 Hệ thống Quản lý Phòng họp

## Quick Start

### Docker (Recommended)
docker-compose up --build

### Manual Setup
1. Setup database
2. Setup backend
3. Setup frontend

## Default Accounts
- Admin: admin@company.com / Password123!
- Approver: approver@company.com / Password123!
- User: user1@company.com / Password123!

## API Documentation
http://localhost:5000/api-docs

## Tech Stack
...
```

---

## Cấu trúc file tạo mới/sửa

```
backend/
├── src/config/swagger.js              ★ MỚI
├── src/app.js                         (sửa — mount swagger)
├── src/routes/*.js                    (sửa — thêm JSDoc comments)
├── Dockerfile                         (sửa — multi-stage build)

frontend/
├── Dockerfile                         (sửa — nginx production)
├── nginx.conf                         ★ MỚI

Root:
├── docker-compose.yml                 (sửa — production config)
├── .env.example                       (sửa — thêm production vars)
└── README.md                          ★ MỚI
```

---

## Tiêu chí hoàn thành

- [ ] Swagger UI truy cập tại http://localhost:5000/api-docs
- [ ] Tất cả endpoints có documentation (request body, responses, auth)
- [ ] Có thể test API trực tiếp từ Swagger UI
- [ ] `docker-compose up --build` chạy thành công từ đầu
- [ ] Frontend accessible tại http://localhost
- [ ] Backend API accessible tại http://localhost:5000
- [ ] Database migrate + seed tự động khi khởi chạy
- [ ] README.md hướng dẫn đầy đủ
- [ ] Health check cho database trong docker-compose
