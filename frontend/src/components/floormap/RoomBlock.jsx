import { useTranslation } from 'react-i18next';
import './RoomBlock.css';

const STATUS_CONFIG = {
  available: {
    label: 'Trống',
    icon: '●',
    blockClass: 'room-block--available',
    badgeClass: 'room-block__badge--available',
  },
  in_use: {
    label: 'Đang họp',
    icon: '●',
    blockClass: 'room-block--in-use',
    badgeClass: 'room-block__badge--in-use',
  },
  upcoming: {
    label: 'Sắp họp',
    icon: '◐',
    blockClass: 'room-block--upcoming',
    badgeClass: 'room-block__badge--upcoming',
  },
};

const formatTime = (isoString, locale) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const RoomBlock = ({ room, onClick, draggable, onDragStart, onDragOver, onDrop }) => {
  const { t, i18n } = useTranslation();
  const config = STATUS_CONFIG[room.status] || STATUS_CONFIG.available;
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';

  const statusLabel = {
    available: t('floorMap.available'),
    in_use: t('floorMap.inUse'),
    upcoming: t('floorMap.upcoming'),
  };

  const style = {
    gridColumnStart: room.mapX != null ? room.mapX + 1 : 'auto',
    gridRowStart: room.mapY != null ? room.mapY + 1 : 'auto',
  };

  return (
    <div
      className={`room-block ${config.blockClass}`}
      style={style}
      onClick={() => onClick(room)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(room)}
      role="button"
      tabIndex={0}
      aria-label={`${room.name} — ${statusLabel[room.status] || config.label}`}
      id={`room-block-${room.id}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Pulse indicator for in_use */}
      {room.status === 'in_use' && <span className="room-block__pulse" aria-hidden="true" />}

      {/* Room name */}
      <div className="room-block__name">{room.name}</div>

      {/* Capacity */}
      <div className="room-block__meta">
        <span className="room-block__capacity">👥 {room.capacity}</span>
      </div>

      {/* Status badge */}
      <div className={`room-block__badge ${config.badgeClass}`}>
        <span className="room-block__badge-dot" aria-hidden="true" />
        {statusLabel[room.status] || config.label}
      </div>

      {/* Current booking info */}
      {room.status === 'in_use' && room.currentBooking && (
        <div className="room-block__booking-info">
          <div className="room-block__booking-title">{room.currentBooking.title}</div>
          <div className="room-block__booking-time">
            {formatTime(room.currentBooking.startTime, locale)} – {formatTime(room.currentBooking.endTime, locale)}
          </div>
        </div>
      )}

      {/* Upcoming booking info */}
      {room.status === 'upcoming' && room.nextBooking && (
        <div className="room-block__booking-info">
          <div className="room-block__booking-time">
            ⏳ {formatTime(room.nextBooking.startTime, locale)}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomBlock;
