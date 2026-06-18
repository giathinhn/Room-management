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
};

export default bookingService;
