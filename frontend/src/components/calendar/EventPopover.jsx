import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiMapPin, FiUser, FiClock, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import bookingService from '../../services/booking.service';
import toast from 'react-hot-toast';
import './EventPopover.css';

const STATUS_CLASS = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
  cancelled: 'badge-cancelled',
};

/**
 * EventPopover — shown when user clicks a calendar event.
 * Displays booking details with actions (view detail, cancel).
 *
 * @param {{ event: object, position: {x: number, y: number}, onClose: () => void, onRefresh: () => void }} props
 */
function EventPopover({ event, position, onClose, onRefresh }) {
  const { t, i18n } = useTranslation();
  const popoverRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOwner = user?.id === event.userId;
  const isAdminOrApprover = user?.role === 'admin' || user?.role === 'approver';
  const canCancel = (isOwner || isAdminOrApprover) && (event.status === 'pending' || event.status === 'approved');
  const canApprove = isAdminOrApprover && event.status === 'pending';

  const statusLabel = {
    pending: t('bookings.status.pending'),
    approved: t('bookings.status.approved'),
    rejected: t('bookings.status.rejected'),
    cancelled: t('bookings.status.cancelled'),
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
    return d.toLocaleString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Adjust position so popover doesn't overflow viewport
  useEffect(() => {
    if (!popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = position.x;
    let y = position.y;

    if (x + rect.width > vw - 16) x = vw - rect.width - 16;
    if (y + rect.height > vh - 16) y = vh - rect.height - 16;
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    popoverRef.current.style.left = `${x}px`;
    popoverRef.current.style.top = `${y}px`;
  }, [position]);

  const handleCancel = async () => {
    try {
      await bookingService.cancelBooking(event.id);
      toast.success(t('calendar.popover.cancelSuccess'));
      onRefresh();
      onClose();
    } catch {
      toast.error(t('calendar.popover.cancelError'));
    }
  };

  const handleApprove = async () => {
    try {
      await bookingService.approveBooking(event.id);
      toast.success(t('calendar.popover.approveSuccess'));
      onRefresh();
      onClose();
    } catch {
      toast.error(t('calendar.popover.approveError'));
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="ep-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Popover */}
      <div
        ref={popoverRef}
        className="ep"
        role="dialog"
        aria-label={t('calendar.bookingDetails')}
        style={{ left: position.x, top: position.y }}
      >
        {/* Header */}
        <div className="ep__header">
          <div className="ep__status-dot" data-status={event.status} />
          <h3 className="ep__title" title={event.title}>{event.title}</h3>
          <button className="ep__close" onClick={onClose} aria-label={t('common.close')}>
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="ep__body">
          <div className="ep__row">
            <FiMapPin className="ep__row-icon" />
            <span>{event.roomName || 'N/A'}</span>
          </div>
          <div className="ep__row">
            <FiUser className="ep__row-icon" />
            <span>{event.userName || 'N/A'}</span>
          </div>
          <div className="ep__row">
            <FiClock className="ep__row-icon" />
            <span>
              {formatDateTime(event.start)}<br />
              <span style={{ opacity: 0.7, fontSize: '0.78rem' }}>→ {formatDateTime(event.end)}</span>
            </span>
          </div>

          <div className="ep__status-row">
            <span className={`badge ${STATUS_CLASS[event.status]}`}>
              {statusLabel[event.status] || event.status}
            </span>
            {event.isRecurring && (
              <span className="badge badge--info ep__recurring-badge">🔄 {t('calendar.popover.recurring')}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="ep__actions">
          <button
            className="btn btn--secondary btn--sm ep__action-btn"
            onClick={() => navigate(`/bookings/${event.id}`)}
          >
            <FiArrowRight /> {t('calendar.popover.viewDetails')}
          </button>

          {canApprove && (
            <button
              className="btn btn--sm ep__action-btn ep__action-btn--approve"
              onClick={handleApprove}
            >
              ✅ {t('bookings.approve')}
            </button>
          )}

          {canCancel && (
            <button
              className="btn btn--danger btn--sm ep__action-btn"
              onClick={handleCancel}
            >
              ✕ {t('common.cancel')}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default EventPopover;
