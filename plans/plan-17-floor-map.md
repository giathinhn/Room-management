# Plan 17 — Floor Map (Bản đồ sơ đồ tầng)

> **Mục tiêu**: Hiển thị sơ đồ mặt bằng tầng với vị trí các phòng họp, trạng thái real-time (trống / đang họp / sắp họp), click vào phòng → xem chi tiết + đặt phòng nhanh.
> **Thời lượng ước tính**: 3–4 giờ
> **Phụ thuộc**: Plan 03 (room management), Plan 04 (booking system)
> **Độc lập với**: Plan 05, 06, 07, 08, 11, 12, 13, 14, 15, 16

---

## Tổng quan

Sau khi hoàn thành:

- Người dùng thấy bản đồ trực quan mặt bằng từng tầng
- Mỗi phòng hiển thị trạng thái real-time bằng **màu sắc** + **badge**
- Click phòng → popup chi tiết (info + lịch hiện tại + nút đặt nhanh)
- Admin có thể cấu hình **vị trí phòng trên bản đồ** (tọa độ x, y, kích thước)
- Hỗ trợ chuyển tầng (tabs/dropdown)
- Auto-refresh trạng thái mỗi 30 giây

---

## Kiến trúc tổng quan

```
FloorMapPage
├── FloorSelector (tabs: Tầng 1, Tầng 2, ...)
├── FloorCanvas (SVG/CSS Grid)
│   ├── RoomBlock × N (phòng trên bản đồ)
│   │   ├── Tên phòng
│   │   ├── Sức chứa
│   │   └── Status badge (trống/đang họp/sắp họp)
│   └── Legend (chú thích màu)
└── RoomQuickViewModal (popup khi click phòng)
    ├── Room info (tên, sức chứa, thiết bị)
    ├── Current/next booking info
    └── [Đặt phòng nhanh] button → redirect BookingCreatePage
```

---

## Trạng thái phòng (Room Status Logic)

| Trạng thái | Điều kiện | Màu | Icon |
| ---------- | --------- | --- | ---- |
| **Trống** (available) | Không có booking `approved` nào đang diễn ra hoặc trong 30 phút tới | `#22c55e` (xanh lá) | ○ |
| **Đang họp** (in_use) | Có booking `approved` với `startTime ≤ now < endTime` | `#ef4444` (đỏ) | ● |
| **Sắp họp** (upcoming) | Trống hiện tại nhưng có booking `approved` bắt đầu trong 30 phút tới | `#f59e0b` (vàng cam) | ◐ |

**Query logic** (pseudo):

```
Với mỗi room:
  currentBooking = booking WHERE status='approved' 
                    AND startTime <= NOW() AND endTime > NOW()
  
  nextBooking = booking WHERE status='approved' 
                AND startTime > NOW() AND startTime <= NOW() + 30min
                ORDER BY startTime ASC LIMIT 1

  if (currentBooking) → status = 'in_use', show currentBooking info
  else if (nextBooking) → status = 'upcoming', show "Sắp họp lúc HH:mm"
  else → status = 'available'
```

---

## PHẦN 1: DATABASE

### 1. Mở rộng Room model — thêm tọa độ bản đồ

**File:** `backend/prisma/schema.prisma` — [MODIFY]

Thêm fields vào model `Room` để lưu vị trí trên bản đồ:

```prisma
model Room {
  // ... existing fields ...
  
  // Floor Map fields
  floor       String?  @db.VarChar(50)   // Tầng: "1", "2", "3", ...
  mapX        Float?   @map("map_x")     // Tọa độ X trên bản đồ (% từ 0-100)
  mapY        Float?   @map("map_y")     // Tọa độ Y trên bản đồ (% từ 0-100)
  mapWidth    Float?   @map("map_width") @default(15)  // Chiều rộng (% từ 0-100)
  mapHeight   Float?   @map("map_height") @default(12) // Chiều cao (% từ 0-100)
  
  // ... existing relations ...
}
```

> **Tọa độ dùng hệ phần trăm (0–100)** để responsive trên mọi kích thước màn hình. Khi render, CSS sẽ dùng `left: mapX%`, `top: mapY%`, `width: mapWidth%`, `height: mapHeight%`.

**Migration:**

```bash
npx prisma migrate dev --name add_floor_map_fields
```

### 2. Seed data — cập nhật vị trí phòng

**File:** `backend/prisma/seed.js` — [MODIFY]

Cập nhật seed rooms với floor map data:

```js
const room1 = await prisma.room.create({
  data: {
    name: 'Phòng họp Emerald',
    capacity: 6,
    location: 'Tầng 2, Tòa A',
    equipment: ['Máy chiếu', 'Bảng trắng', 'TV 55"', 'Điều hòa'],
    isActive: true,
    // Floor Map
    floor: '2',
    mapX: 10,
    mapY: 15,
    mapWidth: 18,
    mapHeight: 20,
  },
});

const room2 = await prisma.room.create({
  data: {
    name: 'Phòng họp Sapphire',
    capacity: 12,
    location: 'Tầng 3, Tòa A',
    equipment: ['Máy chiếu 4K', 'Video conference', 'Bảng trắng', 'Điều hòa', 'Mini bar'],
    isActive: true,
    floor: '3',
    mapX: 55,
    mapY: 10,
    mapWidth: 22,
    mapHeight: 25,
  },
});

const room3 = await prisma.room.create({
  data: {
    name: 'Phòng họp Ruby',
    capacity: 4,
    location: 'Tầng 2, Tòa B',
    equipment: ['TV 43"', 'Bảng trắng', 'Điều hòa'],
    isActive: true,
    floor: '2',
    mapX: 60,
    mapY: 50,
    mapWidth: 15,
    mapHeight: 15,
  },
});

const room4 = await prisma.room.create({
  data: {
    name: 'Hội trường Diamond',
    capacity: 30,
    location: 'Tầng 1, Tòa A',
    equipment: ['Máy chiếu laser', 'Hệ thống âm thanh', 'Micro không dây', 'Video conference', 'Điều hòa trung tâm', 'Bảng trắng điện tử'],
    isActive: true,
    floor: '1',
    mapX: 15,
    mapY: 20,
    mapWidth: 35,
    mapHeight: 30,
  },
});

const room5 = await prisma.room.create({
  data: {
    name: 'Phòng brainstorm Pearl',
    capacity: 8,
    location: 'Tầng 4, Tòa A',
    equipment: ['Bảng trắng lớn', 'Post-it boards', 'TV 65"', 'Điều hòa', 'Ghế bean bag'],
    isActive: true,
    floor: '4',
    mapX: 30,
    mapY: 25,
    mapWidth: 20,
    mapHeight: 18,
  },
});
```

> **Parse floor từ location**: Hàm tiện ích `extractFloor(location)` dùng regex `/Tầng\s*(\d+)/i` để tự động extract — dùng làm fallback nếu admin chưa cấu hình.

---

## PHẦN 2: BACKEND

### 3. Repository Layer

**File:** `backend/src/repositories/room.repository.js` — [MODIFY]

Thêm method mới:

```js
/**
 * Lấy tất cả phòng active kèm booking hiện tại/sắp tới để tính trạng thái.
 * @param {string} [floor] — lọc theo tầng (optional)
 * @returns {Array<Room & { currentBooking, nextBooking }>}
 */
async findAllWithStatus(floor) {
  const now = new Date();
  const next30min = new Date(now.getTime() + 30 * 60 * 1000);

  const where = { isActive: true };
  if (floor) {
    where.floor = floor;
  }

  const rooms = await prisma.room.findMany({
    where,
    include: {
      bookings: {
        where: {
          status: 'approved',
          startTime: { lte: next30min },
          endTime: { gt: now },
        },
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return rooms.map((room) => {
    const currentBooking = room.bookings.find(
      (b) => b.startTime <= now && b.endTime > now
    );
    const nextBooking = room.bookings.find(
      (b) => b.startTime > now && b.startTime <= next30min
    );

    let status = 'available';
    if (currentBooking) status = 'in_use';
    else if (nextBooking) status = 'upcoming';

    return {
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      location: room.location,
      equipment: room.equipment,
      floor: room.floor,
      mapX: room.mapX,
      mapY: room.mapY,
      mapWidth: room.mapWidth,
      mapHeight: room.mapHeight,
      status,
      currentBooking: currentBooking || null,
      nextBooking: nextBooking || null,
    };
  });
},

/**
 * Lấy danh sách các tầng có phòng.
 * @returns {string[]}
 */
async getFloors() {
  const result = await prisma.room.findMany({
    where: { isActive: true, floor: { not: null } },
    select: { floor: true },
    distinct: ['floor'],
    orderBy: { floor: 'asc' },
  });
  return result.map((r) => r.floor);
},

/**
 * Cập nhật vị trí phòng trên bản đồ (admin only).
 * @param {string} id
 * @param {{ floor, mapX, mapY, mapWidth, mapHeight }} mapData
 */
async updateMapPosition(id, { floor, mapX, mapY, mapWidth, mapHeight }) {
  return prisma.room.update({
    where: { id },
    data: { floor, mapX, mapY, mapWidth, mapHeight },
  });
},
```

### 4. Service Layer

**File:** `backend/src/services/room.service.js` — [MODIFY]

Thêm methods:

```js
/**
 * Lấy dữ liệu floor map: danh sách phòng + trạng thái real-time.
 */
async getFloorMap(floor) {
  return roomRepository.findAllWithStatus(floor);
},

/**
 * Lấy danh sách tầng.
 */
async getFloors() {
  return roomRepository.getFloors();
},

/**
 * Cập nhật vị trí phòng trên bản đồ (admin).
 */
async updateMapPosition(roomId, mapData) {
  const room = await roomRepository.findById(roomId);
  if (!room) throw Object.assign(new Error('Phòng không tồn tại'), { status: 404 });
  return roomRepository.updateMapPosition(roomId, mapData);
},
```

### 5. Controller

**File:** `backend/src/controllers/room.controller.js` — [MODIFY]

Thêm methods:

```js
/**
 * GET /api/rooms/floor-map?floor=2
 * Trả về danh sách phòng kèm trạng thái real-time cho floor map.
 */
async getFloorMap(req, res, next) {
  try {
    const { floor } = req.query;
    const rooms = await roomService.getFloorMap(floor || undefined);
    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
},

/**
 * GET /api/rooms/floors
 * Trả về danh sách các tầng có phòng.
 */
async getFloors(req, res, next) {
  try {
    const floors = await roomService.getFloors();
    res.json({ success: true, data: floors });
  } catch (err) {
    next(err);
  }
},

/**
 * PUT /api/rooms/:id/map-position
 * Admin cập nhật vị trí phòng trên bản đồ.
 */
async updateMapPosition(req, res, next) {
  try {
    const { id } = req.params;
    const { floor, mapX, mapY, mapWidth, mapHeight } = req.body;
    const room = await roomService.updateMapPosition(id, {
      floor, mapX, mapY, mapWidth, mapHeight,
    });
    res.json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
},
```

### 6. Routes

**File:** `backend/src/routes/room.routes.js` — [MODIFY]

Thêm routes **trước** `/:id` để tránh conflict:

```js
// Floor Map routes
router.get('/floor-map', authenticate, roomController.getFloorMap);
router.get('/floors', authenticate, roomController.getFloors);

// ⚠️ Đặt TRƯỚC /:id
router.get('/available', authenticate, roomController.findAvailable);
router.get('/:id', authenticate, roomController.getById);

// Admin: cập nhật vị trí phòng trên bản đồ
router.put('/:id/map-position', authenticate, authorize('admin'), roomController.updateMapPosition);
```

### 7. Validator (optional)

**File:** `backend/src/validators/room.validator.js` — [MODIFY hoặc NEW]

```js
const validateMapPosition = (req, res, next) => {
  const { floor, mapX, mapY, mapWidth, mapHeight } = req.body;

  const errors = [];

  if (floor !== undefined && typeof floor !== 'string') {
    errors.push('floor phải là chuỗi');
  }

  ['mapX', 'mapY', 'mapWidth', 'mapHeight'].forEach((field) => {
    const val = req.body[field];
    if (val !== undefined) {
      if (typeof val !== 'number' || val < 0 || val > 100) {
        errors.push(`${field} phải là số từ 0 đến 100`);
      }
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }

  next();
};
```

---

## PHẦN 3: FRONTEND

### 8. Service API

**File:** `frontend/src/services/api.js` — [MODIFY]

Thêm API calls:

```js
// ── Floor Map ──────────────────────────────────────────

/** Lấy danh sách tầng */
export const getFloors = () => api.get('/rooms/floors');

/** Lấy floor map data (phòng + trạng thái real-time) */
export const getFloorMap = (floor) =>
  api.get('/rooms/floor-map', { params: { floor } });

/** Admin: cập nhật vị trí phòng trên bản đồ */
export const updateRoomMapPosition = (roomId, data) =>
  api.put(`/rooms/${roomId}/map-position`, data);
```

---

### 9. FloorMapPage (Component chính)

**File:** `frontend/src/pages/FloorMapPage.jsx` — [NEW]
**File:** `frontend/src/pages/FloorMapPage.css` — [NEW]

#### Cấu trúc component:

```jsx
const FloorMapPage = () => {
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-refresh mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => fetchFloorMap(selectedFloor), 30000);
    return () => clearInterval(interval);
  }, [selectedFloor]);

  // Fetch danh sách tầng lần đầu
  useEffect(() => {
    fetchFloors();
  }, []);

  // Fetch rooms khi đổi tầng
  useEffect(() => {
    if (selectedFloor) fetchFloorMap(selectedFloor);
  }, [selectedFloor]);

  return (
    <div className="floor-map">
      {/* Header */}
      <div className="floor-map__header">
        <h1>🗺️ Sơ đồ tầng</h1>
        <FloorSelector floors={floors} selected={selectedFloor} onChange={setSelectedFloor} />
        <StatusLegend />
        <div className="floor-map__auto-refresh">
          <span className="pulse-dot" /> Cập nhật tự động
        </div>
      </div>

      {/* Bản đồ */}
      <div className="floor-map__canvas">
        {/* Background: mặt bằng tầng (SVG hoặc CSS grid) */}
        <div className="floor-map__blueprint">
          {rooms.map((room) => (
            <RoomBlock
              key={room.id}
              room={room}
              onClick={() => setSelectedRoom(room)}
            />
          ))}
        </div>
      </div>

      {/* Modal chi tiết phòng */}
      {selectedRoom && (
        <RoomQuickViewModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
};
```

---

### 10. RoomBlock Component

**File:** `frontend/src/components/floormap/RoomBlock.jsx` — [NEW]
**File:** `frontend/src/components/floormap/RoomBlock.css` — [NEW]

Mỗi phòng trên bản đồ:

```jsx
const STATUS_CONFIG = {
  available: { color: '#22c55e', label: 'Trống',     icon: '○', bgClass: 'room-block--available' },
  in_use:    { color: '#ef4444', label: 'Đang họp',  icon: '●', bgClass: 'room-block--in-use' },
  upcoming:  { color: '#f59e0b', label: 'Sắp họp',   icon: '◐', bgClass: 'room-block--upcoming' },
};

const RoomBlock = ({ room, onClick }) => {
  const config = STATUS_CONFIG[room.status];

  return (
    <div
      className={`room-block ${config.bgClass}`}
      style={{
        left: `${room.mapX}%`,
        top: `${room.mapY}%`,
        width: `${room.mapWidth}%`,
        height: `${room.mapHeight}%`,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${room.name} — ${config.label}`}
    >
      <div className="room-block__name">{room.name}</div>
      <div className="room-block__info">
        <span className="room-block__capacity">👥 {room.capacity}</span>
        <span className={`room-block__status-badge`}>
          {config.icon} {config.label}
        </span>
      </div>
      {room.status === 'in_use' && room.currentBooking && (
        <div className="room-block__booking-info">
          📋 {room.currentBooking.title}
          <br />
          ⏰ đến {new Date(room.currentBooking.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      {room.status === 'upcoming' && room.nextBooking && (
        <div className="room-block__booking-info">
          ⏳ Họp lúc {new Date(room.nextBooking.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
};
```

**CSS (room block):**

```css
.room-block {
  position: absolute;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  border: 2px solid transparent;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.room-block:hover {
  transform: scale(1.03);
  z-index: 10;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.room-block--available {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
}

.room-block--in-use {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.room-block--upcoming {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}

/* Pulse animation cho phòng đang họp */
.room-block--in-use::before {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}
```

---

### 11. RoomQuickViewModal

**File:** `frontend/src/components/floormap/RoomQuickViewModal.jsx` — [NEW]
**File:** `frontend/src/components/floormap/RoomQuickViewModal.css` — [NEW]

Modal popup khi click vào phòng trên bản đồ:

```jsx
const RoomQuickViewModal = ({ room, onClose }) => {
  const navigate = useNavigate();

  const handleQuickBook = () => {
    // Redirect tới trang đặt phòng với roomId pre-selected
    navigate(`/bookings/new?roomId=${room.id}`);
  };

  return (
    <div className="quick-view-overlay" onClick={onClose}>
      <div className="quick-view-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="quick-view__header">
          <h2>{room.name}</h2>
          <StatusBadge status={room.status} />
          <button className="quick-view__close" onClick={onClose}>✕</button>
        </div>

        {/* Info */}
        <div className="quick-view__info">
          <div className="quick-view__info-item">
            <span>📍 Vị trí</span>
            <span>{room.location}</span>
          </div>
          <div className="quick-view__info-item">
            <span>👥 Sức chứa</span>
            <span>{room.capacity} người</span>
          </div>
          <div className="quick-view__info-item">
            <span>🔧 Thiết bị</span>
            <div className="quick-view__equipment-tags">
              {room.equipment.map((eq) => (
                <span key={eq} className="equipment-tag">{eq}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Current/Next Booking */}
        {room.currentBooking && (
          <div className="quick-view__booking quick-view__booking--current">
            <h4>🔴 Đang diễn ra</h4>
            <p><strong>{room.currentBooking.title}</strong></p>
            <p>👤 {room.currentBooking.user.fullName}</p>
            <p>⏰ {formatTime(room.currentBooking.startTime)} – {formatTime(room.currentBooking.endTime)}</p>
          </div>
        )}

        {room.nextBooking && (
          <div className="quick-view__booking quick-view__booking--next">
            <h4>🟡 Cuộc họp tiếp theo</h4>
            <p><strong>{room.nextBooking.title}</strong></p>
            <p>👤 {room.nextBooking.user.fullName}</p>
            <p>⏰ {formatTime(room.nextBooking.startTime)} – {formatTime(room.nextBooking.endTime)}</p>
          </div>
        )}

        {/* Actions */}
        <div className="quick-view__actions">
          <button
            className="btn btn-primary btn-quick-book"
            onClick={handleQuickBook}
            disabled={room.status === 'in_use'}
          >
            ⚡ Đặt phòng nhanh
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/rooms/${room.id}`)}
          >
            📋 Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### 12. FloorSelector Component

**File:** `frontend/src/components/floormap/FloorSelector.jsx` — [NEW]

```jsx
const FloorSelector = ({ floors, selected, onChange }) => (
  <div className="floor-selector">
    {floors.map((floor) => (
      <button
        key={floor}
        className={`floor-selector__tab ${selected === floor ? 'floor-selector__tab--active' : ''}`}
        onClick={() => onChange(floor)}
      >
        🏢 Tầng {floor}
      </button>
    ))}
    <button
      className={`floor-selector__tab ${!selected ? 'floor-selector__tab--active' : ''}`}
      onClick={() => onChange(null)}
    >
      🌐 Tất cả
    </button>
  </div>
);
```

---

### 13. StatusLegend Component

**File:** `frontend/src/components/floormap/StatusLegend.jsx` — [NEW]

```jsx
const StatusLegend = () => (
  <div className="status-legend">
    <div className="status-legend__item">
      <span className="status-legend__dot status-legend__dot--available" />
      Trống
    </div>
    <div className="status-legend__item">
      <span className="status-legend__dot status-legend__dot--in-use" />
      Đang họp
    </div>
    <div className="status-legend__item">
      <span className="status-legend__dot status-legend__dot--upcoming" />
      Sắp họp
    </div>
  </div>
);
```

---

### 14. Routing & Navigation

**File:** `frontend/src/App.jsx` — [MODIFY]

Thêm route:

```jsx
import FloorMapPage from './pages/FloorMapPage';

// Trong protected routes:
<Route path="/floor-map" element={<FloorMapPage />} />
```

**File:** `frontend/src/components/layout/Sidebar.jsx` — [MODIFY]

Thêm menu item (import `FiMap` từ `react-icons/fi`):

```jsx
import { ..., FiMap } from 'react-icons/fi';

// Trong NAV_ITEMS, thêm sau "Tìm phòng trống":
{
  label: 'Sơ đồ tầng',
  icon: <FiMap />,
  to: '/floor-map',
  roles: ['admin', 'approver', 'user'],
},
```

---

### 15. Admin: Cấu hình vị trí phòng (Drag & Drop)

**File:** `frontend/src/components/floormap/RoomPositionEditor.jsx` — [NEW]
**File:** `frontend/src/components/floormap/RoomPositionEditor.css` — [NEW]

> Chỉ hiển thị cho Admin. Cho phép kéo-thả phòng trên bản đồ để cấu hình vị trí.

```jsx
const RoomPositionEditor = ({ room, onSave }) => {
  const [position, setPosition] = useState({
    mapX: room.mapX || 50,
    mapY: room.mapY || 50,
    mapWidth: room.mapWidth || 15,
    mapHeight: room.mapHeight || 12,
    floor: room.floor || '1',
  });

  // Drag handler (mousedown → mousemove → mouseup)
  const handleDragStart = (e) => { /* ... */ };

  // Resize handler (drag từ corner)
  const handleResizeStart = (e) => { /* ... */ };

  const handleSave = async () => {
    await updateRoomMapPosition(room.id, position);
    onSave(position);
    toast.success('Đã cập nhật vị trí phòng');
  };

  return (
    <div className="room-editor">
      {/* Input fields cho tọa độ */}
      <div className="room-editor__fields">
        <label>Tầng: <input value={position.floor} onChange={...} /></label>
        <label>X (%): <input type="number" value={position.mapX} onChange={...} /></label>
        <label>Y (%): <input type="number" value={position.mapY} onChange={...} /></label>
        <label>Rộng (%): <input type="number" value={position.mapWidth} onChange={...} /></label>
        <label>Cao (%): <input type="number" value={position.mapHeight} onChange={...} /></label>
      </div>
      <button onClick={handleSave} className="btn btn-primary">💾 Lưu vị trí</button>
    </div>
  );
};
```

---

## PHẦN 4: DESIGN & UX

### 16. Giao diện Floor Map

**Layout bản đồ:**

```
┌────────────────────────────────────────────────────────┐
│  🗺️ Sơ đồ tầng    [Tầng 1] [Tầng 2*] [Tầng 3]      │
│                     ○Trống  ●Đang họp  ◐Sắp họp       │
│  ┌─────────────────────────────────────────────────┐   │
│  │         FLOOR PLAN BACKGROUND                   │   │
│  │   ┌──────────┐                  ┌──────────┐    │   │
│  │   │ Emerald  │                  │  Ruby    │    │   │
│  │   │ 👥 6     │    Hành lang     │ 👥 4     │    │   │
│  │   │ ○ Trống  │                  │ ● Đang   │    │   │
│  │   │          │                  │   họp    │    │   │
│  │   └──────────┘                  │ Sprint   │    │   │
│  │                                 │ Review   │    │   │
│  │   ┌──────────┐                  └──────────┘    │   │
│  │   │ Pearl    │                                  │   │
│  │   │ 👥 8     │        ┌─────────────────┐       │   │
│  │   │ ◐ Sắp   │        │ Khu vực chung   │       │   │
│  │   │   họp    │        │                 │       │   │
│  │   └──────────┘        └─────────────────┘       │   │
│  └─────────────────────────────────────────────────┘   │
│  🔄 Cập nhật tự động mỗi 30 giây                      │
└────────────────────────────────────────────────────────┘
```

### 17. Design tokens

| Element | Value |
| ------- | ----- |
| **Canvas background** | `linear-gradient(135deg, #0f0f23, #1a1a3e)` với grid pattern |
| **Room block border-radius** | `12px` |
| **Room block transition** | `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` |
| **Hover scale** | `1.03` |
| **Hover box-shadow** | `0 8px 32px rgba(0, 0, 0, 0.3)` |
| **Modal backdrop** | `rgba(0, 0, 0, 0.6)` + `backdrop-filter: blur(8px)` |
| **Status dot pulse** | `animation: pulse 2s infinite` (chỉ cho `in_use`) |
| **Auto-refresh indicator** | Green pulse dot + text "Cập nhật tự động" |
| **Floor tab active** | `background: #6366f1`, `color: #fff` |

---

## Danh sách file thay đổi

### Backend

| File | Action | Mô tả |
| ---- | ------ | ----- |
| `backend/prisma/schema.prisma` | MODIFY | Thêm fields `floor`, `mapX`, `mapY`, `mapWidth`, `mapHeight` vào Room |
| `backend/prisma/seed.js` | MODIFY | Cập nhật seed rooms với floor map coordinates |
| `backend/src/repositories/room.repository.js` | MODIFY | Thêm `findAllWithStatus()`, `getFloors()`, `updateMapPosition()` |
| `backend/src/services/room.service.js` | MODIFY | Thêm `getFloorMap()`, `getFloors()`, `updateMapPosition()` |
| `backend/src/controllers/room.controller.js` | MODIFY | Thêm `getFloorMap()`, `getFloors()`, `updateMapPosition()` |
| `backend/src/routes/room.routes.js` | MODIFY | Thêm 3 routes: `/floor-map`, `/floors`, `/:id/map-position` |
| `backend/src/validators/room.validator.js` | NEW/MODIFY | Validator cho map position |

### Frontend

| File | Action | Mô tả |
| ---- | ------ | ----- |
| `frontend/src/services/api.js` | MODIFY | Thêm 3 API calls |
| `frontend/src/pages/FloorMapPage.jsx` | NEW | Trang floor map chính |
| `frontend/src/pages/FloorMapPage.css` | NEW | Styles cho floor map page |
| `frontend/src/components/floormap/RoomBlock.jsx` | NEW | Phòng trên bản đồ |
| `frontend/src/components/floormap/RoomBlock.css` | NEW | Styles cho room block |
| `frontend/src/components/floormap/RoomQuickViewModal.jsx` | NEW | Modal chi tiết phòng |
| `frontend/src/components/floormap/RoomQuickViewModal.css` | NEW | Styles cho modal |
| `frontend/src/components/floormap/FloorSelector.jsx` | NEW | Chọn tầng |
| `frontend/src/components/floormap/StatusLegend.jsx` | NEW | Chú thích trạng thái |
| `frontend/src/components/floormap/RoomPositionEditor.jsx` | NEW | Admin cấu hình vị trí (drag & drop) |
| `frontend/src/components/floormap/RoomPositionEditor.css` | NEW | Styles cho editor |
| `frontend/src/App.jsx` | MODIFY | Thêm route `/floor-map` |
| `frontend/src/components/layout/Sidebar.jsx` | MODIFY | Thêm nav item "Sơ đồ tầng" |

---

## API Endpoints

| Method | Endpoint | Auth | Role | Mô tả |
| ------ | -------- | ---- | ---- | ----- |
| `GET` | `/api/rooms/floor-map?floor=2` | ✅ | All | Lấy phòng + trạng thái real-time |
| `GET` | `/api/rooms/floors` | ✅ | All | Lấy danh sách tầng |
| `PUT` | `/api/rooms/:id/map-position` | ✅ | Admin | Cập nhật vị trí phòng trên bản đồ |

**Response mẫu — GET `/api/rooms/floor-map?floor=2`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Phòng họp Emerald",
      "capacity": 6,
      "location": "Tầng 2, Tòa A",
      "equipment": ["Máy chiếu", "Bảng trắng", "TV 55\"", "Điều hòa"],
      "floor": "2",
      "mapX": 10,
      "mapY": 15,
      "mapWidth": 18,
      "mapHeight": 20,
      "status": "available",
      "currentBooking": null,
      "nextBooking": {
        "id": "uuid-b1",
        "title": "Sprint Planning",
        "startTime": "2026-07-04T09:00:00Z",
        "endTime": "2026-07-04T10:00:00Z",
        "user": { "id": "uuid-u1", "fullName": "Nguyễn Văn A", "email": "user1@company.com" }
      }
    },
    {
      "id": "uuid-3",
      "name": "Phòng họp Ruby",
      "capacity": 4,
      "location": "Tầng 2, Tòa B",
      "equipment": ["TV 43\"", "Bảng trắng", "Điều hòa"],
      "floor": "2",
      "mapX": 60,
      "mapY": 50,
      "mapWidth": 15,
      "mapHeight": 15,
      "status": "in_use",
      "currentBooking": {
        "id": "uuid-b2",
        "title": "Sprint Review",
        "startTime": "2026-07-03T14:00:00Z",
        "endTime": "2026-07-03T15:30:00Z",
        "user": { "id": "uuid-u2", "fullName": "Trần Thị B", "email": "user2@company.com" }
      },
      "nextBooking": null
    }
  ]
}
```

---

## Thứ tự triển khai

| Bước | Nội dung | Ước tính |
| ---- | -------- | -------- |
| 1 | Database: migration thêm floor map fields | 10 phút |
| 2 | Backend: repository + service + controller + routes | 30 phút |
| 3 | Backend: seed data cập nhật | 10 phút |
| 4 | Frontend: FloorMapPage + FloorSelector + StatusLegend | 45 phút |
| 5 | Frontend: RoomBlock component + CSS animations | 30 phút |
| 6 | Frontend: RoomQuickViewModal + đặt phòng nhanh | 30 phút |
| 7 | Frontend: Routing + Sidebar navigation | 10 phút |
| 8 | Frontend: Admin RoomPositionEditor (drag & drop) | 40 phút |
| 9 | Testing & polish | 20 phút |
| | **Tổng** | **~3.5 giờ** |
