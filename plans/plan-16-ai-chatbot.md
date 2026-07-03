# Plan 16 — AI Chatbot Đặt phòng (Booking Assistant)

## Mô tả

Thêm tính năng **AI Chatbot trợ lý đặt phòng** vào hệ thống RoomSync. Người dùng có thể đặt phòng, kiểm tra phòng trống, xem lịch đặt, và hủy booking bằng **ngôn ngữ tự nhiên** (Tiếng Việt & English) thông qua một chat widget luôn hiển thị ở góc dưới phải màn hình.

### Ví dụ tương tác

```
👤 "Đặt phòng cho 8 người vào thứ 3 tuần sau lúc 2 giờ chiều, cần máy chiếu"
🤖 "Tôi tìm thấy Phòng A1 (10 người, có máy chiếu) trống từ 14:00–15:00
    ngày 08/07/2026. Bạn muốn đặt không?"
    [Card: Phòng A1 | 14:00–15:00 | 08/07/2026] [✅ Xác nhận đặt]

👤 "Hôm nay tôi có lịch họp gì?"
🤖 "Bạn có 2 cuộc họp hôm nay:
    1. Sprint Review — Phòng B2, 09:00–10:00 (Đã duyệt ✅)
    2. Sync với team Design — Phòng A1, 14:00–15:00 (Chờ duyệt ⏳)"
```

---

## Tech Stack

| Thành phần                   | Công nghệ                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| **LLM Provider**         | Google Gemini API (`gemini-2.5-flash`) — gọi qua native `fetch`, không cài thêm package |
| **Structured Output**    | Gemini`responseSchema` — đảm bảo AI luôn trả về JSON đúng cấu trúc                  |
| **Chat History Storage** | PostgreSQL (bảng`chat_messages` mới) via Prisma                                              |
| **Frontend**             | React component floating chat bubble, mount trong`AppLayout.jsx`                               |

---

## Kiến trúc tổng quan

```
User ──chat──▶ Frontend ChatWidget
                    │
                    ▼
              POST /api/ai/chat  { message }
                    │
                    ▼
            ┌─ AI Controller ─┐
            │  Save user msg   │
            │  Load context    │
            │  Call Gemini API │◀── System prompt + conversation history
            │  Parse response  │
            │                  │
            │  Execute action: │
            │  ├─ query_rooms ──┼──▶ roomRepository.findAvailable()
            │  ├─ list_bookings─┼──▶ bookingRepository.findAll()
            │  ├─ cancel_booking┼──▶ bookingService.cancel()
            │  └─ confirm_book ─┼──▶ bookingService.create()
            │                  │
            │  Save AI msg     │
            │  Return response │
            └──────────────────┘
                    │
                    ▼
              Frontend renders:
              ├─ Text message
              ├─ Room cards (interactive)
              ├─ Booking proposal cards (with confirm button)
              └─ Booking list
```

---

## Proposed Changes

### 1. Database Schema

**File:** `backend/prisma/schema.prisma`

Thêm model `ChatMessage`:

```prisma
model ChatMessage {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  role      String   // 'user' | 'assistant'
  content   String   @db.Text
  metadata  Json?    // Structured data: action, parameters, rooms, bookings
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("chat_messages")
}
```

Cập nhật model `User` — thêm relation:

```prisma
chatMessages ChatMessage[]
```

Sau khi sửa schema, chạy:

```bash
npx prisma migrate dev --name add_chat_messages
```

---

### 2. Backend

#### 2.1 `backend/src/config/env.js` — [MODIFY]

Thêm biến cấu hình Gemini:

```js
// AI / Gemini
GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
GEMINI_MODEL:   process.env.GEMINI_MODEL   || 'gemini-2.5-flash',
```

> **Lưu ý:** `GEMINI_API_KEY` **không** nằm trong `requiredVars`. Hệ thống vẫn khởi động bình thường nếu thiếu key — chatbot sẽ trả về thông báo "AI chưa được cấu hình" (graceful degradation).

#### 2.2 `backend/.env.example` — [MODIFY]

```env
# AI Chatbot (Google Gemini)
# Lấy key tại: https://aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

---

#### 2.3 `backend/src/utils/gemini.js` — [NEW]

Utility gọi Gemini API bằng **native `fetch`** (Node 18+), không cần cài thêm package.

**Response Schema** (đảm bảo Gemini luôn trả về JSON cấu trúc):

```json
{
  "type": "object",
  "properties": {
    "reply": {
      "type": "string",
      "description": "Tin nhắn hiển thị cho user"
    },
    "action": {
      "type": "string",
      "enum": [
        "chat",
        "query_rooms",
        "propose_booking",
        "confirm_booking",
        "list_bookings",
        "cancel_booking",
        "check_availability"
      ]
    },
    "parameters": {
      "type": "object",
      "properties": {
        "date":       { "type": "string",  "description": "YYYY-MM-DD" },
        "startTime":  { "type": "string",  "description": "HH:mm" },
        "endTime":    { "type": "string",  "description": "HH:mm" },
        "capacity":   { "type": "integer" },
        "equipment":  { "type": "array", "items": { "type": "string" } },
        "location":   { "type": "string" },
        "title":      { "type": "string" },
        "roomId":     { "type": "string" },
        "bookingId":  { "type": "string" }
      }
    }
  },
  "required": ["reply", "action"]
}
```

**System Prompt** (gửi kèm mỗi request đến Gemini):

```
Bạn là RoomSync AI — trợ lý đặt phòng họp thông minh.

Ngày hôm nay: {currentDate} ({dayOfWeek})
Giờ hiện tại: {currentTime} (UTC+7)

Danh sách phòng họp hiện có:
{roomList — tên, sức chứa, vị trí, thiết bị}

Quy tắc đặt phòng:
- Giờ hành chính: 07:00–22:00
- Thời lượng tối thiểu: 30 phút, tối đa: 8 giờ
- Đặt trước tối đa: 30 ngày
- Không đặt trong quá khứ

Hướng dẫn hành động:
1. Khi user muốn đặt phòng → parse thông tin → action: "query_rooms" để tìm phòng trống
2. Khi đã tìm được phòng phù hợp → action: "propose_booking" kèm đầy đủ thông tin
3. Khi user xác nhận đặt → action: "confirm_booking"
4. Khi user hỏi lịch của mình → action: "list_bookings"
5. Khi user muốn hủy booking → action: "cancel_booking"
6. Trả lời bằng ngôn ngữ của user (Tiếng Việt hoặc English)
7. Luôn lịch sự, ngắn gọn, hữu ích
8. Nếu thiếu thông tin → hỏi lại cụ thể (ngày, giờ, số người)
```

**Interface của module:**

```js
/**
 * Gọi Gemini API và trả về structured response
 * @param {Array<{role: string, content: string}>} history - Lịch sử chat
 * @param {string} userMessage - Tin nhắn mới từ user
 * @param {string} systemPrompt - System instruction
 * @returns {Promise<{reply: string, action: string, parameters?: object}>}
 */
async function callGemini(history, userMessage, systemPrompt) { ... }
```

---

#### 2.4 `backend/src/services/ai.service.js` — [NEW]

Service xử lý toàn bộ logic chatbot:

```js
const aiService = {
  /**
   * Xử lý tin nhắn từ user:
   * 1. Lưu user message vào DB
   * 2. Load chat history (20 tin gần nhất) + danh sách phòng để build context
   * 3. Gọi Gemini API → nhận structured JSON response
   * 4. Thực thi action tương ứng (query rooms, create booking, etc.)
   * 5. Enrich response với data thực từ DB (rooms array, bookings array)
   * 6. Lưu AI message vào DB
   * 7. Trả về response đầy đủ cho frontend
   */
  async processMessage(userId, message) { ... },

  async _handleQueryRooms(params) { ... },       // → roomRepository.findAvailable()
  async _handleProposeBooking(params) { ... },    // → validate + return proposal card
  async _handleConfirmBooking(userId, params) { ... }, // → bookingService.create()
  async _handleListBookings(userId, params) { ... },   // → bookingRepository.findAll()
  async _handleCancelBooking(userId, params) { ... },  // → bookingService.cancel()
  async _handleCheckAvailability(params) { ... }, // → bookingRepository.findOverlapping()

  async _loadHistory(userId, limit = 20) { ... },
  async _buildSystemPrompt() { ... },             // Load room list từ DB + format prompt
  async _saveMessage(userId, role, content, metadata) { ... },
};
```

**Bảng xử lý action:**

| Action                 | Mô tả                                     | DB/Service được gọi                 | Response thêm      |
| ---------------------- | ------------------------------------------- | --------------------------------------- | ------------------- |
| `chat`               | Hội thoại thông thường                 | —                                      | —                  |
| `query_rooms`        | Tìm phòng trống theo tiêu chí          | `roomRepository.findAvailable()`      | `rooms[]`         |
| `propose_booking`    | Đề xuất booking cụ thể                 | Validate params                         | `proposal{}`      |
| `confirm_booking`    | Tạo booking sau khi user đồng ý         | `bookingService.create()`             | `booking{}`       |
| `list_bookings`      | Liệt kê booking của user                 | `bookingRepository.findAll()`         | `bookings[]`      |
| `cancel_booking`     | Hủy một booking                           | `bookingService.cancel()`             | `booking{}`       |
| `check_availability` | Kiểm tra phòng cụ thể có trống không | `bookingRepository.findOverlapping()` | `available: bool` |

---

#### 2.5 `backend/src/controllers/ai.controller.js` — [NEW]

```js
const aiController = {
  /**
   * POST /api/ai/chat
   * Body: { message: string }
   * Response: {
   *   success: true,
   *   data: {
   *     reply: string,
   *     action: string,
   *     rooms?: Room[],
   *     proposal?: { roomId, title, startTime, endTime, room },
   *     booking?: Booking,
   *     bookings?: Booking[]
   *   }
   * }
   */
  async chat(req, res, next) { ... },

  /**
   * GET /api/ai/history?limit=50
   * Response: { success: true, data: ChatMessage[] }
   */
  async getHistory(req, res, next) { ... },

  /**
   * DELETE /api/ai/history
   * Response: { success: true, message: 'Đã xóa lịch sử chat' }
   */
  async clearHistory(req, res, next) { ... },
};
```

---

#### 2.6 `backend/src/routes/ai.routes.js` — [NEW]

```js
const express  = require('express');
const router   = express.Router();
const aiController = require('../controllers/ai.controller');
const authenticate = require('../middlewares/auth.middleware');

router.post(  '/chat',    authenticate, aiController.chat);
router.get(   '/history', authenticate, aiController.getHistory);
router.delete('/history', authenticate, aiController.clearHistory);

module.exports = router;
```

---

#### 2.7 `backend/src/routes/index.js` — [MODIFY]

```diff
+// ─── AI Chatbot ───────────────────────────────────────────────────────────────
+router.use('/ai', require('./ai.routes'));
```

---

### 3. Frontend

#### 3.1 `frontend/src/services/chat.service.js` — [NEW]

```js
import api from './api';

const chatService = {
  async sendMessage(message) {
    const { data } = await api.post('/ai/chat', { message });
    return data;
  },

  async getHistory(limit = 50) {
    const { data } = await api.get('/ai/history', { params: { limit } });
    return data;
  },

  async clearHistory() {
    const { data } = await api.delete('/ai/history');
    return data;
  },
};

export default chatService;
```

---

#### 3.2 `frontend/src/components/chat/ChatWidget.jsx` — [NEW]

Floating chat bubble ở góc dưới phải, mở rộng thành chat panel khi click.

**States:**

| State             | Type              | Mô tả                                       |
| ----------------- | ----------------- | --------------------------------------------- |
| `isOpen`        | `bool`          | Panel đang mở hay đóng                    |
| `messages`      | `ChatMessage[]` | Danh sách tin nhắn (từ history + realtime) |
| `input`         | `string`        | Nội dung ô nhập                            |
| `isLoading`     | `bool`          | Đang chờ AI trả lời                       |
| `historyLoaded` | `bool`          | Đã load lịch sử lần đầu chưa          |

**Components con (render trong messages):**

- `<RoomCard room={room} onBook={handleBookRoom} />` — hiển thị phòng, nút "Đặt phòng này"
- `<BookingProposalCard proposal={proposal} onConfirm={handleConfirm} />` — xác nhận booking
- `<BookingListItem booking={booking} />` — hiển thị một booking trong danh sách

**UI Flow:**

```
[Chat bubble] ──click──▶ [Chat panel mở]
                              │
                    [Load history từ API]
                              │
                    [Hiển thị tin nhắn cũ]
                              │
               User gõ + nhấn Enter / nút Gửi
                              │
                    [Hiển thị user message ngay]
                    [Hiển thị typing indicator ...]
                              │
                    [POST /api/ai/chat]
                              │
                    [Nhận response]
                    [Render text + cards nếu có]
```

**Mockup UI:**

```
╔═══════════════════════════════════╗
║ 🤖 RoomSync AI              ✕ 🗑  ║  ← header + clear history
╠═══════════════════════════════════╣
║                                   ║
║  ┌─────────────────────────────┐  ║
║  │ Xin chào! Tôi có thể giúp  │  ║  ← AI message (left)
║  │ bạn đặt phòng họp. Bạn     │  ║
║  │ cần gì?                     │  ║
║  └─────────────────────────────┘  ║
║                                   ║
║          ┌──────────────────────┐ ║
║          │ Đặt phòng 5 người   │ ║  ← User message (right)
║          │ ngày mai 9h         │ ║
║          └──────────────────────┘ ║
║                                   ║
║  ┌─────────────────────────────┐  ║
║  │ Tìm thấy 2 phòng trống:    │  ║  ← AI + room cards
║  │ ┌───────────────────────┐  │  ║
║  │ │ 🏢 Phòng A1           │  │  ║
║  │ │ 👥 6 người | Tầng 3  │  │  ║
║  │ │ 📽️ Máy chiếu, Bảng  │  │  ║
║  │ │ [Đặt phòng này →]    │  │  ║
║  │ └───────────────────────┘  │  ║
║  └─────────────────────────────┘  ║
║                                   ║
║  ● ● ●  (typing indicator)        ║
║                                   ║
╠═══════════════════════════════════╣
║ [Nhập tin nhắn...          ] [➤] ║  ← input area
╚═══════════════════════════════════╝

[💬]  ← chat bubble (fixed, bottom-right)
```

---

#### 3.3 `frontend/src/components/chat/ChatWidget.css` — [NEW]

**Key styling:**

```css
/* Chat bubble — fixed position */
.chat-bubble {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
  animation: pulse-glow 3s ease-in-out infinite;
  cursor: pointer;
  z-index: 1000;
}

/* Chat panel — slide up animation */
.chat-panel {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 400px;
  height: 550px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg), 0 0 40px rgba(99, 102, 241, 0.2);
  display: flex;
  flex-direction: column;
  animation: slideUpFade 0.3s ease forwards;
  z-index: 999;
}

/* Responsive — full screen on mobile */
@media (max-width: 768px) {
  .chat-panel {
    bottom: 0; right: 0;
    width: 100vw; height: 100vh;
    border-radius: 0;
  }
  .chat-bubble { bottom: 16px; right: 16px; }
}

/* Typing indicator */
.typing-dot {
  animation: bounce 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
```

---

#### 3.4 `frontend/src/components/layout/AppLayout.jsx` — [MODIFY]

```diff
 import Header from './Header';
 import Sidebar from './Sidebar';
+import ChatWidget from '../chat/ChatWidget';
 import './AppLayout.css';

 const AppLayout = () => {
   const [sidebarOpen, setSidebarOpen] = useState(true);
   const toggleSidebar = () => setSidebarOpen((v) => !v);

   return (
     <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
       <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
       <div className="app-layout__body">
         <Header onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />
         <main className="app-layout__main">
           <div className="app-layout__content">
             <Outlet />
           </div>
         </main>
       </div>
       {sidebarOpen && (
         <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
       )}
+      {/* AI Chatbot — luôn hiển thị trên mọi trang */}
+      <ChatWidget />
     </div>
   );
 };
```

---

## Tổng hợp Files

| #  | Action | File                                             | Mô tả                                             |
| -- | ------ | ------------------------------------------------ | --------------------------------------------------- |
| 1  | MODIFY | `backend/prisma/schema.prisma`                 | Thêm model`ChatMessage` + relation vào `User` |
| 2  | MODIFY | `backend/src/config/env.js`                    | Thêm`GEMINI_API_KEY`, `GEMINI_MODEL`           |
| 3  | MODIFY | `backend/.env.example`                         | Document biến Gemini API                           |
| 4  | NEW    | `backend/src/utils/gemini.js`                  | Gemini API utility (native fetch)                   |
| 5  | NEW    | `backend/src/services/ai.service.js`           | AI chatbot business logic                           |
| 6  | NEW    | `backend/src/controllers/ai.controller.js`     | HTTP handlers: chat, history, clear                 |
| 7  | NEW    | `backend/src/routes/ai.routes.js`              | Route definitions                                   |
| 8  | MODIFY | `backend/src/routes/index.js`                  | Register`/ai` routes                              |
| 9  | NEW    | `frontend/src/services/chat.service.js`        | Frontend API calls                                  |
| 10 | NEW    | `frontend/src/components/chat/ChatWidget.jsx`  | Chat UI component                                   |
| 11 | NEW    | `frontend/src/components/chat/ChatWidget.css`  | Chat styling                                        |
| 12 | MODIFY | `frontend/src/components/layout/AppLayout.jsx` | Mount`<ChatWidget />`                             |

---

## API Endpoints

| Method | Endpoint            | Mô tả                                   | Auth |
| ------ | ------------------- | ----------------------------------------- | ---- |
| POST   | `/api/ai/chat`    | Gửi tin nhắn, nhận response từ AI     | ✅   |
| GET    | `/api/ai/history` | Lấy lịch sử chat (query:`?limit=50`) | ✅   |
| DELETE | `/api/ai/history` | Xóa toàn bộ lịch sử chat             | ✅   |

### POST `/api/ai/chat` — Request Body

```json
{ "message": "Đặt phòng cho 5 người ngày mai lúc 9h sáng" }
```

### POST `/api/ai/chat` — Response

```json
{
  "success": true,
  "data": {
    "reply": "Tôi tìm thấy 2 phòng trống vào 09:00–10:00 ngày 01/07/2026:",
    "action": "query_rooms",
    "rooms": [
      {
        "id": "uuid",
        "name": "Phòng A1",
        "capacity": 6,
        "location": "Tầng 3, Tòa A",
        "equipment": ["Máy chiếu", "Bảng trắng"]
      }
    ]
  }
}
```

---

## Verification Plan

### Chạy migration & khởi động

```bash
# 1. Migrate database
cd backend
npx prisma migrate dev --name add_chat_messages

# 2. Khởi động backend
npm run dev

# 3. Khởi động frontend (terminal khác)
cd ../frontend
npm run dev
```

### Test API bằng curl

```bash
# Lấy access token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@company.com","password":"Password123!"}' \
  | jq -r '.data.accessToken')

# Gửi tin nhắn chat
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Đặt phòng cho 5 người ngày mai lúc 9h sáng"}'

# Lấy lịch sử
curl http://localhost:5000/api/ai/history \
  -H "Authorization: Bearer $TOKEN"

# Xóa lịch sử
curl -X DELETE http://localhost:5000/api/ai/history \
  -H "Authorization: Bearer $TOKEN"
```

### Manual Test Checklist

- [X] Chat bubble hiển thị ở góc dưới phải trên mọi trang
- [X] Click bubble → chat panel mở với animation slide-up
- [X] Lịch sử chat load khi mở lần đầu
- [X] Gửi "Đặt phòng cho 5 người ngày mai lúc 9h sáng" → nhận room cards
- [X] Click "Đặt phòng này" → AI xác nhận với booking proposal card
- [X] Click "Xác nhận đặt" → booking được tạo → kiểm tra trong `/bookings`
- [X] Gửi "Hôm nay tôi có lịch gì?" → nhận danh sách bookings
- [X] Gửi "Hủy booking [tên]" → booking bị hủy
- [X] Refresh trang → mở chat lại → lịch sử vẫn còn
- [X] Click icon thùng rác → lịch sử bị xóa
- [X] Xóa `GEMINI_API_KEY` → chatbot trả về thông báo lỗi nhẹ (không crash)
- [X] Thu nhỏ < 768px → chat panel full-screen
