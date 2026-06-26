import React, { useState, useEffect } from 'react';
import roomService from '../../services/room.service';
import './TemplateForm.css';

/**
 * TemplateForm — Modal for creating or editing a booking template.
 *
 * Props:
 *   mode        — 'create' | 'edit'
 *   initial     — initial field values (for edit mode)
 *   onSave      — async (formData) => void
 *   onClose     — close the modal
 *   isLoading   — submit in progress
 */
function TemplateForm({ mode = 'create', initial = {}, onSave, onClose, isLoading }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    roomId: initial.roomId || '',
    title: initial.title || '',
    startTime: formatTimeForInput(initial.startTime),
    endTime: formatTimeForInput(initial.endTime),
  });

  const [errors, setErrors] = useState({});
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Load rooms for dropdown
  useEffect(() => {
    setRoomsLoading(true);
    roomService
      .getRooms({ limit: 100 })
      .then((res) => setRooms(res.data || []))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, []);

  function formatTimeForInput(timeStr) {
    if (!timeStr) return '';
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Tên mẫu là bắt buộc';
    else if (form.name.trim().length > 100) newErrors.name = 'Tên mẫu không quá 100 ký tự';

    if (!form.title.trim()) newErrors.title = 'Tiêu đề cuộc họp là bắt buộc';
    else if (form.title.trim().length > 200) newErrors.title = 'Tiêu đề không quá 200 ký tự';

    if (!form.startTime) newErrors.startTime = 'Giờ bắt đầu là bắt buộc';
    if (!form.endTime) newErrors.endTime = 'Giờ kết thúc là bắt buộc';

    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      roomId: form.roomId || undefined,
      title: form.title.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
    });
  };

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="tpl-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="tpl-modal">
        {/* Header */}
        <div className="tpl-modal__header">
          <h2 className="tpl-modal__title">
            {mode === 'create' ? '➕ Tạo mẫu mới' : '✏️ Chỉnh sửa mẫu'}
          </h2>
          <button
            id="tpl-modal-close-btn"
            className="tpl-modal__close"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="tpl-modal__form">
          {/* Template name */}
          <div className={`tpl-modal__field ${errors.name ? 'tpl-modal__field--error' : ''}`}>
            <label htmlFor="tpl-name" className="tpl-modal__label">
              Tên mẫu <span className="tpl-modal__required">*</span>
            </label>
            <input
              id="tpl-name"
              type="text"
              className="tpl-modal__input"
              placeholder="vd: Họp sprint hàng tuần"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              maxLength={100}
              autoFocus
            />
            {errors.name && <span className="tpl-modal__error">{errors.name}</span>}
          </div>

          {/* Meeting title */}
          <div className={`tpl-modal__field ${errors.title ? 'tpl-modal__field--error' : ''}`}>
            <label htmlFor="tpl-title" className="tpl-modal__label">
              Tiêu đề cuộc họp <span className="tpl-modal__required">*</span>
            </label>
            <input
              id="tpl-title"
              type="text"
              className="tpl-modal__input"
              placeholder="vd: Sprint Planning Q3"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              maxLength={200}
            />
            {errors.title && <span className="tpl-modal__error">{errors.title}</span>}
          </div>

          {/* Room dropdown */}
          <div className="tpl-modal__field">
            <label htmlFor="tpl-room" className="tpl-modal__label">
              Phòng họp <span className="tpl-modal__optional">(tuỳ chọn)</span>
            </label>
            <select
              id="tpl-room"
              className="tpl-modal__select"
              value={form.roomId}
              onChange={(e) => handleChange('roomId', e.target.value)}
              disabled={roomsLoading}
            >
              <option value="">-- Không chọn phòng --</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.location})
                </option>
              ))}
            </select>
          </div>

          {/* Time range */}
          <div className="tpl-modal__time-row">
            <div className={`tpl-modal__field ${errors.startTime ? 'tpl-modal__field--error' : ''}`}>
              <label htmlFor="tpl-start" className="tpl-modal__label">
                Giờ bắt đầu <span className="tpl-modal__required">*</span>
              </label>
              <input
                id="tpl-start"
                type="time"
                className="tpl-modal__input"
                value={form.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
              />
              {errors.startTime && <span className="tpl-modal__error">{errors.startTime}</span>}
            </div>

            <div className={`tpl-modal__field ${errors.endTime ? 'tpl-modal__field--error' : ''}`}>
              <label htmlFor="tpl-end" className="tpl-modal__label">
                Giờ kết thúc <span className="tpl-modal__required">*</span>
              </label>
              <input
                id="tpl-end"
                type="time"
                className="tpl-modal__input"
                value={form.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
              />
              {errors.endTime && <span className="tpl-modal__error">{errors.endTime}</span>}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="tpl-modal__footer">
            <button
              id="tpl-modal-cancel-btn"
              type="button"
              className="tpl-modal__btn tpl-modal__btn--cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              id="tpl-modal-save-btn"
              type="submit"
              className="tpl-modal__btn tpl-modal__btn--save"
              disabled={isLoading}
            >
              {isLoading ? 'Đang lưu...' : mode === 'create' ? '💾 Tạo mẫu' : '💾 Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TemplateForm;
