import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import bookingService from '../services/booking.service';
import StatusBadge from '../components/common/StatusBadge';
import RejectModal from '../components/bookings/RejectModal';
import CommentSection from '../components/bookings/CommentSection';
import SaveAsTemplate from '../components/templates/SaveAsTemplate';
import { useTranslation } from 'react-i18next';
import { translateRoom } from '../utils/roomTranslate';
import './BookingDetailPage.css';

/**
 * Format a full datetime string in active locale.
 */
function formatFull(dateStr, lng) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(lng === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date to locale format.
 */
function formatDate(dateStr, lng) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(lng === 'vi' ? 'vi-VN' : 'en-US');
}

/**
 * Format time range.
 */
function formatTimeRange(start, end, t, lng) {
  const s = new Date(start).toLocaleTimeString(lng === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const e = new Date(end).toLocaleTimeString(lng === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const diffMs = new Date(end) - new Date(start);
  const totalMins = Math.round(diffMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  let dur = '';
  if (h > 0 && m > 0) {
    dur = t('bookingDetail.durationHourMin', { h, m });
  } else if (h > 0) {
    dur = t('bookingDetail.durationHour', { h, count: h });
  } else {
    dur = t('bookingDetail.durationMin', { m, count: m });
  }
  return `${s} – ${e} (${dur})`;
}

/**
 * Translate database cancellation or rejection reasons.
 */
function translateReason(reason, t) {
  if (!reason) return reason;
  const normalized = reason.trim().toLowerCase();
  if (normalized.includes('tự động hủy do quá giờ check-in') || normalized.includes('auto-released') || normalized.includes('no-show')) {
    return t('bookingDetail.cancelReasonAuto');
  }
  if (normalized === 'phòng đã được đặt trước.' || normalized === 'phong da duoc dat truoc.') {
    return t('bookingDetail.rejectionReasonSeed');
  }
  return reason;
}

/**
 * BookingDetailPage — full detail view of a single booking.
 */
function BookingDetailPage() {
  const { t, i18n } = useTranslation();
  const lng = i18n.language || 'vi';
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [now, setNow] = useState(new Date());

  // Countdown timer effect
  useEffect(() => {
    if (booking?.status !== 'approved' || booking?.checkedIn) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  // Load booking
  useEffect(() => {
    setLoading(true);
    bookingService.getBooking(id)
      .then((res) => setBooking(res.data))
      .catch((err) => {
        toast.error(t('bookingDetail.loadFailed'));
        navigate('/bookings');
      })
      .finally(() => setLoading(false));
  }, [id, navigate, t]);

  if (loading) {
    return (
      <div className="detail-page detail-page--loading">
        <div className="spinner" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!booking) return null;

  const room = translateRoom(booking.room, t);

  // Permissions
  const isOwner = user?.id === booking.userId;
  const isAdmin = user?.role === 'admin';
  const isApprover = user?.role === 'approver';

  const canApproveReject = (isAdmin || isApprover) && booking.status === 'pending';
  const canCancel = (isOwner || isAdmin) && ['pending', 'approved'].includes(booking.status);

  const startTime = new Date(booking.startTime);
  const checkInStart = new Date(startTime.getTime() - 10 * 60 * 1000);
  const checkInEnd = new Date(startTime.getTime() + 15 * 60 * 1000);

  const showCheckIn = booking.status === 'approved' && !booking.checkedIn && now >= checkInStart && now <= checkInEnd;
  const isExpired = booking.status === 'approved' && !booking.checkedIn && now > checkInEnd;
  const secondsLeft = Math.max(0, Math.floor((checkInEnd.getTime() - now.getTime()) / 1000));

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} ${t('bookingDetail.minutes')} ${s} ${t('bookingDetail.seconds')}`;
  };

  // Actions
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await bookingService.approveBooking(id);
      setBooking(res.data);
      toast.success(t('bookingDetail.approveSuccess'));
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    setActionLoading(true);
    try {
      const res = await bookingService.rejectBooking(id, reason);
      setBooking(res.data);
      setRejectModal(false);
      toast.success(t('bookingDetail.rejectSuccess'));
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(t('bookings.cancelConfirm'))) return;
    setActionLoading(true);
    try {
      const res = await bookingService.cancelBooking(id);
      setBooking(res.data);
      toast.success(t('bookings.cancelSuccess'));
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await bookingService.checkInBooking(id);
      setBooking(res.data);
      toast.success(t('bookingDetail.checkInSuccess'));
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="detail-page">
      {/* Back */}
      <button
        id="back-btn"
        className="detail-page__back"
        onClick={() => navigate('/bookings')}
      >
        ← {t('bookings.back')}
      </button>

      {/* Card */}
      <div className="detail-page__card">
        {/* Status + Title */}
        <div className="detail-page__hero">
          <StatusBadge status={booking.status} />
          <h1 className="detail-page__title">{booking.title}</h1>
        </div>

        {/* Info rows */}
        <div className="detail-page__info-grid">
          <div className="detail-page__info-row">
            <span className="detail-page__info-icon">📍</span>
            <div>
              <span className="detail-page__info-label">{t('bookingDetail.room')}</span>
              <span className="detail-page__info-value">
                {room?.name}
                {room?.location ? ` — ${room.location}` : ''}
              </span>
            </div>
          </div>

          <div className="detail-page__info-row">
            <span className="detail-page__info-icon">👤</span>
            <div>
              <span className="detail-page__info-label">{t('bookingDetail.bookedBy')}</span>
              <span className="detail-page__info-value">
                {booking.user?.fullName || booking.user?.email}
              </span>
            </div>
          </div>

          <div className="detail-page__info-row">
            <span className="detail-page__info-icon">📅</span>
            <div>
              <span className="detail-page__info-label">{t('bookingDetail.date')}</span>
              <span className="detail-page__info-value">{formatDate(booking.startTime, lng)}</span>
            </div>
          </div>

          <div className="detail-page__info-row">
            <span className="detail-page__info-icon">🕐</span>
            <div>
              <span className="detail-page__info-label">{t('bookingDetail.time')}</span>
              <span className="detail-page__info-value">
                {formatTimeRange(booking.startTime, booking.endTime, t, lng)}
              </span>
            </div>
          </div>

          <div className="detail-page__info-row">
            <span className="detail-page__info-icon">📝</span>
            <div>
              <span className="detail-page__info-label">{t('bookingDetail.createdAt')}</span>
              <span className="detail-page__info-value">{formatFull(booking.createdAt, lng)}</span>
            </div>
          </div>

          {/* Room capacity & equipment */}
          {room?.capacity && (
            <div className="detail-page__info-row">
              <span className="detail-page__info-icon">👥</span>
              <div>
                <span className="detail-page__info-label">{t('bookingDetail.capacity')}</span>
                <span className="detail-page__info-value">{t('bookingDetail.people', { count: room.capacity })}</span>
              </div>
            </div>
          )}

          {room?.equipment?.length > 0 && (
            <div className="detail-page__info-row">
              <span className="detail-page__info-icon">🖥️</span>
              <div>
                <span className="detail-page__info-label">{t('bookingDetail.equipment')}</span>
                <div className="detail-page__tags">
                  {room.equipment.map((eq) => (
                    <span key={eq} className="detail-page__tag">{eq}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cancellation Reason (No-Show or Admin Cancelled) */}
        {booking.status === 'cancelled' && booking.cancelReason && (
          <div className="detail-page__rejection-section">
            <div className="detail-page__divider" />
            <div className="detail-page__rejection" style={{ borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)', padding: '16px', borderRadius: '8px', margin: '16px 0' }}>
              <span className="detail-page__rejection-icon" style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <span className="detail-page__info-label" style={{ color: '#ef4444', fontWeight: 600 }}>{t('bookingDetail.cancelReason')}</span>
                <p className="detail-page__rejection-reason" style={{ margin: '4px 0 0', color: 'var(--color-text-primary)' }}>{translateReason(booking.cancelReason, t)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Check-in Section */}
        {booking.status === 'approved' && (
          <div className="detail-page__checkin-section">
            <div className="detail-page__divider" />
            <div style={{ padding: '12px 0' }}>
              {booking.checkedIn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
                  <span>✅ {t('bookingDetail.checkedInAt', { time: formatFull(booking.checkInTime, lng) })}</span>
                </div>
              ) : showCheckIn ? (
                <div className="checkin-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>📍 {t('bookingDetail.readyToCheckIn')}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {t('bookingDetail.checkInInstruction')}
                      </p>
                      <p className="checkin-countdown">
                        ⏱️ {t('bookingDetail.autoCancelAfter', { countdown: formatCountdown(secondsLeft) })}
                      </p>
                    </div>
                    {(isOwner || isAdmin || isApprover) && (
                      <button
                        id="checkin-btn"
                        className="btn-checkin"
                        onClick={handleCheckIn}
                        disabled={actionLoading}
                      >
                        📍 {t('bookingDetail.checkInNow')}
                      </button>
                    )}
                  </div>
                </div>
              ) : isExpired ? (
                <div style={{ color: '#ef4444', fontWeight: 600 }}>
                  ⚠️ {t('bookingDetail.checkInExpired')}
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  ⏳ {t('bookingDetail.checkInNotice')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approver section (rejected/approved) */}
        {booking.approver && (
          <div className="detail-page__approver-section">
            <div className="detail-page__divider" />
            <div className="detail-page__approver-grid">
              {booking.status === 'rejected' && booking.rejectionReason && (
                <div className="detail-page__rejection">
                  <span className="detail-page__rejection-icon">❌</span>
                  <div>
                    <span className="detail-page__info-label">{t('bookingDetail.rejectionReason')}</span>
                    <p className="detail-page__rejection-reason">{translateReason(booking.rejectionReason, t)}</p>
                  </div>
                </div>
              )}
              <div className="detail-page__info-row">
                <span className="detail-page__info-icon">👤</span>
                <div>
                  <span className="detail-page__info-label">
                    {booking.status === 'rejected' ? t('bookingDetail.rejectedBy') : t('bookingDetail.approvedBy')}
                  </span>
                  <span className="detail-page__info-value">
                    {booking.approver?.fullName || booking.approver?.email}
                  </span>
                </div>
              </div>
              {booking.approvedAt && (
                <div className="detail-page__info-row">
                  <span className="detail-page__info-icon">📅</span>
                  <div>
                    <span className="detail-page__info-label">
                      {booking.status === 'rejected' ? t('bookingDetail.rejectedAt') : t('bookingDetail.approvedAt')}
                    </span>
                    <span className="detail-page__info-value">{formatFull(booking.approvedAt, lng)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {(canApproveReject || canCancel) && (
          <div className="detail-page__actions">
            {canApproveReject && (
              <>
                <button
                  id="detail-approve-btn"
                  className="detail-page__action-btn detail-page__action-btn--approve"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  {t('bookingDetail.approveBtn')}
                </button>
                <button
                  id="detail-reject-btn"
                  className="detail-page__action-btn detail-page__action-btn--reject"
                  onClick={() => setRejectModal(true)}
                  disabled={actionLoading}
                >
                  {t('bookingDetail.rejectBtn')}
                </button>
              </>
            )}
            {canCancel && (
              <button
                id="detail-cancel-btn"
                className="detail-page__action-btn detail-page__action-btn--cancel"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                {actionLoading ? t('bookingDetail.processing') : t('bookingDetail.cancelBtn')}
              </button>
            )}
            {/* Save as template — shown for approved bookings owned by user */}
            {isOwner && booking.status === 'approved' && (
              <SaveAsTemplate booking={booking} />
            )}
          </div>
        )}
      </div>

      {/* Comment section */}
      <CommentSection bookingId={id} />

      {/* Reject Modal */}
      <RejectModal
        isOpen={rejectModal}
        onClose={() => setRejectModal(false)}
        onConfirm={handleRejectConfirm}
        isLoading={actionLoading}
      />
    </div>
  );
}

export default BookingDetailPage;
