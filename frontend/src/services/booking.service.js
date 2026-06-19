import api from './api';

/**
 * Booking API service — wraps all /api/bookings endpoints.
 */
const bookingService = {
  /**
   * Get paginated list of bookings with optional filters.
   * @param {{ roomId?, userId?, status?, startDate?, endDate?, page?, limit? }} params
   */
  async getBookings(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      searchParams.append(key, value);
    });

    const { data } = await api.get(`/bookings?${searchParams.toString()}`);
    return data;
  },

  /**
   * Get a single booking by ID.
   * @param {string} id
   */
  async getBooking(id) {
    const { data } = await api.get(`/bookings/${id}`);
    return data;
  },

  /**
   * Create a new booking.
   * @param {{ roomId, title, startTime, endTime }} bookingData
   */
  async createBooking(bookingData) {
    const { data } = await api.post('/bookings', bookingData);
    return data;
  },

  /**
   * Approve a booking (approver/admin only).
   * @param {string} id
   */
  async approveBooking(id) {
    const { data } = await api.patch(`/bookings/${id}/approve`);
    return data;
  },

  /**
   * Reject a booking with a reason (approver/admin only).
   * @param {string} id
   * @param {string} reason
   */
  async rejectBooking(id, reason) {
    const { data } = await api.patch(`/bookings/${id}/reject`, {
      rejectionReason: reason,
    });
    return data;
  },

  /**
   * Cancel a booking (owner or admin).
   * @param {string} id
   */
  async cancelBooking(id) {
    const { data } = await api.patch(`/bookings/${id}/cancel`);
    return data;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RECURRING BOOKING
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Preview recurring slots — returns okSlots and conflictSlots without saving.
   * @param {{ roomId, title, startDate, endDate, startTime, endTime, frequency }} params
   */
  async previewRecurring(params) {
    const { data } = await api.post('/bookings/recurring/preview', params);
    return data;
  },

  /**
   * Confirm and create a recurring booking series.
   * @param {{ roomId, title, startDate, endDate, startTime, endTime, frequency, confirmedSlots? }} params
   */
  async createRecurring(params) {
    const { data } = await api.post('/bookings/recurring', params);
    return data;
  },

  /**
   * Cancel all pending/approved bookings in a recurring series.
   * @param {string} recurringId
   */
  async cancelRecurringSeries(recurringId) {
    const { data } = await api.delete(`/bookings/recurring/${recurringId}`);
    return data;
  },

  /**
   * Get all recurring series for the current user.
   */
  async getMyRecurring() {
    const { data } = await api.get('/bookings/recurring');
    return data;
  },

  /**
   * Get bookings formatted for calendar display (FullCalendar events).
   * @param {{ start: string, end: string, roomId?: string }} params
   */
  async getCalendarEvents(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      searchParams.append(key, value);
    });
    const { data } = await api.get(`/bookings/calendar?${searchParams.toString()}`);
    return data;
  },
};

export default bookingService;
