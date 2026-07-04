import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import bookingService from '../services/booking.service';
import StatusBadge from '../components/common/StatusBadge';
import RejectModal from '../components/bookings/RejectModal';
import CommentSection from '../components/bookings/CommentSection';
import SaveAsTemplate from '../components/templates/SaveAsTemplate';
import './BookingDetailPage.css';

/**
 * Format a full datetime string in Vietnamese locale.
 */
function formatFull(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date to dd/mm/yyyy.
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

/**
 * Format time range "09:00 – 10:30".
 */
function formatTimeRange(start, end) {
  const s = new Date(start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const e = new Date(end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const diffMs = new Date(end) - new Date(start);
  const totalMins = Math.round(diffMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const dur = h > 0 && m > 0 ? `${h}h${m}p` : h > 0 ? `${h} giờ` : `${m} phút`;
  return `${s} – ${e} (${dur})`;
}

/**
 * BookingDetailPage — full detail view of a single booking.
 */
function BookingDetailPage() {
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
        toast.error(err.response?.data?.message || 'Không thể tải thông tin booking');
        navigate('/bookings');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="detail-page detail-page--loading">
        <div className="spinner" />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!booking) return null;

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
    return `${m} phút ${s} giây`;
  };

  // Actions
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await bookingService.approveBooking(id);
      setBooking(res.data);
      toast.success('Đã duyệt booking!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Duyệt thất bại');
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
      toast.success('Đã từ chối booking');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Từ chối thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy booking này?')) return;
    setActionLoading(true);
    try {
      const res = await bookingService.cancelBooking(id);
      setBooking(res.data);
      toast.success('Đã hủy booking');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hủy thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await bookingService.checkInBooking(id);
      setBooking(res.data);
      toast.success('Check-in thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in thất bại');
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
        ← Quay lại
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
              <span className="detail-page__info-label">Phòng</span>
              <span className="detail-page__info-value">
                {booking.room?.name}
                {booking.room?.location ? ` — ${booking.room.location}` : ''}
              </span>
            </div>
          </div>

          <div className="detail-page__info-row">
            <span className="detail-page__info-icon">👤</span>
            <div>
              <span className="detail-page__info-label">Người đặt</span>
              <span className="detail-page__info-value">
                {booking.user?.fullName || booking.user?.email}
              </span>
            </div>
          </div>

          <div className="detail-page__info-row">
            <span className="detail-page__info-icon">📅</span>
            <div>
              <span className="detail-page__info-label">Ngày</span>
              <span className="detail-page__info-value">{formatDate(booking.startTime)}</span>
            </div>
          </div>

          <div className="detail-page__info-row">
            <span className="detail-page__info-icon">🕐</span>
            <div>
              <span className="detail-page__info-label">Thời gian</span>
              <span className="detail-page__info-value">
                {formatTimeRange(booking.startTime, booking.endTime)}
              </span>
            </div>
          </div>

          <div className="detail-page__info-row">
            <span className="detail-page__info-icon">📝</span>
            <div>
              <span className="detail-page__info-label">Tạo lúc</span>
              <span className="detail-page__info-value">{formatFull(booking.createdAt)}</span>
            </div>
          </div>

          {/* Room capacity & equipment */}
          {booking.room?.capacity && (
            <div className="detail-page__info-row">
              <span className="detail-page__info-icon">👥</span>
              <div>
                <span className="detail-page__info-label">Sức chứa</span>
                <span className="detail-page__info-value">{booking.room.capacity} người</span>
              </div>
            </div>
          )}

          {booking.room?.equipment?.length > 0 && (
            <div className="detail-page__info-row">
              <span className="detail-page__info-icon">🖥️</span>
              <div>
                <span className="detail-page__info-label">Thiết bị</span>
                <div className="detail-page__tags">
                  {booking.room.equipment.map((eq) => (
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
                <span className="detail-page__info-label" style={{ color: '#ef4444', fontWeight: 600 }}>Lý do hủy</span>
                <p className="detail-page__rejection-reason" style={{ margin: '4px 0 0', color: 'var(--color-text-primary)' }}>{booking.cancelReason}</p>
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
                  <span>✅ Đã check-in lúc {formatFull(booking.checkInTime)}</span>
                </div>
              ) : showCheckIn ? (
                <div className="checkin-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>📍 Cuộc họp đã sẵn sàng check-in</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        Vui lòng bấm nút check-in bên phải để xác nhận cuộc họp của bạn.
                      </p>
                      <p className="checkin-countdown">
                        ⏱️ Tự động hủy sau: {formatCountdown(secondsLeft)}
                      </p>
                    </div>
                    {(isOwner || isAdmin || isApprover) && (
                      <button
                        id="checkin-btn"
                        className="btn-checkin"
                        onClick={handleCheckIn}
                        disabled={actionLoading}
                      >
                        📍 Check-in ngay
                      </button>
                    )}
                  </div>
                </div>
              ) : isExpired ? (
                <div style={{ color: '#ef4444', fontWeight: 600 }}>
                  ⚠️ Quá hạn check-in (Lịch đặt đang chờ hệ thống hủy giải phóng)
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  ⏳ Có thể check-in trước giờ họp 10 phút (Hạn chót là 15 phút sau giờ họp).
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
                    <span className="detail-page__info-label">Lý do từ chối</span>
                    <p className="detail-page__rejection-reason">{booking.rejectionReason}</p>
                  </div>
                </div>
              )}
              <div className="detail-page__info-row">
                <span className="detail-page__info-icon">👤</span>
                <div>
                  <span className="detail-page__info-label">
                    {booking.status === 'rejected' ? 'Người từ chối' : 'Người duyệt'}
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
                      {booking.status === 'rejected' ? 'Từ chối lúc' : 'Duyệt lúc'}
                    </span>
                    <span className="detail-page__info-value">{formatFull(booking.approvedAt)}</span>
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
                  ✓ Duyệt
                </button>
                <button
                  id="detail-reject-btn"
                  className="detail-page__action-btn detail-page__action-btn--reject"
                  onClick={() => setRejectModal(true)}
                  disabled={actionLoading}
                >
                  ✗ Từ chối
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
                {actionLoading ? 'Đang xử lý...' : 'Hủy booking'}
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
