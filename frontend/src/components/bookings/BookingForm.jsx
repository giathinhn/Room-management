import React, { useState, useEffect, useCallback } from 'react';
import roomService from '../../services/room.service';
import DateTimePicker from '../common/DateTimePicker';
import ConflictAlert from './ConflictAlert';
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
function calcDuration(startISO, endISO) {
  if (!startISO || !endISO) return null;
  const diff = new Date(endISO) - new Date(startISO);
  if (diff <= 0) return null;
  const totalMins = Math.round(diff / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
  if (h > 0) return `${h} giờ`;
  return `${m} phút`;
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
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
              });
            }, 100);
          })
          .catch(() => {
            setAvailableRooms([]);
            setRoomsLoaded(true);
          })
          .finally(() => {
            setRoomsLoading(false);
          });
      }
    } else {
      // Handle partial templates (e.g. from handleUseTemplate which only has startHHMM, endHHMM)
      if (initialValues.startHHMM) setStartTime(initialValues.startHHMM);
      if (initialValues.endHHMM) setEndTime(initialValues.endHHMM);
      if (initialValues.roomId) setSelectedRoomId(initialValues.roomId);
      if (initialValues.title) setTitle(initialValues.title);
    }
  }, [initialValues]);

  // ── Derived values ────────────────────────────────────────────────────────
  const startISO = combineDateTime(date, startTime);
  const endISO = combineDateTime(date, endTime);
  const duration = calcDuration(startISO, endISO);

  const timeSelected = date && startTime && endTime;
  const canSearch = timeSelected && startISO && endISO && new Date(startISO) < new Date(endISO);

  // ── Load available rooms whenever time changes ─────────────────────────────
  const loadAvailableRooms = useCallback(async () => {
    if (!canSearch) return;

    setRoomsLoading(true);
    setRoomsLoaded(false);
    // Only clear selectedRoomId if there was no pre-filled value
    if (!initialValues.roomId) {
      setSelectedRoomId('');
    }
    onClearConflicts?.();

    try {
      const res = await roomService.getAvailableRooms({ startTime: startISO, endTime: endISO });
      setAvailableRooms(res.data || []);
      setRoomsLoaded(true);
    } catch {
      setAvailableRooms([]);
      setRoomsLoaded(true);
    } finally {
      setRoomsLoading(false);
    }
  }, [startISO, endISO, canSearch, initialValues.roomId]);

  // ── Validation ────────────────────────────────────────────────────────────
  function validate() {
    const newErrors = {};
    if (!date) newErrors.date = 'Vui lòng chọn ngày';
    if (!startTime) newErrors.startTime = 'Vui lòng chọn giờ bắt đầu';
    if (!endTime) newErrors.endTime = 'Vui lòng chọn giờ kết thúc';
    if (startISO && endISO && new Date(startISO) >= new Date(endISO)) {
      newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
    }
    if (!selectedRoomId) newErrors.room = 'Vui lòng chọn phòng';
    if (!title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề cuộc họp';
    if (title.length > 200) newErrors.title = 'Tiêu đề không được vượt quá 200 ký tự';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ roomId: selectedRoomId, title: title.trim(), startTime: startISO, endTime: endISO });
  };

  const selectedRoom = availableRooms.find((r) => r.id === selectedRoomId);

  return (
    <form className="booking-form" onSubmit={handleSubmit} noValidate>
      {/* ── Conflict Alert ─────────────────────────────────────────────── */}
      {conflicts && conflicts.length > 0 && (
        <ConflictAlert
          conflicts={conflicts}
          roomId={selectedRoomId}
          startTime={startISO}
          endTime={endISO}
          onDismiss={onClearConflicts}
          onSelectRoom={(room) => {
            setSelectedRoomId(room.id);
            onClearConflicts?.();
          }}
          onSelectSlot={(slot) => {
            // slot has startTime / endTime ISO strings
            const st = new Date(slot.startTime);
            const et = new Date(slot.endTime);
            setDate(st.toISOString().slice(0, 10));
            setStartTime(`${String(st.getHours()).padStart(2,'0')}:${String(st.getMinutes()).padStart(2,'0')}`);
            setEndTime(`${String(et.getHours()).padStart(2,'0')}:${String(et.getMinutes()).padStart(2,'0')}`);
            onClearConflicts?.();
          }}
        />
      )}

      {/* ── Step 1: Time Selection ─────────────────────────────────────── */}
      <div className="booking-form__step">
        <div className="booking-form__step-header">
          <span className="booking-form__step-num">1</span>
          <h3 className="booking-form__step-title">Chọn thời gian</h3>
        </div>

        <div className="booking-form__time-grid">
          <div className="booking-form__field">
            <label className="booking-form__label" htmlFor="booking-date">
              📅 Ngày họp
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
              <span>Ngày &amp; giờ bắt đầu</span>
            </div>
          </div>

          <div className="booking-form__field">
            <label className="booking-form__label" htmlFor="booking-end-time">
              🕐 Giờ kết thúc
            </label>
            <div className="booking-form__end-time">
              <select
                id="booking-end-time"
                className={`dtp-time-select ${errors.endTime ? 'input-error' : ''}`}
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setRoomsLoaded(false); }}
              >
                <option value="">-- Chọn giờ kết thúc --</option>
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
              <span className="spinner-sm" /> Đang tìm phòng...
            </>
          ) : (
            '🔍 Tìm phòng trống'
          )}
        </button>
      </div>

      {/* ── Step 2: Room Selection ─────────────────────────────────────── */}
      {(roomsLoaded || roomsLoading) && (
        <div className="booking-form__step">
          <div className="booking-form__step-header">
            <span className="booking-form__step-num">2</span>
            <h3 className="booking-form__step-title">Chọn phòng trống</h3>
          </div>

          {roomsLoading ? (
            <div className="booking-form__rooms-loading">
              <span className="spinner-sm" /> Đang tải danh sách phòng...
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="booking-form__no-rooms">
              😔 Không có phòng trống trong khung giờ này. Hãy chọn thời gian khác.
            </div>
          ) : (
            <div className="booking-form__rooms-grid">
              {(() => {
                const sorted = [...availableRooms].sort((a, b) => {
                  if (a.isFavorite && !b.isFavorite) return -1;
                  if (!a.isFavorite && b.isFavorite) return 1;
                  return 0;
                });
                return sorted.map((room) => (
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
                      <span>👥 {room.capacity} người</span>
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
              ));
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
            <h3 className="booking-form__step-title">Thông tin cuộc họp</h3>
          </div>

          <div className="booking-form__field">
            <label className="booking-form__label" htmlFor="booking-title">
              📝 Tiêu đề / Mục đích cuộc họp <span className="required">*</span>
            </label>
            <input
              id="booking-title"
              type="text"
              className={`booking-form__input ${errors.title ? 'input-error' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Họp sprint planning Q3, Review design..."
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
              <h4 className="booking-form__summary-title">📋 Tóm tắt đặt phòng</h4>
              <div className="booking-form__summary-row">
                <span>Phòng:</span>
                <strong>{selectedRoom.name}</strong>
              </div>
              {selectedRoom.location && (
                <div className="booking-form__summary-row">
                  <span>Vị trí:</span>
                  <strong>{selectedRoom.location}</strong>
                </div>
              )}
              <div className="booking-form__summary-row">
                <span>Thời gian:</span>
                <strong>
                  {new Date(startISO).toLocaleDateString('vi-VN')} &nbsp;
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
                <span className="spinner-sm" /> Đang đặt phòng...
              </>
            ) : (
              '✓ Xác nhận đặt phòng'
            )}
          </button>
        </div>
      )}
    </form>
  );
}

export default BookingForm;
