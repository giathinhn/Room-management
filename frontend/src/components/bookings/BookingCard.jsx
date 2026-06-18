import React from 'react';
import StatusBadge from '../common/StatusBadge';
import RecurringBadge from './RecurringBadge';
import './BookingCard.css';

/**
 * Format a date range string like "20/06 09:00 – 10:30"
 */
function formatDateRange(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const date = start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const startStr = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const endStr = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return `${date} • ${startStr} – ${endStr}`;
}

/**
 * Calculate human-readable duration.
 */
function formatDuration(startTime, endTime) {
  const diffMs = new Date(endTime) - new Date(startTime);
  const totalMins = Math.round(diffMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h}h${m}p`;
  if (h > 0) return `${h} giờ`;
  return `${m} phút`;
}

/**
 * BookingCard — displays booking info with action buttons.
 *
 * @param {{
 *   booking: object,
 *   currentUser: { id: string, role: string },
 *   onApprove?: (id: string) => void,
 *   onReject?: (id: string) => void,
 *   onCancel?: (id: string) => void,
 *   onClick?: (id: string) => void,
 * }} props
 */
function BookingCard({ booking, currentUser, onApprove, onReject, onCancel, onClick }) {
  const { id, title, status, startTime, endTime, room, user, recurringId, recurring } = booking;

  const isOwner = currentUser?.id === booking.userId;
  const isAdmin = currentUser?.role === 'admin';
  const isApprover = currentUser?.role === 'approver';

  const canApproveReject = (isAdmin || isApprover) && status === 'pending';
  const canCancel = (isOwner || isAdmin) && ['pending', 'approved'].includes(status);

  return (
    <div
      className={`booking-card booking-card--${status}`}
      onClick={() => onClick?.(id)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(id)}
    >
      <div className="booking-card__header">
        <div className="booking-card__status-title">
          <StatusBadge status={status} />
          <h3 className="booking-card__title">{title}</h3>
        </div>
        <div className="booking-card__header-right">
          {recurringId && (
            <RecurringBadge
              frequency={recurring?.frequency}
            />
          )}
          <span className="booking-card__duration">{formatDuration(startTime, endTime)}</span>
        </div>
      </div>

      <div className="booking-card__body">
        <div className="booking-card__info">
          <span className="booking-card__info-item">
            <span className="booking-card__icon">📍</span>
            {room?.name}
            {room?.location ? ` — ${room.location}` : ''}
          </span>
          <span className="booking-card__info-item">
            <span className="booking-card__icon">🕐</span>
            {formatDateRange(startTime, endTime)}
          </span>
          <span className="booking-card__info-item">
            <span className="booking-card__icon">👤</span>
            {user?.fullName || user?.email}
          </span>
        </div>
      </div>

      {(canApproveReject || canCancel) && (
        <div className="booking-card__actions" onClick={(e) => e.stopPropagation()}>
          {canApproveReject && (
            <>
              <button
                id={`approve-btn-${id}`}
                className="btn-action btn-approve"
                onClick={() => onApprove?.(id)}
              >
                ✓ Duyệt
              </button>
              <button
                id={`reject-btn-${id}`}
                className="btn-action btn-reject"
                onClick={() => onReject?.(id)}
              >
                ✗ Từ chối
              </button>
            </>
          )}
          {canCancel && (
            <button
              id={`cancel-btn-${id}`}
              className="btn-action btn-cancel"
              onClick={() => onCancel?.(id)}
            >
              Hủy
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BookingCard;
