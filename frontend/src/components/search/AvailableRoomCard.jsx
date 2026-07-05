import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translateRoom } from '../../utils/roomTranslate';
import './AvailableRoomCard.css';

/**
 * AvailableRoomCard — compact card for an available room in search results.
 *
 * @param {{
 *   room: object,
 *   searchParams: { startTime?: string, endTime?: string },
 * }} props
 */
function AvailableRoomCard({ room: rawRoom, searchParams = {} }) {
  const { t } = useTranslation();
  const room = translateRoom(rawRoom, t);
  const navigate = useNavigate();

  const handleBooking = () => {
    const qs = new URLSearchParams();
    qs.set('roomId', room.id);
    if (searchParams.startTime) qs.set('startTime', searchParams.startTime);
    if (searchParams.endTime)   qs.set('endTime',   searchParams.endTime);
    navigate(`/bookings/new?${qs.toString()}`);
  };

  const EQUIPMENT_ICONS = {
    'Máy chiếu': '📽️',
    'Micro':     '🎤',
    'Bảng trắng': '📋',
    'TV':        '🖥️',
    'Webcam':    '📷',
    'Loa':       '🔊',
    'Điều hòa':  '❄️',
  };

  const equipmentLabel = {
    'Máy chiếu': t('rooms.equipmentOptions.projector'),
    'Micro':     t('rooms.equipmentOptions.microphone'),
    'Bảng trắng': t('rooms.equipmentOptions.whiteboard'),
    'TV':        t('rooms.equipmentOptions.tv'),
    'Webcam':    t('rooms.equipmentOptions.webcam'),
    'Loa':       t('rooms.equipmentOptions.speaker'),
    'Điều hòa':  t('rooms.equipmentOptions.airConditioner'),
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
          <span className="arc__capacity">👥 {room.capacity} {t('rooms.capacityUnit')}</span>
        </div>

        {/* Equipment tags */}
        {room.equipment && room.equipment.length > 0 && (
          <div className="arc__equipment">
            {room.equipment.map((eq) => (
              <span key={eq} className="arc__equip-tag">
                {EQUIPMENT_ICONS[eq] || '🔧'} {equipmentLabel[eq] || eq}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="arc__actions">
        <span className="arc__available-badge">✅ {t('rooms.available')}</span>
        <button
          id={`book-room-${room.id}`}
          className="arc__book-btn"
          onClick={handleBooking}
        >
          {t('roomSearch.form.bookRoom')} →
        </button>
      </div>
    </div>
  );
}

export default AvailableRoomCard;
