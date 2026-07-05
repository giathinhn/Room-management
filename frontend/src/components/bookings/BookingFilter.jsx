import React from 'react';
import { useTranslation } from 'react-i18next';
import './BookingFilter.css';

/**
 * BookingFilter — filter bar for the bookings list page.
 *
 * @param {{
 *   rooms: Array<{ id, name }>,
 *   filters: { roomId, status, startDate, endDate },
 *   onChange: (filters) => void,
 *   onReset: () => void,
 * }} props
 */
function BookingFilter({ rooms = [], filters, onChange, onReset }) {
  const { t } = useTranslation();
  const hasFilters =
    filters.roomId || filters.status || filters.startDate || filters.endDate;

  const statusOptions = [
    { value: '', label: t('bookings.allStatus') },
    { value: 'pending', label: `🟡 ${t('bookings.status.pending')}` },
    { value: 'approved', label: `🟢 ${t('bookings.status.approved')}` },
    { value: 'rejected', label: `🔴 ${t('bookings.status.rejected')}` },
    { value: 'cancelled', label: `⚪ ${t('bookings.status.cancelled')}` },
  ];

  return (
    <div className="booking-filter">
      {/* Room dropdown */}
      <select
        id="filter-room"
        className="booking-filter__select"
        value={filters.roomId || ''}
        onChange={(e) => onChange({ ...filters, roomId: e.target.value, page: 1 })}
      >
        <option value="">📍 {t('calendar.allRooms')}</option>
        {(() => {
          const sorted = [...rooms].sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return 0;
          });
          return sorted.map((r) => (
            <option key={r.id} value={r.id}>
              {r.isFavorite ? '⭐ ' : ''}{r.name}
            </option>
          ));
        })()}
      </select>

      {/* Status dropdown */}
      <select
        id="filter-status"
        className="booking-filter__select"
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: e.target.value, page: 1 })}
      >
        {statusOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Date range */}
      <div className="booking-filter__date-range">
        <input
          id="filter-start-date"
          type="date"
          className="booking-filter__date"
          value={filters.startDate || ''}
          onChange={(e) => onChange({ ...filters, startDate: e.target.value, page: 1 })}
          placeholder={t('bookings.fromDate')}
          aria-label={t('bookings.fromDate')}
        />
        <span className="booking-filter__date-sep">→</span>
        <input
          id="filter-end-date"
          type="date"
          className="booking-filter__date"
          value={filters.endDate || ''}
          min={filters.startDate || undefined}
          onChange={(e) => onChange({ ...filters, endDate: e.target.value, page: 1 })}
          placeholder={t('bookings.toDate')}
          aria-label={t('bookings.toDate')}
        />
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          id="filter-reset-btn"
          className="booking-filter__reset"
          onClick={onReset}
        >
          ↺ {t('bookings.clearFilters')}
        </button>
      )}
    </div>
  );
}

export default BookingFilter;
