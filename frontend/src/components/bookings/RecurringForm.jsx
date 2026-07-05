import React from 'react';
import { useTranslation } from 'react-i18next';
import './RecurringForm.css';

/**
 * RecurringForm — form section for configuring recurring booking parameters.
 *
 * @param {{
 *   values: { startDate, endDate, startTime, endTime, frequency },
 *   onChange: (field, value) => void,
 *   onPreview: () => void,
 *   isLoading: boolean,
 * }} props
 */
function RecurringForm({ values, onChange, onPreview, isLoading }) {
  const { t } = useTranslation();
  const { startDate, endDate, startTime, endTime, frequency } = values;

  const frequencyOptions = [
    { value: 'daily', label: t('bookings.recurring.daily'), icon: '📅' },
    { value: 'weekly', label: t('bookings.recurring.weekly'), icon: '📆' },
    { value: 'monthly', label: t('bookings.recurring.monthly'), icon: '🗓️' },
  ];

  // Calculate max endDate (6 months from startDate)
  const maxEndDate = startDate
    ? (() => {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + 6);
        return d.toISOString().split('T')[0];
      })()
    : '';

  const minStartDate = new Date().toISOString().split('T')[0];

  return (
    <div className="recurring-form">
      {/* Date Range */}
      <div className="recurring-form__row">
        <div className="recurring-form__field">
          <label htmlFor="recurring-start-date" className="recurring-form__label">
            {t('bookings.recurring.startDate')}
          </label>
          <input
            id="recurring-start-date"
            type="date"
            className="recurring-form__input"
            value={startDate}
            min={minStartDate}
            onChange={(e) => onChange('startDate', e.target.value)}
            required
          />
        </div>
        <div className="recurring-form__field">
          <label htmlFor="recurring-end-date" className="recurring-form__label">
            {t('bookings.recurring.endDate')}
          </label>
          <input
            id="recurring-end-date"
            type="date"
            className="recurring-form__input"
            value={endDate}
            min={startDate || minStartDate}
            max={maxEndDate}
            onChange={(e) => onChange('endDate', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Time Range */}
      <div className="recurring-form__row">
        <div className="recurring-form__field">
          <label htmlFor="recurring-start-time" className="recurring-form__label">
            {t('bookings.startTime')}
          </label>
          <input
            id="recurring-start-time"
            type="time"
            className="recurring-form__input"
            value={startTime}
            min="07:00"
            max="21:30"
            onChange={(e) => onChange('startTime', e.target.value)}
            required
          />
        </div>
        <div className="recurring-form__field">
          <label htmlFor="recurring-end-time" className="recurring-form__label">
            {t('bookings.endTime')}
          </label>
          <input
            id="recurring-end-time"
            type="time"
            className="recurring-form__input"
            value={endTime}
            min={startTime || '07:30'}
            max="22:00"
            onChange={(e) => onChange('endTime', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Frequency Selector */}
      <div className="recurring-form__field">
        <label className="recurring-form__label">{t('bookings.recurring.frequency')}</label>
        <div className="recurring-form__frequency" role="radiogroup" aria-label={t('bookings.recurring.frequency')}>
          {frequencyOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              id={`frequency-${opt.value}`}
              role="radio"
              aria-checked={frequency === opt.value}
              className={`recurring-form__freq-btn ${frequency === opt.value ? 'recurring-form__freq-btn--active' : ''}`}
              onClick={() => onChange('frequency', opt.value)}
            >
              <span className="recurring-form__freq-icon">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Button */}
      <button
        id="preview-recurring-btn"
        type="button"
        className="recurring-form__preview-btn"
        onClick={onPreview}
        disabled={isLoading || !startDate || !endDate || !startTime || !endTime || !frequency}
      >
        {isLoading ? (
          <>
            <span className="recurring-form__spinner" />
            {t('bookings.recurring.checking')}
          </>
        ) : (
          t('bookings.recurring.previewSlots')
        )}
      </button>
    </div>
  );
}

export default RecurringForm;
