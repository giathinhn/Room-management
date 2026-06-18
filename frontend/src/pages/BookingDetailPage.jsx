import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import bookingService from '../services/booking.service';
import StatusBadge from '../components/common/StatusBadge';
import RejectModal from '../components/bookings/RejectModal';
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
          </div>
        )}
      </div>

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
