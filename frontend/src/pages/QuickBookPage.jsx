import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import roomService from '../services/room.service';
import bookingService from '../services/booking.service';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import toast from 'react-hot-toast';
import { FiClock, FiUsers, FiLayers, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import './QuickBookPage.css';

function QuickBookPage() {
  const { t } = useTranslation();
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(30); // minutes

  // Room Status State
  const [roomState, setRoomState] = useState('available'); // 'available', 'busy', 'soon-busy'
  const [currentBooking, setCurrentBooking] = useState(null);
  const [nextBooking, setNextBooking] = useState(null);
  const [timeUntilNext, setTimeUntilNext] = useState(null); // minutes
  const [countdownText, setCountdownText] = useState('');

  const timerRef = useRef(null);

  // Load room and bookings
  const loadData = async () => {
    try {
      const roomRes = await roomService.getRoom(roomId);
      setRoom(roomRes.data);

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

      const events = await bookingService.getCalendarEvents({
        roomId,
        start: startOfDay,
        end: endOfDay,
      });

      // Filter events to exclude rejected and cancelled
      const activeEvents = (events.data || []).filter(
        (e) => e.status !== 'rejected' && e.status !== 'cancelled'
      );
      setTodayBookings(activeEvents);

      // Pre-fill default title
      if (user && !title) {
        setTitle(t('quickBook.quickMeetingTitle', { name: user.fullName }));
      }
    } catch (err) {
      toast.error(t('quickBook.loadFailed'));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roomId, user]);

  // Compute status in real-time
  const computeRoomStatus = () => {
    if (!room) return;

    const now = new Date();
    
    // Find if there is a booking currently running
    const current = todayBookings.find((b) => {
      const start = new Date(b.start);
      const end = new Date(b.end);
      return start <= now && now < end;
    });

    // Find the next upcoming booking today
    const upcoming = todayBookings
      .filter((b) => new Date(b.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

    setCurrentBooking(current || null);
    setNextBooking(upcoming || null);

    if (current) {
      setRoomState('busy');
      // Countdown to current booking end
      const end = new Date(current.end);
      const diffMs = end - now;
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (3600 * 1000));
        const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
        setCountdownText(
          `${hours > 0 ? hours + 'h ' : ''}${mins}p ${secs}s`
        );
      }
      setTimeUntilNext(null);
    } else if (upcoming) {
      const start = new Date(upcoming.start);
      const diffMins = Math.floor((start - now) / (60 * 1000));
      setTimeUntilNext(diffMins);

      if (diffMins <= 60) {
        setRoomState('soon-busy');
      } else {
        setRoomState('available');
      }
    } else {
      setRoomState('available');
      setTimeUntilNext(null);
    }
  };

  // Run calculation and set timer for tick
  useEffect(() => {
    computeRoomStatus();
    
    // Refresh calculations every second for countdown/real-time state
    timerRef.current = setInterval(() => {
      computeRoomStatus();
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [todayBookings, room]);

  // Pre-fill time inputs when toggle or duration changes
  useEffect(() => {
    if (!isCustomTime) {
      const now = new Date();
      now.setSeconds(0, 0);
      const startStr = formatDateTimeLocal(now);
      const end = new Date(now.getTime() + selectedDuration * 60 * 1000);
      const endStr = formatDateTimeLocal(end);
      setCustomStart(startStr);
      setCustomEnd(endStr);
    }
  }, [selectedDuration, isCustomTime]);

  const formatDateTimeLocal = (date) => {
    const pad = (num) => String(num).padStart(2, '0');
    const Y = date.getFullYear();
    const M = pad(date.getMonth() + 1);
    const D = pad(date.getDate());
    const h = pad(date.getHours());
    const m = pad(date.getMinutes());
    return `${Y}-${M}-${D}T${h}:${m}`;
  };

  // Determine duration limits due to next booking
  const maxAllowedMinutes = timeUntilNext !== null ? timeUntilNext : 1440; // max 24h if no upcoming

  const handleQuickDuration = (mins) => {
    if (mins > maxAllowedMinutes) {
      toast.error(t('quickBook.durationExceeded', { minutes: maxAllowedMinutes }));
      return;
    }
    setSelectedDuration(mins);
  };

  const handleCustomStartChange = (e) => {
    setCustomStart(e.target.value);
  };

  const handleCustomEndChange = (e) => {
    setCustomEnd(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t('quickBook.titleRequired'));
      return;
    }

    const start = new Date(customStart);
    const end = new Date(customEnd);
    const now = new Date();

    if (start >= end) {
      toast.error(t('quickBook.timeError'));
      return;
    }

    if (start < new Date(now.getTime() - 5 * 60 * 1000)) {
      toast.error(t('quickBook.pastError'));
      return;
    }

    const durationMinutes = (end - start) / (60 * 1000);
    if (durationMinutes < 15) {
      toast.error(t('quickBook.minDurationError'));
      return;
    }

    // Check conflict locally before sending request
    const hasConflict = todayBookings.some((b) => {
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      return start < bEnd && end > bStart;
    });

    if (hasConflict) {
      toast.error(t('quickBook.conflictError'));
      return;
    }

    setSubmitting(true);
    try {
      await bookingService.createBooking({
        roomId,
        title,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      toast.success(t('quickBook.success'));
      navigate('/bookings');
    } catch (err) {
      const msg = err.response?.data?.message || t('quickBook.failed');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="quick-book-page__loading">
        <div className="spinner" />
        <p>{t('quickBook.loading')}</p>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="quick-book-page">
      <div className="quick-book-card">
        {/* Header: Room detail */}
        <div className="quick-book-header">
          <h1 className="quick-book-room-name">{room.name}</h1>
          <p className="quick-book-room-location">📍 {room.location}</p>

          <div className="quick-book-room-meta">
            <span className="quick-book-meta-badge">
              <FiUsers /> {t('quickBook.capacity', { count: room.capacity })}
            </span>
            {room.equipment && room.equipment.length > 0 && (
              <span className="quick-book-meta-badge">
                <FiLayers /> {t('quickBook.equipment', { count: room.equipment.length })}
              </span>
            )}
          </div>
        </div>

        {/* Real-time Status Card */}
        <div className={`quick-book-status-card status-${roomState}`}>
          {roomState === 'available' && (
            <>
              <div className="status-badge-wrapper">
                <FiCheckCircle className="status-icon" />
                <span className="status-label">{t('quickBook.available')}</span>
              </div>
              {nextBooking ? (
                <p className="status-description">
                  {t('quickBook.availableUntil', {
                    time: new Date(nextBooking.start).toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' }),
                    minutes: timeUntilNext
                  })}
                </p>
              ) : (
                <p className="status-description">{t('quickBook.availableRestOfDay')}</p>
              )}
            </>
          )}

          {roomState === 'soon-busy' && (
            <>
              <div className="status-badge-wrapper">
                <FiAlertCircle className="status-icon animate-pulse" />
                <span className="status-label">{t('quickBook.soonBusy')}</span>
              </div>
              <p className="status-description">
                {t('quickBook.soonBusyDesc', {
                  time: new Date(nextBooking.start).toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' }),
                  minutes: timeUntilNext
                })}
              </p>
            </>
          )}

          {roomState === 'busy' && (
            <>
              <div className="status-badge-wrapper">
                <FiClock className="status-icon" />
                <span className="status-label">{t('quickBook.busy')}</span>
              </div>
              <p className="status-description">
                {t('quickBook.busyDesc', { title: currentBooking.title })}
              </p>
              <div className="status-countdown">
                {t('quickBook.busyCountdown', { countdown: countdownText })}
              </div>
            </>
          )}
        </div>

        {/* Form Quick Book - Hidden if room is busy (unless customized for later) */}
        {roomState !== 'busy' || isCustomTime ? (
          <form className="quick-book-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <Input
                id="quick-book-title"
                type="text"
                label={t('quickBook.meetingTitle')}
                placeholder={t('quickBook.meetingTitlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Quick Duration Buttons (only if not customized time) */}
            {!isCustomTime && (
              <div className="form-section">
                <label className="input-label">{t('quickBook.selectDuration')}</label>
                <div className="duration-buttons">
                  <button
                    type="button"
                    className={`duration-btn ${selectedDuration === 15 ? 'active' : ''} ${maxAllowedMinutes < 15 ? 'disabled' : ''}`}
                    onClick={() => handleQuickDuration(15)}
                    disabled={maxAllowedMinutes < 15}
                  >
                    {t('quickBook.durationMins', { minutes: 15 })}
                  </button>
                  <button
                    type="button"
                    className={`duration-btn ${selectedDuration === 30 ? 'active' : ''} ${maxAllowedMinutes < 30 ? 'disabled' : ''}`}
                    onClick={() => handleQuickDuration(30)}
                    disabled={maxAllowedMinutes < 30}
                  >
                    {t('quickBook.durationMins', { minutes: 30 })}
                  </button>
                  <button
                    type="button"
                    className={`duration-btn ${selectedDuration === 60 ? 'active' : ''} ${maxAllowedMinutes < 60 ? 'disabled' : ''}`}
                    onClick={() => handleQuickDuration(60)}
                    disabled={maxAllowedMinutes < 60}
                  >
                    {t('quickBook.durationHour')}
                  </button>
                </div>
              </div>
            )}

            {/* Customize time checkbox */}
            <div className="form-section time-toggle-wrapper">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={isCustomTime}
                  onChange={(e) => setIsCustomTime(e.target.checked)}
                />
                <span className="checkbox-label">{t('quickBook.customizeTime')}</span>
              </label>
            </div>

            {/* Custom Time Fields */}
            {isCustomTime && (
              <div className="form-section custom-time-fields animate-fade-in">
                <Input
                  id="quick-book-start"
                  type="datetime-local"
                  label={t('quickBook.startTime')}
                  value={customStart}
                  onChange={handleCustomStartChange}
                  required
                />
                <Input
                  id="quick-book-end"
                  type="datetime-local"
                  label={t('quickBook.endTime')}
                  value={customEnd}
                  onChange={handleCustomEndChange}
                  required
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="quick-book-actions">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="btn-submit-quick-book"
                disabled={maxAllowedMinutes < 15 && !isCustomTime}
              >
                {maxAllowedMinutes < 15 && !isCustomTime ? t('quickBook.cannotBook') : t('quickBook.bookNow')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/rooms')}
                className="btn-cancel-quick-book"
              >
                {t('quickBook.back')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="quick-book-busy-msg">
            <p>{t('quickBook.roomBusyMsg')}</p>
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsCustomTime(true)}
            >
              {t('quickBook.bookOtherTime')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/rooms')}
              style={{ marginTop: '0.75rem', width: '100%' }}
            >
              {t('quickBook.backToRooms')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickBookPage;
