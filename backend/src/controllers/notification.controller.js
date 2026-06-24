const notificationService = require('../services/notification.service');
const sseManager = require('../utils/sseManager');

/**
 * Notification controller — handles HTTP + SSE endpoints for notifications.
 */
const notificationController = {
  /**
   * GET /api/notifications?page=1&limit=20
   * Returns paginated notifications + unread count for authenticated user.
   */
  async getAll(req, res, next) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await notificationService.getNotifications(userId, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/notifications/unread-count
   * Returns { count: number } for authenticated user.
   */
  async getUnreadCount(req, res, next) {
    try {
      const result = await notificationService.getUnreadCount(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/notifications/:id/read
   * Mark a specific notification as read.
   */
  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user.id);
      res.json({ data: notification });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read for the authenticated user.
   */
  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/notifications/stream
   * Server-Sent Events stream for real-time notifications.
   * Auth: token passed as query param ?token=xxx (EventSource cannot set headers).
   */
  stream(req, res) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering if proxied
    });

    // Send an initial "connected" event
    res.write(`data: ${JSON.stringify({ event: 'connected', userId: req.user.id })}\n\n`);

    // Heartbeat every 30 seconds to keep connection alive through proxies
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (_err) {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Register client in SSE manager
    sseManager.addClient(req.user.id, res);

    // Cleanup on client disconnect
    res.on('close', () => {
      clearInterval(heartbeat);
    });
  },
};

module.exports = notificationController;
