import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import BookingForm from '../components/bookings/BookingForm';
import RecurringForm from '../components/bookings/RecurringForm';
import SlotPreview from '../components/bookings/SlotPreview';
import SmartSuggestions from '../components/bookings/SmartSuggestions';
import bookingService from '../services/booking.service';
import templateService from '../services/template.service';
import './BookingCreatePage.css';

/**
 * BookingCreatePage — allows creating either a single booking or a recurring series.
 * Toggle between "Đặt 1 lần" and "Đặt định kỳ" modes.
 */
function BookingCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read pre-filled values from URL query params (set by RoomSearchPage or TemplatesPage)
  const initialValues = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const startHHMM = params.get('startHHMM') || '';
    const endHHMM = params.get('endHHMM') || '';
    return {
      roomId:    params.get('roomId')    || '',
      startTime: params.get('startTime') || '',
      endTime:   params.get('endTime')   || '',
      title:     params.get('title')     || '',
      // Time-of-day HH:mm from template pre-fill (used by BookingForm if startTime empty)
      startHHMM,
      endHHMM,
    };
  }, [location.search]);

  // ── Templates (for pre-fill section) ─────────────────────────────────────
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    setTemplatesLoading(true);
    templateService.getTemplates()
      .then((res) => setTemplates(res.data || []))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, []);

  // Navigate with template pre-fill
  const handleUseTemplate = useCallback((tpl) => {
    const params = new URLSearchParams();
    if (tpl.roomId) params.set('roomId', tpl.roomId);
    if (tpl.title) params.set('title', tpl.title);
    if (tpl.startTime) {
      const d = new Date(tpl.startTime);
      params.set('startHHMM', `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    }
    if (tpl.endTime) {
      const d = new Date(tpl.endTime);
      params.set('endHHMM', `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    }
    navigate(`/bookings/new?${params.toString()}`);
  }, [navigate]);

  // ── Single booking state ──────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);

  // ── Mode toggle ───────────────────────────────────────────────────────────
  const [mode, setMode] = useState('single'); // 'single' | 'recurring'

  // ── Recurring form state ──────────────────────────────────────────────────
  const [recurringForm, setRecurringForm] = useState({
    roomId: '',
    title: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    frequency: 'weekly',
  });
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [previewResult, setPreviewResult] = useState(null); // { okSlots, conflictSlots, totalGenerated }

  // ── Handlers: single booking ──────────────────────────────────────────────
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

  // ── Handlers: recurring ───────────────────────────────────────────────────
  const handleRecurringChange = (field, value) => {
    setRecurringForm((prev) => ({ ...prev, [field]: value }));
    // Reset preview when form changes
    setPreviewResult(null);
  };

  const handlePreview = async () => {
    // Validate required fields
    const { roomId, title, startDate, endDate, startTime, endTime, frequency } = recurringForm;
    if (!roomId || !title || !startDate || !endDate || !startTime || !endTime || !frequency) {
      toast.error('Vui lòng điền đầy đủ thông tin trước khi xem trước.');
      return;
    }

    setIsPreviewing(true);
    setPreviewResult(null);
    try {
      const result = await bookingService.previewRecurring(recurringForm);
      setPreviewResult(result.data);
      if (result.data.totalGenerated === 0) {
        toast.error('Không có slots nào được tạo. Kiểm tra lại ngày và giờ.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xem trước slots.';
      toast.error(msg);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmRecurring = async () => {
    if (!previewResult || previewResult.okSlots.length === 0) return;

    setIsConfirming(true);
    try {
      const result = await bookingService.createRecurring({
        ...recurringForm,
        confirmedSlots: previewResult.okSlots,
      });
      toast.success(
        `Đặt định kỳ thành công! ${result.data.bookings.length} booking đã được tạo.`
      );
      navigate('/bookings');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đặt định kỳ thất bại. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="create-page">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
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

      {/* ── Mode Toggle ─────────────────────────────────────────────────────── */}
      <div className="create-page__mode-toggle" role="group" aria-label="Chọn loại đặt phòng">
        <button
          id="mode-single-btn"
          type="button"
          role="radio"
          aria-checked={mode === 'single'}
          className={`create-page__mode-btn ${mode === 'single' ? 'create-page__mode-btn--active' : ''}`}
          onClick={() => setMode('single')}
        >
          📌 Đặt 1 lần
        </button>
        <button
          id="mode-recurring-btn"
          type="button"
          role="radio"
          aria-checked={mode === 'recurring'}
          className={`create-page__mode-btn ${mode === 'recurring' ? 'create-page__mode-btn--active' : ''}`}
          onClick={() => setMode('recurring')}
        >
          🔄 Đặt định kỳ
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="create-page__content">
        {mode === 'single' ? (
          /* Single booking form */
          <>
            {/* ── Template Section ──────────────────────────────────────── */}
            {templates.length > 0 && (
              <div className="create-page__templates">
                <div className="create-page__templates-header">
                  <span className="create-page__templates-icon">📋</span>
                  <span className="create-page__templates-label">Đặt từ mẫu</span>
                  <button
                    id="go-to-templates-btn"
                    className="create-page__templates-link"
                    onClick={() => navigate('/templates')}
                  >
                    Quản lý →
                  </button>
                </div>
                <div className="create-page__templates-scroll">
                  {templates.map((tpl) => {
                    const startStr = tpl.startTime
                      ? new Date(tpl.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
                      : '';
                    const endStr = tpl.endTime
                      ? new Date(tpl.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
                      : '';
                    return (
                      <button
                        key={tpl.id}
                        id={`quick-tpl-${tpl.id}`}
                        className="create-page__tpl-chip"
                        onClick={() => handleUseTemplate(tpl)}
                        title={`${tpl.title} • ${startStr}–${endStr}`}
                      >
                        <span className="create-page__tpl-chip-icon">🔖</span>
                        <span className="create-page__tpl-chip-name">{tpl.name}</span>
                        {tpl.room && (
                          <span className="create-page__tpl-chip-room">{tpl.room.name}</span>
                        )}
                        {startStr && (
                          <span className="create-page__tpl-chip-time">{startStr}–{endStr}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <SmartSuggestions
              onSelect={(s) => {
                // Navigate with pre-filled params from suggestion
                const params = new URLSearchParams({
                  roomId:    s.room.id,
                  startTime: s.startTime,
                  endTime:   s.endTime,
                });
                navigate(`/bookings/new?${params.toString()}`);
              }}
            />
            <BookingForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              conflicts={conflicts}
              onClearConflicts={() => setConflicts([])}
              initialValues={initialValues}
            />
          </>
        ) : (
          /* Recurring booking flow */
          <div className="create-page__recurring">
            {/* Recurring: title + room — reuse a simple input block */}
            <div className="create-page__recurring-meta">
              <div className="create-page__recurring-field">
                <label htmlFor="recurring-title" className="create-page__recurring-label">
                  Tiêu đề cuộc họp
                </label>
                <input
                  id="recurring-title"
                  type="text"
                  className="create-page__recurring-input"
                  placeholder="Họp nhóm tuần..."
                  value={recurringForm.title}
                  onChange={(e) => handleRecurringChange('title', e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="create-page__recurring-field">
                <label htmlFor="recurring-room-id" className="create-page__recurring-label">
                  ID Phòng họp
                </label>
                <input
                  id="recurring-room-id"
                  type="text"
                  className="create-page__recurring-input"
                  placeholder="UUID phòng họp..."
                  value={recurringForm.roomId}
                  onChange={(e) => handleRecurringChange('roomId', e.target.value)}
                />
              </div>
            </div>

            {/* Recurring form: dates + times + frequency */}
            <RecurringForm
              values={recurringForm}
              onChange={handleRecurringChange}
              onPreview={handlePreview}
              isLoading={isPreviewing}
            />

            {/* Slot preview result */}
            {previewResult && (
              <SlotPreview
                okSlots={previewResult.okSlots}
                conflictSlots={previewResult.conflictSlots}
                totalGenerated={previewResult.totalGenerated}
                onConfirm={handleConfirmRecurring}
                isConfirming={isConfirming}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingCreatePage;
