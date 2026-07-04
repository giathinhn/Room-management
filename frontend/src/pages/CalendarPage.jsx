import { useState, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import bookingService from '../services/booking.service';
import RoomFilter from '../components/calendar/RoomFilter';
import EventPopover from '../components/calendar/EventPopover';
import QuickBookingModal from '../components/calendar/QuickBookingModal';
import './CalendarPage.css';

/**
 * Status colors for FullCalendar events.
 * rejected and cancelled are excluded from calendar API, so only these two matter.
 */
const STATUS_COLORS = {
  pending: {
    backgroundColor: 'rgba(245, 158, 11, 0.85)',
    borderColor: '#d97706',
    textColor: '#fff',
  },
  approved: {
    backgroundColor: 'rgba(34, 197, 94, 0.85)',
    borderColor: '#16a34a',
    textColor: '#fff',
  },
};

/**
 * Custom render for calendar event content.
 * Month view: just title.
 * Week/Day view: title + room + user.
 */
function renderEventContent(eventInfo) {
  const { view, event } = eventInfo;
  const { roomName, userName, isRecurring } = event.extendedProps;
  const isTimeGrid = view.type === 'timeGridWeek' || view.type === 'timeGridDay';

  return (
    <div className="cal-event">
      <div className="cal-event__title">
        {isRecurring && <span className="cal-event__recurring-icon">🔄 </span>}
        {event.title}
      </div>
      {isTimeGrid && roomName && (
        <div className="cal-event__room">📍 {roomName}</div>
      )}
      {isTimeGrid && userName && (
        <div className="cal-event__user">👤 {userName}</div>
      )}
    </div>
  );
}

/**
 * CalendarPage — displays all bookings on a FullCalendar (day/week/month).
 * Features:
 *  - Room filter
 *  - Click empty slot → QuickBookingModal
 *  - Click event → EventPopover with detail + actions
 *  - Auto re-fetch on date range change
 */
function CalendarPage() {
  const calendarRef = useRef(null);

  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // EventPopover state
  const [popover, setPopover] = useState(null); // { event, position }

  // QuickBookingModal state
  const [quickBooking, setQuickBooking] = useState(null); // { startTime, endTime }

  // ── Fetch events from API ──────────────────────────────────────────────────
  const fetchEvents = useCallback(async (start, end, roomId) => {
    setIsLoading(true);
    try {
      const res = await bookingService.getCalendarEvents({
        start: start.toISOString(),
        end: end.toISOString(),
        roomId: roomId || undefined,
      });

      const mapped = (res.data || []).map((evt) => ({
        id: evt.id,
        title: evt.title,
        start: evt.start,
        end: evt.end,
        extendedProps: {
          status: evt.status,
          roomId: evt.roomId,
          roomName: evt.roomName,
          userId: evt.userId,
          userName: evt.userName,
          isRecurring: evt.isRecurring,
        },
        ...(STATUS_COLORS[evt.status] || STATUS_COLORS.approved),
      }));

      setEvents(mapped);
    } catch (err) {
      console.error('[CalendarPage] fetchEvents error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Called by FullCalendar when visible date range changes ─────────────────
  const handleDatesSet = useCallback(
    (dateInfo) => {
      fetchEvents(dateInfo.start, dateInfo.end, selectedRoomId);
    },
    [fetchEvents, selectedRoomId]
  );

  // ── Room filter change → re-fetch ──────────────────────────────────────────
  const handleRoomChange = (roomId) => {
    setSelectedRoomId(roomId);
    const api = calendarRef.current?.getApi();
    if (api) {
      const view = api.view;
      fetchEvents(view.activeStart, view.activeEnd, roomId);
    }
  };

  // ── Refresh (after booking action) ────────────────────────────────────────
  const handleRefresh = () => {
    const api = calendarRef.current?.getApi();
    if (api) {
      const view = api.view;
      fetchEvents(view.activeStart, view.activeEnd, selectedRoomId);
    }
  };

  // ── Click on empty slot ───────────────────────────────────────────────────
  const handleDateSelect = useCallback((selectInfo) => {
    let start = selectInfo.start;
    let end = selectInfo.end;

    // Month view: only date selected → default 09:00–10:00
    if (selectInfo.allDay) {
      start = new Date(start);
      start.setHours(9, 0, 0, 0);
      end = new Date(start);
      end.setHours(10, 0, 0, 0);
    }

    setQuickBooking({ startTime: start, endTime: end });
    // Unselect the highlight
    selectInfo.view.calendar.unselect();
  }, []);

  // ── Click on event ────────────────────────────────────────────────────────
  const handleEventClick = useCallback((clickInfo) => {
    clickInfo.jsEvent.preventDefault();
    const rect = clickInfo.jsEvent.target.getBoundingClientRect();
    const { event } = clickInfo;

    setPopover({
      event: {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        ...event.extendedProps,
      },
      position: {
        x: rect.right + 8,
        y: rect.top,
      },
    });
  }, []);

  return (
    <div className="cal-page">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="cal-page__header">
        <div className="cal-page__title-area">
          <h1 className="cal-page__title">📅 Lịch đặt phòng</h1>
          <p className="cal-page__subtitle">
            Xem và quản lý lịch đặt phòng theo ngày, tuần hoặc tháng
          </p>
        </div>

        <div className="cal-page__controls">
          {/* Legend */}
          <div className="cal-page__legend">
            <div className="cal-page__legend-item">
              <span className="cal-page__legend-dot cal-page__legend-dot--approved" />
              Đã duyệt
            </div>
            <div className="cal-page__legend-item">
              <span className="cal-page__legend-dot cal-page__legend-dot--pending" />
              Chờ duyệt
            </div>
          </div>

          {/* Room filter */}
          <RoomFilter roomId={selectedRoomId} onChange={handleRoomChange} />
        </div>
      </div>

      {/* ── FullCalendar ───────────────────────────────────────────────────── */}
      <div className="cal-page__wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={localStorage.getItem('defaultCalendarView') || 'timeGridWeek'}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
          }}
          locale="vi"
          firstDay={1}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          selectable={true}
          selectMirror={true}
          editable={false}
          dayMaxEvents={3}
          events={events}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          select={handleDateSelect}
          datesSet={handleDatesSet}
          height="100%"
          loading={(isLoading) => {
            // isLoading param name conflicts — using outer isLoading state
          }}
          eventDisplay="block"
          nowIndicator={true}
          scrollTime="08:00:00"
        />
      </div>

      {/* ── EventPopover ──────────────────────────────────────────────────── */}
      {popover && (
        <EventPopover
          event={popover.event}
          position={popover.position}
          onClose={() => setPopover(null)}
          onRefresh={handleRefresh}
        />
      )}

      {/* ── QuickBookingModal ────────────────────────────────────────────── */}
      {quickBooking && (
        <QuickBookingModal
          startTime={quickBooking.startTime}
          endTime={quickBooking.endTime}
          onClose={() => setQuickBooking(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}

export default CalendarPage;
