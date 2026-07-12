import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import BookingForm from '../components/bookings/BookingForm';
import RecurringForm from '../components/bookings/RecurringForm';
import SlotPreview from '../components/bookings/SlotPreview';
import SmartSuggestions from '../components/bookings/SmartSuggestions';
import bookingService from '../services/booking.service';
import templateService from '../services/template.service';
import { useTranslation } from 'react-i18next';
import './BookingCreatePage.css';

/**
 * BookingCreatePage — allows creating either a single booking or a recurring series.
 * Toggle between "Đặt 1 lần" and "Đặt định kỳ" modes.
 */
function BookingCreatePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';

  // Read pre-filled values from URL query params (set by RoomSearchPage or TemplatesPage)
  const initialValues = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const startHHMM = params.get('startHHMM') || '';
    const endHHMM = params.get('endHHMM') || '';
    return {
      roomId:       params.get('roomId')       || '',
      startTime:    params.get('startTime')    || '',
      endTime:      params.get('endTime')      || '',
      title:        params.get('title')        || '',
      templateName: params.get('templateName') || '',
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
    if (tpl.name) params.set('templateName', tpl.name);
    // Must use getUTCHours/getUTCMinutes because Prisma @db.Time() stores as 1970-01-01THH:MM:00Z
    if (tpl.startTime) {
      const d = new Date(tpl.startTime);
      params.set('startHHMM', `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`);
    }
    if (tpl.endTime) {
      const d = new Date(tpl.endTime);
      params.set('endHHMM', `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`);
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
      toast.success(t('bookings.createSuccessPending'));
      navigate('/bookings');
    } catch (err) {
      if (err.response?.status === 409) {
        setConflicts(err.response.data.conflicts || []);
        toast.error(t('bookings.timeConflict'));
      } else {
        const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
        toast.error(t(`errors.${errorCode}`));
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
      toast.error(t('bookings.fillAllRequired'));
      return;
    }

    setIsPreviewing(true);
    setPreviewResult(null);
    try {
      const result = await bookingService.previewRecurring(recurringForm);
      setPreviewResult(result.data);
      if (result.data.totalGenerated === 0) {
        toast.error(t('bookings.noSlotsCreated'));
      }
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
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
      toast.success(t('bookings.recurringSuccess', { count: result.data.bookings.length }));
      navigate('/bookings');
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
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
          ← {t('bookings.back')}
        </button>
        <div className="create-page__title-area">
          <h1 className="create-page__title">➕ {t('bookings.createTitle')}</h1>
          <p className="create-page__subtitle">
            {t('bookings.createSubtitle')}
          </p>
        </div>
      </div>

      {/* ── Mode Toggle ─────────────────────────────────────────────────────── */}
      <div className="create-page__mode-toggle" role="group" aria-label={t('bookings.createTitle')}>
        <button
          id="mode-single-btn"
          type="button"
          role="radio"
          aria-checked={mode === 'single'}
          className={`create-page__mode-btn ${mode === 'single' ? 'create-page__mode-btn--active' : ''}`}
          onClick={() => setMode('single')}
        >
          📌 {t('bookings.singleBooking')}
        </button>
        <button
          id="mode-recurring-btn"
          type="button"
          role="radio"
          aria-checked={mode === 'recurring'}
          className={`create-page__mode-btn ${mode === 'recurring' ? 'create-page__mode-btn--active' : ''}`}
          onClick={() => setMode('recurring')}
        >
          🔄 {t('bookings.recurringBooking')}
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
                  <span className="create-page__templates-label">{t('bookings.bookFromTemplate')}</span>
                  <button
                    id="go-to-templates-btn"
                    className="create-page__templates-link"
                    onClick={() => navigate('/templates')}
                  >
                    {t('bookings.manage')}
                  </button>
                </div>
                <div className="create-page__templates-scroll">
                  {templates.map((tpl) => {
                    const toHHMM = (t) => {
                      if (!t) return '';
                      const d = new Date(t);
                      return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
                    };
                    const startStr = toHHMM(tpl.startTime);
                    const endStr = toHHMM(tpl.endTime);
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
                  {t('bookings.meetingTitle')}
                </label>
                <input
                  id="recurring-title"
                  type="text"
                  className="create-page__recurring-input"
                  placeholder={t('bookings.meetingTitle') + '...'}
                  value={recurringForm.title}
                  onChange={(e) => handleRecurringChange('title', e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="create-page__recurring-field">
                <label htmlFor="recurring-room-id" className="create-page__recurring-label">
                  {t('rooms.name')} / ID
                </label>
                <input
                  id="recurring-room-id"
                  type="text"
                  className="create-page__recurring-input"
                  placeholder={t('bookings.uuidPlaceholder')}
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
