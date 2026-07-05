import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './RoomQuickViewModal.css';

const formatTime = (isoString, locale) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (isoString, locale) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

const EQUIPMENT_ICONS = {
  'Máy chiếu': '📽️',
  'Micro': '🎤',
  'Bảng trắng': '📋',
  'TV': '🖥️',
  'Webcam': '📷',
  'Loa': '🔊',
  'Điều hòa': '❄️',
};

const RoomQuickViewModal = ({ room, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';

  const statusConfig = {
    available: { text: t('floorMap.available'), cls: 'status-chip--available', icon: '●' },
    in_use: { text: t('floorMap.inUse'), cls: 'status-chip--in-use', icon: '●' },
    upcoming: { text: t('floorMap.upcoming'), cls: 'status-chip--upcoming', icon: '◐' },
  }[room.status] || { text: room.status, cls: 'status-chip--available', icon: '●' };

  const equipmentLabel = {
    'Máy chiếu': t('rooms.equipmentOptions.projector'),
    'Micro': t('rooms.equipmentOptions.microphone'),
    'Bảng trắng': t('rooms.equipmentOptions.whiteboard'),
    'TV': t('rooms.equipmentOptions.tv'),
    'Webcam': t('rooms.equipmentOptions.webcam'),
    'Loa': t('rooms.equipmentOptions.speaker'),
    'Điều hòa': t('rooms.equipmentOptions.airConditioner'),
  };

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
      aria-label={t('floorMap.editPosition', { name: room.name })}
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
              aria-label={t('floorMap.close')}
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
              <div className="quick-view__info-label">{t('rooms.capacity')}</div>
              <div className="quick-view__info-value">{room.capacity} {t('rooms.capacityUnit')}</div>
            </div>
          </div>
          <div className="quick-view__info-card">
            <span className="quick-view__info-icon">🏗️</span>
            <div>
              <div className="quick-view__info-label">{t('floorMap.floor')}</div>
              <div className="quick-view__info-value">{t('floorMap.floorLabel', { name: room.floor || 'N/A' })}</div>
            </div>
          </div>
        </div>

        {/* ── Equipment ── */}
        {room.equipment && room.equipment.length > 0 && (
          <div className="quick-view__section">
            <h3 className="quick-view__section-title">{t('rooms.equipment')}</h3>
            <div className="quick-view__equipment-list">
              {room.equipment.map((eq) => (
                <span key={eq} className="equipment-tag">
                  {EQUIPMENT_ICONS[eq] || '🔧'} {equipmentLabel[eq] || eq}
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
              <span className="quick-view__booking-label">{t('floorMap.inProgress')}</span>
            </div>
            <div className="quick-view__booking-title">{room.currentBooking.title}</div>
            <div className="quick-view__booking-meta">
              <span>👤 {room.currentBooking.user?.fullName}</span>
              <span>
                ⏰ {formatTime(room.currentBooking.startTime, locale)} – {formatTime(room.currentBooking.endTime, locale)}
              </span>
              <span>📅 {formatDate(room.currentBooking.startTime, locale)}</span>
            </div>
          </div>
        )}

        {/* ── Next Booking ── */}
        {room.nextBooking && (
          <div className="quick-view__booking-card quick-view__booking-card--next">
            <div className="quick-view__booking-header">
              <span className="quick-view__booking-status-dot quick-view__booking-status-dot--amber" />
              <span className="quick-view__booking-label">{t('floorMap.nextMeeting')}</span>
            </div>
            <div className="quick-view__booking-title">{room.nextBooking.title}</div>
            <div className="quick-view__booking-meta">
              <span>👤 {room.nextBooking.user?.fullName}</span>
              <span>
                ⏰ {formatTime(room.nextBooking.startTime, locale)} – {formatTime(room.nextBooking.endTime, locale)}
              </span>
              <span>📅 {formatDate(room.nextBooking.startTime, locale)}</span>
            </div>
          </div>
        )}

        {/* ── Available message ── */}
        {room.status === 'available' && !room.nextBooking && (
          <div className="quick-view__available-msg">
            <span className="quick-view__available-icon">✅</span>
            <span>{t('floorMap.availableReady')}</span>
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
            {t('floorMap.quickBook')}
          </button>
          <button
            className="quick-view__btn quick-view__btn--secondary"
            onClick={handleViewDetail}
            id="quick-view-detail-btn"
          >
            {t('common.viewDetails')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomQuickViewModal;
