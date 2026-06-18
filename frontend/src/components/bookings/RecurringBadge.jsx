import React from 'react';
import './RecurringBadge.css';

const FREQUENCY_LABELS = {
  daily: { label: 'Hàng ngày', icon: '🔄' },
  weekly: { label: 'Hàng tuần', icon: '🔄' },
  monthly: { label: 'Hàng tháng', icon: '🔄' },
};

/**
 * RecurringBadge — small badge shown on BookingCard when the booking
 * belongs to a recurring series. Clicking it triggers the onViewSeries callback.
 *
 * @param {{
 *   frequency: 'daily' | 'weekly' | 'monthly',
 *   onViewSeries?: () => void,
 * }} props
 */
function RecurringBadge({ frequency, onViewSeries }) {
  if (!frequency) return null;

  const { label, icon } = FREQUENCY_LABELS[frequency] || { label: frequency, icon: '🔄' };

  return (
    <button
      type="button"
      className="recurring-badge"
      onClick={(e) => {
        e.stopPropagation();
        onViewSeries?.();
      }}
      title={`Đặt định kỳ: ${label}`}
      aria-label={`Xem chuỗi đặt phòng định kỳ — ${label}`}
    >
      <span className="recurring-badge__icon">{icon}</span>
      <span className="recurring-badge__label">{label}</span>
    </button>
  );
}

export default RecurringBadge;
