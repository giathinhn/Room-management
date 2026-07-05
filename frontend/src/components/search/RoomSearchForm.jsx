import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './RoomSearchForm.css';

/**
 * RoomSearchForm — form to search for available rooms.
 *
 * @param {{ onSearch: (params) => void, isLoading?: boolean }} props
 */
function RoomSearchForm({ onSearch, isLoading = false }) {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [date,      setDate]      = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime,   setEndTime]   = useState('10:00');
  const [capacity,  setCapacity]  = useState('');
  const [location,  setLocation]  = useState('');
  const [equipment, setEquipment] = useState([]);

  const equipmentOptions = [
    { value: 'Máy chiếu', icon: '📽️', label: t('rooms.equipmentOptions.projector') },
    { value: 'Micro',     icon: '🎤', label: t('rooms.equipmentOptions.microphone') },
    { value: 'Bảng trắng', icon: '📋', label: t('rooms.equipmentOptions.whiteboard') },
    { value: 'TV',        icon: '🖥️', label: t('rooms.equipmentOptions.tv') },
    { value: 'Webcam',    icon: '📷', label: t('rooms.equipmentOptions.webcam') },
    { value: 'Loa',       icon: '🔊', label: t('rooms.equipmentOptions.speaker') },
    { value: 'Điều hòa',  icon: '❄️', label: t('rooms.equipmentOptions.airConditioner') },
  ];

  const toggleEquipment = (value) => {
    setEquipment((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build local Date objects, then convert to ISO (UTC)
    const startLocal = new Date(`${date}T${startTime}:00`);
    const endLocal   = new Date(`${date}T${endTime}:00`);

    // Validate times
    if (startLocal >= endLocal) {
      alert(t('roomSearch.form.validation.timeRangeError'));
      return;
    }

    onSearch({
      startTime: startLocal.toISOString(),
      endTime:   endLocal.toISOString(),
      capacity:  capacity || undefined,
      location:  location || undefined,
      equipment: equipment.length > 0 ? equipment : undefined,
    });
  };

  return (
    <form className="room-search-form" onSubmit={handleSubmit} id="room-search-form">
      {/* Date & Time */}
      <div className="rsf__row">
        <div className="rsf__field">
          <label htmlFor="rsf-date" className="rsf__label">📅 {t('roomSearch.form.date')}</label>
          <input
            id="rsf-date"
            type="date"
            className="rsf__input"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="rsf__field">
          <label htmlFor="rsf-start" className="rsf__label">🕐 {t('roomSearch.form.fromTime')}</label>
          <input
            id="rsf-start"
            type="time"
            className="rsf__input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div className="rsf__field">
          <label htmlFor="rsf-end" className="rsf__label">🕓 {t('roomSearch.form.toTime')}</label>
          <input
            id="rsf-end"
            type="time"
            className="rsf__input"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Capacity & Location */}
      <div className="rsf__row">
        <div className="rsf__field">
          <label htmlFor="rsf-capacity" className="rsf__label">👥 {t('roomSearch.form.minCapacity')}</label>
          <input
            id="rsf-capacity"
            type="number"
            className="rsf__input"
            placeholder={t('roomSearch.form.capacityPlaceholder')}
            min={1}
            max={500}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>

        <div className="rsf__field rsf__field--grow">
          <label htmlFor="rsf-location" className="rsf__label">📍 {t('roomSearch.form.location')}</label>
          <input
            id="rsf-location"
            type="text"
            className="rsf__input"
            placeholder={t('roomSearch.form.locationPlaceholder')}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      {/* Equipment */}
      <div className="rsf__field">
        <span className="rsf__label">🔧 {t('roomSearch.form.equipmentRequired')}</span>
        <div className="rsf__equipment-grid">
          {equipmentOptions.map(({ value, icon, label }) => (
            <label
              key={value}
              className={`rsf__equip-tag ${equipment.includes(value) ? 'selected' : ''}`}
              htmlFor={`eq-${value}`}
            >
              <input
                id={`eq-${value}`}
                type="checkbox"
                checked={equipment.includes(value)}
                onChange={() => toggleEquipment(value)}
                className="rsf__equip-checkbox"
              />
              {icon} {label}
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="rsf__actions">
        <button
          id="room-search-submit-btn"
          type="submit"
          className="rsf__submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="rsf__spinner" />
          ) : (
            <>🔍 {t('roomSearch.form.submitBtn')}</>
          )}
        </button>
      </div>
    </form>
  );
}

export default RoomSearchForm;
