import React from 'react';
import './ConflictAlert.css';

/**
 * Format a datetime string to readable Vietnamese format.
 */
function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * ConflictAlert — shown when a booking creation fails due to time conflicts.
 *
 * @param {{
 *   conflicts: Array<{ id: string, title: string, startTime: string, endTime: string, user: { fullName, email } }>,
 *   onDismiss: () => void,
 * }} props
 */
function ConflictAlert({ conflicts, onDismiss }) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="conflict-alert" role="alert">
      <div className="conflict-alert__header">
        <div className="conflict-alert__icon">⚠️</div>
        <div className="conflict-alert__heading">
          <h4 className="conflict-alert__title">Trùng lịch đặt phòng!</h4>
          <p className="conflict-alert__subtitle">
            Thời gian bạn chọn đang bị chiếm bởi {conflicts.length} lịch sau:
          </p>
        </div>
        <button
          id="conflict-alert-dismiss"
          className="conflict-alert__dismiss"
          onClick={onDismiss}
          aria-label="Đóng"
        >
          ×
        </button>
      </div>

      <ul className="conflict-alert__list">
        {conflicts.map((c) => (
          <li key={c.id} className="conflict-alert__item">
            <div className="conflict-alert__item-title">{c.title}</div>
            <div className="conflict-alert__item-time">
              🕐 {formatDateTime(c.startTime)} – {formatDateTime(c.endTime)}
            </div>
            {c.user && (
              <div className="conflict-alert__item-user">
                👤 {c.user.fullName || c.user.email}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="conflict-alert__suggestion">
        💡 Hãy chọn thời gian khác hoặc phòng khác để đặt phòng.
      </div>
    </div>
  );
}

export default ConflictAlert;
