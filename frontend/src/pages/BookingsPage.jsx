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
import './BookingsPage.css';

const LIMIT = 10;

/**
 * BookingsPage — lists all bookings with filter, pagination, approve/reject/cancel.
 */
function BookingsPage() {
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
      toast.error('Không thể tải danh sách booking');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await bookingService.approveBooking(id);
      toast.success('Đã duyệt booking!');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Duyệt thất bại');
    }
  };

  const handleRejectOpen = (id) => {
    setRejectModal({ open: true, bookingId: id });
  };

  const handleRejectConfirm = async (reason) => {
    setRejectLoading(true);
    try {
      await bookingService.rejectBooking(rejectModal.bookingId, reason);
      toast.success('Đã từ chối booking');
      setRejectModal({ open: false, bookingId: null });
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Từ chối thất bại');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy booking này?')) return;
    try {
      await bookingService.cancelBooking(id);
      toast.success('Đã hủy booking');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hủy thất bại');
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
      toast.success('Đã tải xuống file Excel thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xuất Excel thất bại');
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
          <h1 className="bookings-page__title">📋 Lịch đặt phòng</h1>
          <p className="bookings-page__subtitle">
            {pagination.total > 0
              ? `${pagination.total} booking được tìm thấy`
              : 'Quản lý lịch đặt phòng của bạn'}
          </p>
        </div>
        <div className="bookings-page__header-actions">
          {canExport && (
            <button
              id="export-bookings-btn"
              className="bookings-page__export-btn"
              onClick={handleExport}
              disabled={exportLoading}
              title="Xuất danh sách booking ra Excel"
            >
              {exportLoading ? (
                <span className="bookings-page__export-spinner" />
              ) : (
                '📥'
              )}
              {exportLoading ? 'Đang xuất...' : 'Export Excel'}
            </button>
          )}
          <button
            id="new-booking-btn"
            className="bookings-page__new-btn"
            onClick={() => navigate('/bookings/new')}
          >
            ➕ Đặt phòng mới
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
            <p>Đang tải...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bookings-page__empty">
            <div className="bookings-page__empty-icon">📭</div>
            <h3>Không có booking nào</h3>
            <p>Chưa có lịch đặt phòng phù hợp với bộ lọc hiện tại.</p>
            <button
              id="empty-new-booking-btn"
              className="bookings-page__new-btn"
              onClick={() => navigate('/bookings/new')}
            >
              ➕ Đặt phòng mới
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
