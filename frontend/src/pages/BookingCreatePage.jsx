import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BookingForm from '../components/bookings/BookingForm';
import bookingService from '../services/booking.service';
import './BookingCreatePage.css';

/**
 * BookingCreatePage — wizard-style page to create a new booking.
 */
function BookingCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);

  const handleSubmit = async (data) => {
    setIsLoading(true);
    setConflicts([]);
    try {
      await bookingService.createBooking(data);
      toast.success('Đặt phòng thành công! Đang chờ duyệt.');
      navigate('/bookings');
    } catch (err) {
      if (err.response?.status === 409) {
        setConflicts(err.response.data.conflicts || []);
        toast.error('Thời gian bị trùng! Vui lòng chọn thời gian khác.');
      } else {
        const msg = err.response?.data?.message || 'Đặt phòng thất bại. Vui lòng thử lại.';
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-page">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="create-page__header">
        <button
          id="back-to-bookings-btn"
          className="create-page__back"
          onClick={() => navigate('/bookings')}
        >
          ← Quay lại
        </button>
        <div className="create-page__title-area">
          <h1 className="create-page__title">➕ Đặt phòng họp</h1>
          <p className="create-page__subtitle">
            Chọn thời gian, phòng trống và điền thông tin để đặt phòng
          </p>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <div className="create-page__content">
        <BookingForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          conflicts={conflicts}
          onClearConflicts={() => setConflicts([])}
        />
      </div>
    </div>
  );
}

export default BookingCreatePage;
