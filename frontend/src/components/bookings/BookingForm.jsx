import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import roomService from '../../services/room.service';
import DateTimePicker from '../common/DateTimePicker';
import ConflictAlert from './ConflictAlert';
import { translateRoom } from '../../utils/roomTranslate';
import './BookingForm.css';

/**
 * Combine a date string (YYYY-MM-DD) and time string (HH:mm) into ISO datetime.
 */
function combineDateTime(date, time) {
  if (!date || !time) return null;
  return new Date(`${date}T${time}:00`).toISOString();
}

/**
 * Calculate and format duration string from two Date values.
 */
function calcDuration(startISO, endISO, t) {
  if (!startISO || !endISO) return null;
  const diff = new Date(endISO) - new Date(startISO);
  if (diff <= 0) return null;
  const totalMins = Math.round(diff / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return t('bookingDetail.durationHourMin', { h, m });
  if (h > 0) return t('bookingDetail.durationHour', { h, count: h });
  return t('bookingDetail.durationMin', { m, count: m });
}

// ── Helper: extract date / time parts from ISO string ────────────────────
const extractDate = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ''; }
};
const extractTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch { return ''; }
};

/**
 * BookingForm — step-by-step form for creating a booking.
 * Step 1: Select date & time
 * Step 2: Choose available room
 * Step 3: Enter meeting title + submit
 *
 * @param {{
 *   onSubmit: (data: { roomId, title, startTime, endTime }) => Promise<void>,
 *   isLoading: boolean,
 *   conflicts: Array,
 *   onClearConflicts: () => void,
 *   initialValues?: { roomId?: string, startTime?: string, endTime?: string },
 * }} props
 */
function BookingForm({ onSubmit, isLoading, conflicts, onClearConflicts, initialValues = {} }) {
  const { t, i18n } = useTranslation();
  
  // ── State ─────────────────────────────────────────────────────────────────
  const [date, setDate] = useState(extractDate(initialValues.startTime) || '');
  const [startTime, setStartTime] = useState(extractTime(initialValues.startTime) || '');
  const [endTime, setEndTime] = useState(extractTime(initialValues.endTime) || '');
  const [selectedRoomId, setSelectedRoomId] = useState(initialValues.roomId || '');
  const [title, setTitle] = useState('');

  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsLoaded, setRoomsLoaded] = useState(false);

  const [errors, setErrors] = useState({});

  // Sync state if initialValues changes (e.g. from suggestions or templates)
  useEffect(() => {
    if (initialValues.startTime && initialValues.endTime) {
      const d = extractDate(initialValues.startTime);
      const st = extractTime(initialValues.startTime);
      const et = extractTime(initialValues.endTime);
      
      setDate(d);
      setStartTime(st);
      setEndTime(et);
      
      if (initialValues.roomId) {
        setSelectedRoomId(initialValues.roomId);
      }
      if (initialValues.title) {
        setTitle(initialValues.title);
      }

      // Automatically search rooms for pre-filled times
      const start = combineDateTime(d, st);
      const end = combineDateTime(d, et);
      if (start && end && new Date(start) < new Date(end)) {
        setRoomsLoading(true);
        setRoomsLoaded(false);
        roomService.getAvailableRooms({ startTime: start, endTime: end })
          .then((res) => {
            setAvailableRooms(res.data || []);
            setRoomsLoaded(true);
            
            // Smoothly scroll to the bottom of the page to focus on Step 3 info
            setTimeout(() => {
              const submitBtn = document.getElementById('submit-booking-btn');
              if (submitBtn) {
                submitBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }
            }, 300);
          })
          .catch(() => {})
          .finally(() => setRoomsLoading(false));
      }
    }
  }, [initialValues]);

  // Compute values
  const startISO = combineDateTime(date, startTime);
  const endISO   = combineDateTime(date, endTime);
  const duration = calcDuration(startISO, endISO, t);

  const canSearch = date && startTime && endTime && (new Date(startISO) < new Date(endISO));

  // Find Room info
  const selectedRoom = translateRoom(availableRooms.find((r) => r.id === selectedRoomId), t);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const loadAvailableRooms = useCallback(async () => {
    if (!canSearch) return;
    onClearConflicts?.();
    setRoomsLoading(true);
    setRoomsLoaded(false);
    setSelectedRoomId('');
    try {
      const res = await roomService.getAvailableRooms({
        startTime: startISO,
        endTime:   endISO,
      });
      setAvailableRooms(res.data || []);
      setRoomsLoaded(true);
      
      // Auto scroll to Step 2
      setTimeout(() => {
        const findBtn = document.getElementById('find-rooms-btn');
        if (findBtn) {
          findBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      toast.error(t('roomSearch.failed'));
    } finally {
      setRoomsLoading(false);
    }
  }, [canSearch, startISO, endISO, onClearConflicts, t]);

  const validate = () => {
    const newErrors = {};
    if (!date) newErrors.date = t('bookings.form.validation.dateRequired');
    if (!startTime) newErrors.startTime = t('bookings.form.validation.startTimeRequired');
    if (!endTime) newErrors.endTime = t('bookings.form.validation.endTimeRequired');
    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = t('bookings.form.validation.endTimeAfterStart');
    }
    if (!selectedRoomId) newErrors.room = t('bookings.form.validation.roomRequired');
    if (!title.trim()) newErrors.title = t('bookings.form.validation.titleRequired');
    if (title.length > 200) newErrors.title = t('bookings.form.validation.titleMaxLength');
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSubmit({
      roomId:    selectedRoomId,
      title:     title.trim(),
      startTime: startISO,
      endTime:   endISO,
    });
  };

  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';

  return (
    <form className="booking-form" onSubmit={handleSubmit} noValidate>
      {/* Conflicts warning */}
      {conflicts.length > 0 && (
        <ConflictAlert
          conflicts={conflicts}
          roomId={selectedRoomId}
          startTime={startISO}
          endTime={endISO}
          onDismiss={onClearConflicts}
          onSelectRoom={(altRoom) => {
            setSelectedRoomId(altRoom.id);
            onClearConflicts();
          }}
          onSelectSlot={(altSlot) => {
            const d = extractDate(altSlot.startTime);
            const st = extractTime(altSlot.startTime);
            const et = extractTime(altSlot.endTime);
            setDate(d);
            setStartTime(st);
            setEndTime(et);
            onClearConflicts();
            setRoomsLoaded(false);
          }}
        />
      )}

      {/* ── Step 1: Time Selection ─────────────────────────────────────── */}
      <div className="booking-form__step">
        <div className="booking-form__step-header">
          <span className="booking-form__step-num">1</span>
          <h3 className="booking-form__step-title">{t('bookings.form.selectTime')}</h3>
        </div>

        <div className="booking-form__time-grid">
          <div className="booking-form__field">
            <label className="booking-form__label" htmlFor="booking-date">
              {t('bookings.form.meetingDate')}
            </label>
            <DateTimePicker
              id="booking-date-start"
              dateValue={date}
              timeValue={startTime}
              onDateChange={(v) => { setDate(v); setRoomsLoaded(false); }}
              onTimeChange={(v) => { setStartTime(v); setRoomsLoaded(false); }}
              label=""
              error={errors.date || errors.startTime}
            />
            <div className="booking-form__time-labels">
              <span>{t('bookings.form.startDateTime')}</span>
            </div>
          </div>

          <div className="booking-form__field">
            <label className="booking-form__label" htmlFor="booking-end-time">
              {t('bookings.form.endTime')}
            </label>
            <div className="booking-form__end-time">
              <select
                id="booking-end-time"
                className={`dtp-time-select ${errors.endTime ? 'input-error' : ''}`}
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setRoomsLoaded(false); }}
              >
                <option value="">{t('bookings.form.selectEndTimePlaceholder')}</option>
                {['07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
                  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00',
                  '16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30',
                  '21:00','21:30','22:00'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {duration && (
                <span className="booking-form__duration-pill">⏱️ {duration}</span>
              )}
            </div>
            {errors.endTime && <p className="booking-form__error">{errors.endTime}</p>}
          </div>
        </div>

        <button
          type="button"
          id="find-rooms-btn"
          className="booking-form__find-btn"
          onClick={loadAvailableRooms}
          disabled={!canSearch || roomsLoading}
        >
          {roomsLoading ? (
            <>
              <span className="spinner-sm" /> {t('bookings.form.searchingRooms')}
            </>
          ) : (
            t('bookings.form.searchRoomsBtn')
          )}
        </button>
      </div>

      {/* ── Step 2: Room Selection ─────────────────────────────────────── */}
      {(roomsLoaded || roomsLoading) && (
        <div className="booking-form__step">
          <div className="booking-form__step-header">
            <span className="booking-form__step-num">2</span>
            <h3 className="booking-form__step-title">{t('bookings.form.selectAvailableRoom')}</h3>
          </div>

          {roomsLoading ? (
            <div className="booking-form__rooms-loading">
              <span className="spinner-sm" /> {t('bookings.form.loadingRooms')}
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="booking-form__no-rooms">
              {t('bookings.form.noRoomsAvailable')}
            </div>
          ) : (
            <div className="booking-form__rooms-grid">
              {(() => {
                const sorted = [...availableRooms].sort((a, b) => {
                  if (a.isFavorite && !b.isFavorite) return -1;
                  if (!a.isFavorite && b.isFavorite) return 1;
                  return 0;
                });
                return sorted.map((rawRoom) => {
                  const room = translateRoom(rawRoom, t);
                  return (
                    <button
                      key={room.id}
                      type="button"
                      id={`room-option-${room.id}`}
                      className={`booking-form__room-card ${selectedRoomId === room.id ? 'selected' : ''}`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <div className="booking-form__room-name">
                        {room.isFavorite && <span style={{ marginRight: '4px', color: '#fbbf24' }}>⭐</span>}
                        {room.name}
                      </div>
                      <div className="booking-form__room-info">
                        <span>👥 {room.capacity} {t('rooms.capacityUnit')}</span>
                        {room.location && <span>📍 {room.location}</span>}
                      </div>
                      {room.equipment && room.equipment.length > 0 && (
                        <div className="booking-form__room-tags">
                          {room.equipment.slice(0, 3).map((eq) => (
                            <span key={eq} className="booking-form__room-tag">{eq}</span>
                          ))}
                          {room.equipment.length > 3 && (
                            <span className="booking-form__room-tag">+{room.equipment.length - 3}</span>
                          )}
                        </div>
                      )}
                      {selectedRoomId === room.id && (
                        <div className="booking-form__room-check">✓</div>
                      )}
                    </button>
                  );
                });
            })()}
          </div>
          )}
          {errors.room && <p className="booking-form__error">{errors.room}</p>}
        </div>
      )}

      {/* ── Step 3: Meeting Info ───────────────────────────────────────── */}
      {roomsLoaded && selectedRoomId && (
        <div className="booking-form__step">
          <div className="booking-form__step-header">
            <span className="booking-form__step-num">3</span>
            <h3 className="booking-form__step-title">{t('bookings.form.meetingInfo')}</h3>
          </div>

          <div className="booking-form__field">
            <label className="booking-form__label" htmlFor="booking-title">
              {t('bookings.form.meetingTitleLabel')} <span className="required">*</span>
            </label>
            <input
              id="booking-title"
              type="text"
              className={`booking-form__input ${errors.title ? 'input-error' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('bookings.form.titlePlaceholder')}
              maxLength={200}
            />
            <div className="booking-form__input-meta">
              {errors.title && <p className="booking-form__error">{errors.title}</p>}
              <span className="booking-form__char-count">{title.length}/200</span>
            </div>
          </div>

          {/* Summary */}
          {selectedRoom && (
            <div className="booking-form__summary">
              <h4 className="booking-form__summary-title">{t('bookings.form.summaryTitle')}</h4>
              <div className="booking-form__summary-row">
                <span>{t('bookings.form.summaryRoom')}</span>
                <strong>{selectedRoom.name}</strong>
              </div>
              {selectedRoom.location && (
                <div className="booking-form__summary-row">
                  <span>{t('rooms.location')}:</span>
                  <strong>{selectedRoom.location}</strong>
                </div>
              )}
              <div className="booking-form__summary-row">
                <span>{t('bookings.form.summaryTime')}</span>
                <strong>
                  {new Date(startISO).toLocaleDateString(locale)} &nbsp;
                  {startTime} – {endTime} ({duration})
                </strong>
              </div>
            </div>
          )}

          <button
            type="submit"
            id="submit-booking-btn"
            className="booking-form__submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-sm" /> {t('bookings.form.submitting')}
              </>
            ) : (
              t('bookings.form.submitBtn')
            )}
          </button>
        </div>
      )}
    </form>
  );
}

export default BookingForm;
