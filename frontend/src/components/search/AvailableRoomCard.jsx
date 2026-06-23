import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AvailableRoomCard.css';

const EQUIPMENT_ICONS = {
  'Máy chiếu': '📽️',
  'Micro':     '🎤',
  'Bảng trắng': '📋',
  'TV':        '🖥️',
  'Webcam':    '📷',
  'Loa':       '🔊',
  'Điều hòa':  '❄️',
};

/**
 * AvailableRoomCard — compact card for an available room in search results.
 *
 * @param {{
 *   room: object,
 *   searchParams: { startTime?: string, endTime?: string },
 * }} props
 */
function AvailableRoomCard({ room, searchParams = {} }) {
  const navigate = useNavigate();

  const handleBooking = () => {
    const qs = new URLSearchParams();
    qs.set('roomId', room.id);
    if (searchParams.startTime) qs.set('startTime', searchParams.startTime);
    if (searchParams.endTime)   qs.set('endTime',   searchParams.endTime);
    navigate(`/bookings/new?${qs.toString()}`);
  };

  return (
    <div className="arc" role="article" aria-label={`Phòng ${room.name}`}>
      {/* Room info */}
      <div className="arc__body">
        <div className="arc__title-row">
          <span className="arc__icon">🏢</span>
          <div>
            <h3 className="arc__name">{room.name}</h3>
            <p className="arc__location">📍 {room.location}</p>
          </div>
        </div>

        <div className="arc__meta">
          <span className="arc__capacity">👥 {room.capacity} người</span>
        </div>

        {/* Equipment tags */}
        {room.equipment && room.equipment.length > 0 && (
          <div className="arc__equipment">
            {room.equipment.map((eq) => (
              <span key={eq} className="arc__equip-tag">
                {EQUIPMENT_ICONS[eq] || '🔧'} {eq}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="arc__actions">
        <span className="arc__available-badge">✅ Còn trống</span>
        <button
          id={`book-room-${room.id}`}
          className="arc__book-btn"
          onClick={handleBooking}
        >
          Đặt phòng →
        </button>
      </div>
    </div>
  );
}

export default AvailableRoomCard;
