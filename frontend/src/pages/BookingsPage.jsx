import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import bookingService from '../services/booking.service';
import roomService from '../services/room.service';
import exportService from '../services/export.service';
import BookingCard from '../components/bookings/BookingCard';
import BookingFilter from '../components/bookings/BookingFilter';
import RejectModal from '../components/bookings/RejectModal';
import { useTranslation } from 'react-i18next';
import './BookingsPage.css';

const LIMIT = 10;

/**
 * BookingsPage — lists all bookings with filter, pagination, approve/reject/cancel.
 */
function BookingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── State ────────────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);

  const [filters, setFilters] = useState({
    roomId: '', status: '', startDate: '', endDate: '', page: 1,
  });

  // Export
  const [exportLoading, setExportLoading] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState({ open: false, bookingId: null });
  const [rejectLoading, setRejectLoading] = useState(false);

  // ── Load rooms for filter dropdown ───────────────────────────────────────
  useEffect(() => {
    roomService.getRooms({ limit: 100 }).then((res) => {
      setRooms(res.data || []);
    }).catch(() => {});
  }, []);

  // ── Fetch bookings ────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, ...filters };
      // Remove empty strings
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] === null) delete params[k];
      });
      const res = await bookingService.getBookings(params);
      setBookings(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch {
      toast.error(t('bookings.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await bookingService.approveBooking(id);
      toast.success(t('bookings.approveSuccess'));
      fetchBookings();
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    }
  };

  const handleRejectOpen = (id) => {
    setRejectModal({ open: true, bookingId: id });
  };

  const handleRejectConfirm = async (reason) => {
    setRejectLoading(true);
    try {
      await bookingService.rejectBooking(rejectModal.bookingId, reason);
      toast.success(t('bookings.rejectSuccess'));
      setRejectModal({ open: false, bookingId: null });
      fetchBookings();
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    } finally {
      setRejectLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(t('bookings.cancelConfirm'))) return;
    try {
      await bookingService.cancelBooking(id);
      toast.success(t('bookings.cancelSuccess'));
      fetchBookings();
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters({ roomId: '', status: '', startDate: '', endDate: '', page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters((f) => ({ ...f, page: newPage }));
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Pass the current filters (exclude page/limit — we want ALL matching bookings)
      const exportFilters = {
        roomId:    filters.roomId    || undefined,
        status:    filters.status    || undefined,
        startDate: filters.startDate || undefined,
        endDate:   filters.endDate   || undefined,
      };
      await exportService.exportBookings(exportFilters);
      toast.success(t('bookings.exportSuccess'));
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    } finally {
      setExportLoading(false);
    }
  };

  const canExport = user && (user.role === 'admin' || user.role === 'approver');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bookings-page">
      {/* Header */}
      <div className="bookings-page__header">
        <div className="bookings-page__title-area">
          <h1 className="bookings-page__title">📋 {t('bookings.title')}</h1>
          <p className="bookings-page__subtitle">
            {pagination.total > 0
              ? t('bookings.countFound', { count: pagination.total })
              : t('bookings.manageTitle')}
          </p>
        </div>
        <div className="bookings-page__header-actions">
          {canExport && (
            <button
              id="export-bookings-btn"
              className="bookings-page__export-btn"
              onClick={handleExport}
              disabled={exportLoading}
              title={t('bookings.exportTooltip')}
            >
              {exportLoading ? (
                <span className="bookings-page__export-spinner" />
              ) : (
                '📥'
              )}
              {exportLoading ? t('bookings.exporting') : t('bookings.exportExcel')}
            </button>
          )}
          <button
            id="new-booking-btn"
            className="bookings-page__new-btn"
            onClick={() => navigate('/bookings/new')}
          >
            ➕ {t('sidebar.newBooking')}
          </button>
        </div>
      </div>

      {/* Filter */}
      <BookingFilter
        rooms={rooms}
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* Booking list */}
      <div className="bookings-page__content">
        {loading ? (
          <div className="bookings-page__loading">
            <div className="spinner" />
            <p>{t('common.loading')}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bookings-page__empty">
            <div className="bookings-page__empty-icon">📭</div>
            <h3>{t('bookings.noBookings')}</h3>
            <p>{t('bookings.noBookingsDesc')}</p>
            <button
              id="empty-new-booking-btn"
              className="bookings-page__new-btn"
              onClick={() => navigate('/bookings/new')}
            >
              ➕ {t('sidebar.newBooking')}
            </button>
          </div>
        ) : (
          <div className="bookings-page__list">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                currentUser={user}
                onApprove={handleApprove}
                onReject={handleRejectOpen}
                onCancel={handleCancel}
                onCheckInSuccess={fetchBookings}
                onClick={(id) => navigate(`/bookings/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="bookings-page__pagination">
          <button
            id="prev-page-btn"
            className="pagination-btn"
            disabled={filters.page <= 1}
            onClick={() => handlePageChange(filters.page - 1)}
          >
            ◀
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              id={`page-btn-${p}`}
              className={`pagination-btn ${filters.page === p ? 'active' : ''}`}
              onClick={() => handlePageChange(p)}
            >
              {p}
            </button>
          ))}

          <button
            id="next-page-btn"
            className="pagination-btn"
            disabled={filters.page >= pagination.totalPages}
            onClick={() => handlePageChange(filters.page + 1)}
          >
            ▶
          </button>
        </div>
      )}

      {/* Reject modal */}
      <RejectModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, bookingId: null })}
        onConfirm={handleRejectConfirm}
        isLoading={rejectLoading}
      />
    </div>
  );
}

export default BookingsPage;
