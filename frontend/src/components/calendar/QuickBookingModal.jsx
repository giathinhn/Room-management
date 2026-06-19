import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import bookingService from '../../services/booking.service';
import roomService from '../../services/room.service';
import './QuickBookingModal.css';

/**
 * Format a Date to "YYYY-MM-DDTHH:mm" for datetime-local input.
 */
function toLocalDateTimeInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/**
 * QuickBookingModal — opened when user clicks an empty slot on the calendar.
 * Pre-fills date/time from the selected slot.
 *
 * @param {{ startTime: Date, endTime: Date, onClose: () => void, onSuccess: () => void }} props
 */
function QuickBookingModal({ startTime, endTime, onClose, onSuccess }) {
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  const [form, setForm] = useState({
    title: '',
    roomId: '',
    startTime: toLocalDateTimeInput(startTime),
    endTime: toLocalDateTimeInput(endTime),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Load all rooms on mount
  useEffect(() => {
    roomService.getRooms({ limit: 100 }).then((res) => {
      setRooms(res.data || []);
    }).catch(() => {});
  }, []);

  // Load available rooms when time changes
  useEffect(() => {
    if (!form.startTime || !form.endTime) return;
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    if (isNaN(start) || isNaN(end) || start >= end) return;

    setIsLoadingRooms(true);
    roomService
      .getAvailableRooms({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      })
      .then((res) => {
        setAvailableRooms(res.data || []);
      })
      .catch(() => {
        setAvailableRooms(rooms); // fallback to all rooms
      })
      .finally(() => setIsLoadingRooms(false));
  }, [form.startTime, form.endTime]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề';
    if (!form.roomId) newErrors.roomId = 'Vui lòng chọn phòng';
    if (!form.startTime) newErrors.startTime = 'Vui lòng chọn giờ bắt đầu';
    if (!form.endTime) newErrors.endTime = 'Vui lòng chọn giờ kết thúc';
    if (form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime)) {
      newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await bookingService.createBooking({
        title: form.title.trim(),
        roomId: form.roomId,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      toast.success('Đặt phòng thành công! Đang chờ duyệt.');
      onSuccess();
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Thời gian bị trùng! Vui lòng chọn thời gian hoặc phòng khác.');
      } else {
        const msg = err.response?.data?.message || 'Đặt phòng thất bại.';
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRooms = availableRooms.length > 0 ? availableRooms : rooms;

  return (
    <div className="qbm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qbm" role="dialog" aria-modal="true" aria-label="Đặt phòng nhanh">
        {/* Header */}
        <div className="qbm__header">
          <div className="qbm__header-icon">
            <FiZap />
          </div>
          <div>
            <h2 className="qbm__title">Đặt phòng nhanh</h2>
            <p className="qbm__subtitle">Điền thông tin để đặt phòng họp</p>
          </div>
          <button className="qbm__close" onClick={onClose} aria-label="Đóng">
            <FiX />
          </button>
        </div>

        {/* Form */}
        <form className="qbm__form" onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="qbm__field">
            <label htmlFor="qbm-title" className="qbm__label">
              Tiêu đề cuộc họp <span className="form-required">*</span>
            </label>
            <input
              id="qbm-title"
              type="text"
              className={`qbm__input ${errors.title ? 'qbm__input--error' : ''}`}
              placeholder="Họp sprint planning, Team review..."
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              maxLength={200}
              autoFocus
            />
            {errors.title && <p className="qbm__error">{errors.title}</p>}
          </div>

          {/* Time row */}
          <div className="qbm__time-row">
            <div className="qbm__field">
              <label htmlFor="qbm-start" className="qbm__label">
                <FiCalendar /> Bắt đầu <span className="form-required">*</span>
              </label>
              <input
                id="qbm-start"
                type="datetime-local"
                className={`qbm__input ${errors.startTime ? 'qbm__input--error' : ''}`}
                value={form.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
              />
              {errors.startTime && <p className="qbm__error">{errors.startTime}</p>}
            </div>

            <div className="qbm__field">
              <label htmlFor="qbm-end" className="qbm__label">
                <FiCalendar /> Kết thúc <span className="form-required">*</span>
              </label>
              <input
                id="qbm-end"
                type="datetime-local"
                className={`qbm__input ${errors.endTime ? 'qbm__input--error' : ''}`}
                value={form.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
              />
              {errors.endTime && <p className="qbm__error">{errors.endTime}</p>}
            </div>
          </div>

          {/* Room */}
          <div className="qbm__field">
            <label htmlFor="qbm-room" className="qbm__label">
              Phòng họp <span className="form-required">*</span>
              {isLoadingRooms && <span className="qbm__loading-hint"> đang tải...</span>}
              {availableRooms.length > 0 && !isLoadingRooms && (
                <span className="qbm__available-hint"> ({availableRooms.length} phòng trống)</span>
              )}
            </label>
            <select
              id="qbm-room"
              className={`qbm__input qbm__select ${errors.roomId ? 'qbm__input--error' : ''}`}
              value={form.roomId}
              onChange={(e) => handleChange('roomId', e.target.value)}
              disabled={isLoadingRooms}
            >
              <option value="">-- Chọn phòng --</option>
              {displayRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                  {room.capacity ? ` (${room.capacity} người)` : ''}
                  {room.location ? ` — ${room.location}` : ''}
                </option>
              ))}
            </select>
            {errors.roomId && <p className="qbm__error">{errors.roomId}</p>}
          </div>

          {/* Actions */}
          <div className="qbm__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              id="qbm-submit-btn"
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ Đang đặt...' : '⚡ Đặt phòng ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickBookingModal;
