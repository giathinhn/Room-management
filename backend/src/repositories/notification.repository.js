const prisma = require('../config/database');

/**
 * Notification repository — handles all Prisma calls for notifications.
 */
const notificationRepository = {
  /**
   * Create a new notification.
   * @param {{ userId, type, title, message, bookingId? }} data
   */
  async create(data) {
    return prisma.notification.create({
      data,
      include: {
        booking: {
          include: { room: true },
        },
      },
    });
  },

  /**
   * Find notifications for a user with pagination (newest first).
   * @param {string} userId
   * @param {number} page
   * @param {number} limit
   */
  async findByUserId(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: { room: true },
          },
        },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Count unread notifications for a user.
   * @param {string} userId
   */
  async countUnread(userId) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  /**
   * Mark a single notification as read (ownership check).
   * @param {string} id
   * @param {string} userId
   */
  async markAsRead(id, userId) {
    // Check ownership first
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        booking: {
          include: { room: true },
        },
      },
    });
  },

  /**
   * Mark all notifications as read for a user.
   * @param {string} userId
   */
  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};

module.exports = notificationRepository;
