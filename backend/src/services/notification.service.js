const notificationRepository = require('../repositories/notification.repository');
const sseManager = require('../utils/sseManager');
const logger = require('../utils/logger');

/**
 * Notification service — business logic for in-app notifications.
 */
const notificationService = {
  /**
   * Create a notification and push it via SSE if user is online.
   * @param {string} userId
   * @param {string} type  — NotificationType enum value
   * @param {string} title
   * @param {string} message
   * @param {string|null} [bookingId]
   */
  async createNotification(userId, type, title, message, bookingId = null) {
    try {
      const data = { userId, type, title, message };
      if (bookingId) data.bookingId = bookingId;

      const notification = await notificationRepository.create(data);

      // Push via SSE if user is currently connected
      if (sseManager.isOnline(userId)) {
        sseManager.sendToUser(userId, {
          event: 'notification',
          data: notification,
        });
      }

      return notification;
    } catch (err) {
      logger.error('[NotificationService] Failed to create notification:', err.message);
      throw err;
    }
  },

  /**
   * Get paginated notifications for a user, plus unread count.
   * @param {string} userId
   * @param {number} page
   * @param {number} limit
   */
  async getNotifications(userId, page = 1, limit = 20) {
    const [result, unreadCount] = await Promise.all([
      notificationRepository.findByUserId(userId, page, limit),
      notificationRepository.countUnread(userId),
    ]);

    return {
      data: result.notifications,
      unreadCount,
      pagination: result.pagination,
    };
  },

  /**
   * Get unread notification count for a user.
   * @param {string} userId
   * @returns {{ count: number }}
   */
  async getUnreadCount(userId) {
    const count = await notificationRepository.countUnread(userId);
    return { count };
  },

  /**
   * Mark a single notification as read.
   * Verifies ownership — throws 404 if not found.
   * @param {string} id
   * @param {string} userId
   */
  async markAsRead(id, userId) {
    const notification = await notificationRepository.markAsRead(id, userId);
    if (!notification) {
      const err = new Error('Notification not found');
      err.statusCode = 404;
      throw err;
    }
    return notification;
  },

  /**
   * Mark all notifications as read for a user.
   * @param {string} userId
   */
  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    return { message: 'All marked as read' };
  },
};

module.exports = notificationService;
