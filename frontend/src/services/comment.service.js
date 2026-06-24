import api from './api';

/**
 * Comment API service — wraps /api/bookings/:id/comments endpoints.
 */
const commentService = {
  /**
   * Get all comments for a booking.
   * @param {string} bookingId
   */
  async getComments(bookingId) {
    const { data } = await api.get(`/bookings/${bookingId}/comments`);
    return data;
  },

  /**
   * Create a comment on a booking.
   * @param {string} bookingId
   * @param {string} content
   */
  async createComment(bookingId, content) {
    const { data } = await api.post(`/bookings/${bookingId}/comments`, { content });
    return data;
  },

  /**
   * Update a comment.
   * @param {string} bookingId
   * @param {string} commentId
   * @param {string} content
   */
  async updateComment(bookingId, commentId, content) {
    const { data } = await api.put(`/bookings/${bookingId}/comments/${commentId}`, { content });
    return data;
  },

  /**
   * Delete a comment.
   * @param {string} bookingId
   * @param {string} commentId
   */
  async deleteComment(bookingId, commentId) {
    const { data } = await api.delete(`/bookings/${bookingId}/comments/${commentId}`);
    return data;
  },
};

export default commentService;
