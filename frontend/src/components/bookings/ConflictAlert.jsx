import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import suggestionService from '../../services/suggestion.service';
import { translateRoom } from '../../utils/roomTranslate';
import './ConflictAlert.css';

/**
 * Format a datetime string to readable localized format.
 */
function formatDateTime(dateStr, locale) {
  const d = new Date(dateStr);
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format ISO time → HH:mm
 */
function fmt(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * ConflictAlert — shown when a booking creation fails due to time conflicts.
 * Also loads and displays alternative rooms and time slots.
 *
 * @param {{
 *   conflicts: Array<{ id, title, startTime, endTime, user: { fullName, email } }>,
 *   roomId?: string,
 *   startTime?: string,
 *   endTime?: string,
 *   onDismiss: () => void,
 *   onSelectRoom?: (room: object) => void,
 *   onSelectSlot?: (slot: object) => void,
 * }} props
 */
function ConflictAlert({ conflicts, roomId, startTime, endTime, onDismiss, onSelectRoom, onSelectSlot }) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <ConflictAlertInner
      conflicts={conflicts}
      roomId={roomId}
      startTime={startTime}
      endTime={endTime}
      onDismiss={onDismiss}
      onSelectRoom={onSelectRoom}
      onSelectSlot={onSelectSlot}
    />
  );
}

function ConflictAlertInner({ conflicts, roomId, startTime, endTime, onDismiss, onSelectRoom, onSelectSlot }) {
  const { t, i18n } = useTranslation();
  const [altRooms, setAltRooms]   = useState([]);
  const [altSlots, setAltSlots]   = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';

  useEffect(() => {
    if (!roomId || !startTime || !endTime) return;

    // Load alternative rooms
    setLoadingRooms(true);
    suggestionService
      .getAlternativeRooms({ roomId, startTime, endTime })
      .then((res) => setAltRooms(res.data || []))
      .catch(() => setAltRooms([]))
      .finally(() => setLoadingRooms(false));

    // Load alternative time slots
    const date = startTime.slice(0, 10); // YYYY-MM-DD
    const preferredStartTime = fmt(startTime);
    setLoadingSlots(true);
    suggestionService
      .getAlternativeSlots({ roomId, date, preferredStartTime })
      .then((res) => setAltSlots(res.data || []))
      .catch(() => setAltSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [roomId, startTime, endTime]);

  const equipmentIcons = {
    'Máy chiếu': '📽️',
    'Micro': '🎤',
    'TV': '🖥️',
    'Bảng trắng': '📋',
    'Điều hòa': '❄️',
    'Camera': '📷',
  };

  const equipmentLabel = {
    'Máy chiếu': t('rooms.equipmentOptions.projector'),
    'Micro': t('rooms.equipmentOptions.microphone'),
    'Bảng trắng': t('rooms.equipmentOptions.whiteboard'),
    'TV': t('rooms.equipmentOptions.tv'),
    'Webcam': t('rooms.equipmentOptions.webcam'),
    'Loa': t('rooms.equipmentOptions.speaker'),
    'Điều hòa': t('rooms.equipmentOptions.airConditioner'),
  };

  return (
    <div className="conflict-alert" role="alert">
      {/* Header */}
      <div className="conflict-alert__header">
        <div className="conflict-alert__icon">⚠️</div>
        <div className="conflict-alert__heading">
          <h4 className="conflict-alert__title">{t('bookings.conflict')}</h4>
          <p className="conflict-alert__subtitle">
            {t('bookings.conflictDescription')}
          </p>
        </div>
        <button
          id="conflict-alert-dismiss"
          className="conflict-alert__dismiss"
          onClick={onDismiss}
          aria-label={t('floorMap.close')}
        >
          ×
        </button>
      </div>

      {/* Conflicting bookings */}
      <ul className="conflict-alert__list">
        {conflicts.map((c) => (
          <li key={c.id} className="conflict-alert__item">
            <div className="conflict-alert__item-title">{c.title}</div>
            <div className="conflict-alert__item-time">
              🕐 {formatDateTime(c.startTime, locale)} – {formatDateTime(c.endTime, locale)}
            </div>
            {c.user && (
              <div className="conflict-alert__item-user">
                👤 {c.user.fullName || c.user.email}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Alternative rooms */}
      {(loadingRooms || altRooms.length > 0) && (
        <div className="conflict-alert__section">
          <div className="conflict-alert__section-title">{t('bookings.altRoomsSameTime')}</div>
          {loadingRooms ? (
            <div className="conflict-alert__loading">{t('comments.loading')}</div>
          ) : (
            <div className="conflict-alert__alt-rooms">
              {altRooms.map((rawRoom) => {
                const room = translateRoom(rawRoom, t);
                return (
                  <div
                    key={room.id}
                    className={`conflict-alert__room-card ${room.score >= 10 ? 'conflict-alert__room-card--highlight' : ''}`}
                  >
                    <div className="conflict-alert__room-info">
                      <div className="conflict-alert__room-name">
                        {room.score >= 10 ? '✨ ' : ''}{room.name}
                      </div>
                      <div className="conflict-alert__room-meta">
                        {room.location} · {room.capacity} {t('rooms.capacityUnit')}
                      </div>
                      {room.equipment && room.equipment.length > 0 && (
                        <div className="conflict-alert__room-equipment">
                          {room.equipment.map((eq) => (
                            <span key={eq} className="conflict-alert__equip-tag">
                              {equipmentIcons[eq] || '🔧'} {equipmentLabel[eq] || eq}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {onSelectRoom && (
                      <button
                        id={`suggest-room-${room.id}`}
                        className="conflict-alert__select-btn"
                        onClick={() => onSelectRoom(room)}
                      >
                        {t('bookings.selectBtn')} →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Alternative time slots */}
      {(loadingSlots || altSlots.length > 0) && (
        <div className="conflict-alert__section">
          <div className="conflict-alert__section-title">{t('bookings.altSlotsSameRoom')}</div>
          {loadingSlots ? (
            <div className="conflict-alert__loading">{t('comments.loading')}</div>
          ) : (
            <div className="conflict-alert__alt-slots">
              {altSlots.map((slot, i) => (
                <div key={i} className="conflict-alert__slot-row">
                  <span className="conflict-alert__slot-time">
                    {slot.startLabel} – {slot.endLabel}
                    <span className="conflict-alert__slot-badge">{t('rooms.available')}</span>
                  </span>
                  {onSelectSlot && (
                    <button
                      id={`suggest-slot-${i}`}
                      className="conflict-alert__slot-btn"
                      onClick={() => onSelectSlot(slot)}
                    >
                      {t('bookings.selectBtn')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No suggestions fallback */}
      {!roomId && (
        <div className="conflict-alert__suggestion">
          {t('bookings.noSuggestions')}
        </div>
      )}
    </div>
  );
}

export default ConflictAlert;
