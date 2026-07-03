import { useNavigate } from 'react-router-dom';
import './RoomQuickViewModal.css';

const formatTime = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

const STATUS_LABELS = {
  available: { text: 'Trống', cls: 'status-chip--available', icon: '●' },
  in_use:   { text: 'Đang họp', cls: 'status-chip--in-use', icon: '●' },
  upcoming: { text: 'Sắp họp', cls: 'status-chip--upcoming', icon: '◐' },
};

const EQUIPMENT_ICONS = {
  'May chieu': '📽️',
  'Bang trang': '📋',
  'TV': '📺',
  'Dieu hoa': '❄️',
  'Webcam': '📷',
  'Video conference': '🎥',
  'Micro': '🎤',
  'He thong am thanh': '🔊',
  'Mini bar': '🥤',
};

const getEquipmentIcon = (eq) => {
  const key = Object.keys(EQUIPMENT_ICONS).find((k) =>
    eq.toLowerCase().includes(k.toLowerCase())
  );
  return key ? EQUIPMENT_ICONS[key] : '🔧';
};

const RoomQuickViewModal = ({ room, onClose }) => {
  const navigate = useNavigate();
  const statusConfig = STATUS_LABELS[room.status] || STATUS_LABELS.available;

  const handleQuickBook = () => {
    navigate(`/bookings/new?roomId=${room.id}`);
    onClose();
  };

  const handleViewDetail = () => {
    navigate(`/rooms/${room.id}`);
    onClose();
  };

  return (
    <div
      className="quick-view-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết phòng ${room.name}`}
    >
      <div
        className="quick-view-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="quick-view__header">
          <div className="quick-view__header-left">
            <div className="quick-view__room-icon">🏢</div>
            <div>
              <h2 className="quick-view__room-name" id="quick-view-title">{room.name}</h2>
              <div className="quick-view__location">📍 {room.location}</div>
            </div>
          </div>
          <div className="quick-view__header-right">
            <span className={`status-chip ${statusConfig.cls}`}>
              <span className="status-chip__dot" aria-hidden="true" />
              {statusConfig.text}
            </span>
            <button
              className="quick-view__close-btn"
              onClick={onClose}
              aria-label="Đóng"
              id="quick-view-close-btn"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Room Info ── */}
        <div className="quick-view__info-grid">
          <div className="quick-view__info-card">
            <span className="quick-view__info-icon">👥</span>
            <div>
              <div className="quick-view__info-label">Sức chứa</div>
              <div className="quick-view__info-value">{room.capacity} người</div>
            </div>
          </div>
          <div className="quick-view__info-card">
            <span className="quick-view__info-icon">🏗️</span>
            <div>
              <div className="quick-view__info-label">Tầng</div>
              <div className="quick-view__info-value">Tầng {room.floor || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* ── Equipment ── */}
        {room.equipment && room.equipment.length > 0 && (
          <div className="quick-view__section">
            <h3 className="quick-view__section-title">Thiết bị</h3>
            <div className="quick-view__equipment-list">
              {room.equipment.map((eq) => (
                <span key={eq} className="equipment-tag">
                  {getEquipmentIcon(eq)} {eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Current Booking ── */}
        {room.status === 'in_use' && room.currentBooking && (
          <div className="quick-view__booking-card quick-view__booking-card--current">
            <div className="quick-view__booking-header">
              <span className="quick-view__booking-status-dot quick-view__booking-status-dot--red" />
              <span className="quick-view__booking-label">Đang diễn ra</span>
            </div>
            <div className="quick-view__booking-title">{room.currentBooking.title}</div>
            <div className="quick-view__booking-meta">
              <span>👤 {room.currentBooking.user?.fullName}</span>
              <span>
                ⏰ {formatTime(room.currentBooking.startTime)} – {formatTime(room.currentBooking.endTime)}
              </span>
              <span>📅 {formatDate(room.currentBooking.startTime)}</span>
            </div>
          </div>
        )}

        {/* ── Next Booking ── */}
        {room.nextBooking && (
          <div className="quick-view__booking-card quick-view__booking-card--next">
            <div className="quick-view__booking-header">
              <span className="quick-view__booking-status-dot quick-view__booking-status-dot--amber" />
              <span className="quick-view__booking-label">Cuộc họp tiếp theo</span>
            </div>
            <div className="quick-view__booking-title">{room.nextBooking.title}</div>
            <div className="quick-view__booking-meta">
              <span>👤 {room.nextBooking.user?.fullName}</span>
              <span>
                ⏰ {formatTime(room.nextBooking.startTime)} – {formatTime(room.nextBooking.endTime)}
              </span>
              <span>📅 {formatDate(room.nextBooking.startTime)}</span>
            </div>
          </div>
        )}

        {/* ── Available message ── */}
        {room.status === 'available' && !room.nextBooking && (
          <div className="quick-view__available-msg">
            <span className="quick-view__available-icon">✅</span>
            <span>Phòng trống — sẵn sàng đặt ngay!</span>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="quick-view__actions">
          <button
            className="quick-view__btn quick-view__btn--primary"
            onClick={handleQuickBook}
            disabled={room.status === 'in_use'}
            id="quick-book-btn"
          >
            ⚡ Đặt phòng nhanh
          </button>
          <button
            className="quick-view__btn quick-view__btn--secondary"
            onClick={handleViewDetail}
            id="quick-view-detail-btn"
          >
            📋 Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomQuickViewModal;
