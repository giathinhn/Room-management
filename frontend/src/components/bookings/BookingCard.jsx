import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import bookingService from '../../services/booking.service';
import StatusBadge from '../common/StatusBadge';
import RecurringBadge from './RecurringBadge';
import './BookingCard.css';

/**
 * Format a date range string like "20/06 09:00 – 10:30"
 */
function formatDateRange(startTime, endTime, locale) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const date = start.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  const startStr = start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const endStr = end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return `${date} • ${startStr} – ${endStr}`;
}

/**
 * Calculate human-readable duration.
 */
function formatDuration(startTime, endTime, t, language) {
  const diffMs = new Date(endTime) - new Date(startTime);
  const totalMins = Math.round(diffMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  
  const hLabel = 'h';
  const mLabel = language === 'en' ? 'm' : 'p';

  if (h > 0 && m > 0) return `${h}${hLabel} ${m}${mLabel}`;
  if (h > 0) return `${h} ${h > 1 ? t('common.hours') : t('common.hour')}`;
  return `${m} ${m > 1 ? t('common.minutes') : t('common.minute')}`;
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
function BookingCard({ booking, currentUser, onApprove, onReject, onCancel, onClick, onCheckInSuccess }) {
  const { t, i18n } = useTranslation();
  const { id, title, status, startTime, endTime, room, user, recurringId, recurring, checkedIn, checkInTime, cancelReason } = booking;

  const [now, setNow] = useState(new Date());
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (status !== 'approved' || checkedIn) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [status, checkedIn]);

  const isOwner = currentUser?.id === booking.userId;
  const isAdmin = currentUser?.role === 'admin';
  const isApprover = currentUser?.role === 'approver';

  const canApproveReject = (isAdmin || isApprover) && status === 'pending';
  const canCancel = (isOwner || isAdmin) && ['pending', 'approved'].includes(status);

  const startDt = new Date(startTime);
  const checkInStart = new Date(startDt.getTime() - 10 * 60 * 1000);
  const checkInEnd = new Date(startDt.getTime() + 15 * 60 * 1000);

  const showCheckIn = status === 'approved' && !checkedIn && now >= checkInStart && now <= checkInEnd;
  const secondsLeft = Math.max(0, Math.floor((checkInEnd.getTime() - now.getTime()) / 1000));

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCheckInClick = async (e) => {
    e.stopPropagation();
    setCheckingIn(true);
    try {
      const res = await bookingService.checkInBooking(id);
      toast.success(t('dashboard.checkInSuccess'));
      if (onCheckInSuccess) {
        onCheckInSuccess(id, res.data);
      } else {
        window.location.reload();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.checkInFailed'));
    } finally {
      setCheckingIn(false);
    }
  };

  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';

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
          <span className="booking-card__duration">{formatDuration(startTime, endTime, t, i18n.language)}</span>
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
            {formatDateRange(startTime, endTime, locale)}
          </span>
          <span className="booking-card__info-item">
            <span className="booking-card__icon">👤</span>
            {user?.fullName || user?.email}
          </span>
          {checkedIn && (
            <span className="booking-card__info-item" style={{ color: '#10b981', fontWeight: 600 }}>
              <span className="booking-card__icon">✅</span>
              {t('bookingDetail.checkedInAt', { time: new Date(checkInTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) })}
            </span>
          )}
          {status === 'cancelled' && cancelReason && (
            <span className="booking-card__info-item" style={{ color: '#f87171', fontSize: '0.85rem' }}>
              <span className="booking-card__icon">⚠️</span>
              {t('bookings.rejectionReason')}: {cancelReason}
            </span>
          )}
        </div>
      </div>

      {(canApproveReject || canCancel || showCheckIn) && (
        <div className="booking-card__actions" onClick={(e) => e.stopPropagation()}>
          {showCheckIn && (isOwner || isAdmin || isApprover) && (
            <button
              id={`checkin-btn-${id}`}
              className="btn-checkin"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', marginRight: 'auto' }}
              onClick={handleCheckInClick}
              disabled={checkingIn}
            >
              📍 Check-in ({formatCountdown(secondsLeft)})
            </button>
          )}
          {canApproveReject && (
            <>
              <button
                id={`approve-btn-${id}`}
                className="btn-action btn-approve"
                onClick={() => onApprove?.(id)}
              >
                ✓ {t('common.approve')}
              </button>
              <button
                id={`reject-btn-${id}`}
                className="btn-action btn-reject"
                onClick={() => onReject?.(id)}
              >
                ✗ {t('common.reject')}
              </button>
            </>
          )}
          {canCancel && (
            <button
              id={`cancel-btn-${id}`}
              className="btn-action btn-cancel"
              onClick={() => onCancel?.(id)}
            >
              {t('common.cancel')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BookingCard;
