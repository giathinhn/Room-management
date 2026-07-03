import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import './RoomForm.css';

const EQUIPMENT_OPTIONS = [
  { value: 'Máy chiếu', icon: '📽️' },
  { value: 'Micro',     icon: '🎤' },
  { value: 'Bảng trắng', icon: '📋' },
  { value: 'TV',        icon: '🖥️' },
  { value: 'Webcam',    icon: '📷' },
  { value: 'Loa',       icon: '🔊' },
  { value: 'Điều hòa',  icon: '❄️' },
];

const EMPTY_FORM = {
  name: '',
  capacity: '',
  floor: '',
  building: '',
  equipment: [],
};

/**
 * RoomForm — Modal form used for both creating and editing a room.
 *
 * Props:
 *   isOpen    {boolean}          Whether the modal is visible
 *   onClose   {Function}         Called to close the modal
 *   onSubmit  {Function}         Called with form data { name, capacity, location, floor, building, equipment }
 *   room      {object|null}      If provided, pre-fills the form (edit mode)
 *   isLoading {boolean}          Disable submit while request is in flight
 */
function RoomForm({ isOpen, onClose, onSubmit, room = null, isLoading = false }) {
  const [form, setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Pre-fill when editing
  useEffect(() => {
    if (room) {
      setForm({
        name:      room.name      || '',
        capacity:  room.capacity  || '',
        floor:     room.floor     || '',
        building:  room.building  || '',
        equipment: room.equipment || [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [room, isOpen]);

  // ── Field handlers ──────────────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleEquipmentToggle(item) {
    setForm((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter((e) => e !== item)
        : [...prev.equipment, item],
    }));
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = 'Tên phòng là bắt buộc';
    } else if (form.name.trim().length > 100) {
      errs.name = 'Tên phòng tối đa 100 ký tự';
    }

    const cap = Number(form.capacity);
    if (!form.capacity) {
      errs.capacity = 'Sức chứa là bắt buộc';
    } else if (!Number.isInteger(cap) || cap < 1 || cap > 500) {
      errs.capacity = 'Sức chứa phải là số nguyên từ 1 đến 500';
    }

    if (!form.building.trim()) {
      errs.building = 'Tòa nhà là bắt buộc';
    } else if (form.building.trim().length > 50) {
      errs.building = 'Tòa nhà tối đa 50 ký tự';
    }

    if (!form.floor.trim()) {
      errs.floor = 'Tầng là bắt buộc';
    } else if (form.floor.trim().length > 50) {
      errs.floor = 'Tầng tối đa 50 ký tự';
    }

    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSubmit({
      name:      form.name.trim(),
      capacity:  Number(form.capacity),
      floor:     form.floor.trim(),
      building:  form.building.trim(),
      equipment: form.equipment,
    });
  }

  const isEdit = Boolean(room);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa phòng họp' : 'Thêm phòng họp mới'}
    >
      <form id="room-form" className="room-form" onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <div className="form-group">
          <label htmlFor="room-name" className="form-label">
            Tên phòng <span className="form-required">*</span>
          </label>
          <input
            id="room-name"
            name="name"
            type="text"
            className={`form-input${errors.name ? ' form-input--error' : ''}`}
            placeholder="Vd: Phòng họp A1"
            value={form.name}
            onChange={handleChange}
            maxLength={100}
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        {/* Capacity */}
        <div className="form-group">
          <label htmlFor="room-capacity" className="form-label">
            Sức chứa <span className="form-required">*</span>
          </label>
          <input
            id="room-capacity"
            name="capacity"
            type="number"
            min={1}
            max={500}
            className={`form-input${errors.capacity ? ' form-input--error' : ''}`}
            placeholder="Vd: 10"
            value={form.capacity}
            onChange={handleChange}
          />
          {errors.capacity && <p className="form-error">{errors.capacity}</p>}
        </div>



        {/* Building & Floor (Mandatory) */}
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="room-building" className="form-label">
              Tòa nhà <span className="form-required">*</span>
            </label>
            <input
              id="room-building"
              name="building"
              type="text"
              className={`form-input${errors.building ? ' form-input--error' : ''}`}
              placeholder="Vd: A"
              value={form.building}
              onChange={handleChange}
              maxLength={50}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            />
            {errors.building && <p className="form-error" style={{ marginTop: '4px' }}>{errors.building}</p>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="room-floor" className="form-label">
              Tầng <span className="form-required">*</span>
            </label>
            <input
              id="room-floor"
              name="floor"
              type="text"
              className={`form-input${errors.floor ? ' form-input--error' : ''}`}
              placeholder="Vd: 3"
              value={form.floor}
              onChange={handleChange}
              maxLength={50}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            />
            {errors.floor && <p className="form-error" style={{ marginTop: '4px' }}>{errors.floor}</p>}
          </div>
        </div>

        {/* Equipment */}
        <div className="form-group">
          <label className="form-label">Thiết bị</label>
          <div className="room-form__equipment-grid">
            {EQUIPMENT_OPTIONS.map(({ value, icon }) => {
              const checked = form.equipment.includes(value);
              return (
                <label
                  key={value}
                  className={`room-form__equipment-option${checked ? ' selected' : ''}`}
                  htmlFor={`equip-${value}`}
                >
                  <input
                    id={`equip-${value}`}
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleEquipmentToggle(value)}
                    className="room-form__equipment-checkbox"
                  />
                  <span className="room-form__equipment-icon">{icon}</span>
                  <span className="room-form__equipment-label">{value}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Form actions */}
        <div className="room-form__actions">
          <button
            type="button"
            id="room-form-cancel-btn"
            className="btn btn--secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            id="room-form-submit-btn"
            className="btn btn--primary"
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Thêm phòng'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default RoomForm;
