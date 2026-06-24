import api from './api';

/**
 * Notification service — API calls for in-app notifications.
 */
const notificationService = {
  /**
   * Fetch paginated notifications for the current user.
   * @param {number} page
   * @param {number} limit
   */
  async getAll(page = 1, limit = 20) {
    const { data } = await api.get('/notifications', { params: { page, limit } });
    return data;
  },

  /**
   * Get unread notification count.
   * @returns {{ count: number }}
   */
  async getUnreadCount() {
    const { data } = await api.get('/notifications/unread-count');
    return data;
  },

  /**
   * Mark a single notification as read.
   * @param {string} id
   */
  async markAsRead(id) {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead() {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  },
};

export default notificationService;
