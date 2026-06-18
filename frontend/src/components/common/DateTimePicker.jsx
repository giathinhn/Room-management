import React, { useMemo } from 'react';
import './DateTimePicker.css';

// Generate time options: 07:00, 07:30, ..., 22:00 (every 30 minutes)
function generateTimeOptions() {
  const options = [];
  for (let h = 7; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 22 && m > 0) break;
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

/**
 * Get today's date in YYYY-MM-DD format.
 */
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get max date (today + 30 days) in YYYY-MM-DD format.
 */
function getMaxDateStr() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

/**
 * DateTimePicker — combined date + time picker component.
 *
 * @param {{
 *   dateValue: string,
 *   timeValue: string,
 *   onDateChange: (date: string) => void,
 *   onTimeChange: (time: string) => void,
 *   label: string,
 *   id: string,
 *   minDate?: string,
 *   error?: string,
 *   disabled?: boolean,
 * }} props
 */
function DateTimePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  label,
  id,
  minDate,
  error,
  disabled = false,
}) {
  const today = getTodayStr();
  const maxDate = getMaxDateStr();

  return (
    <div className={`dtp-wrapper ${error ? 'dtp-error' : ''}`}>
      {label && (
        <label className="dtp-label" htmlFor={`${id}-date`}>
          {label}
        </label>
      )}
      <div className="dtp-inputs">
        <input
          id={`${id}-date`}
          type="date"
          className="dtp-date-input"
          value={dateValue}
          min={minDate || today}
          max={maxDate}
          onChange={(e) => onDateChange(e.target.value)}
          disabled={disabled}
        />
        <select
          id={`${id}-time`}
          className="dtp-time-select"
          value={timeValue}
          onChange={(e) => onTimeChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">-- Chọn giờ --</option>
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="dtp-error-msg">{error}</p>}
    </div>
  );
}

export default DateTimePicker;
