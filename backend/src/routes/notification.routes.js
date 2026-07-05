const express = require('express');
const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const authenticate = require('../middlewares/auth.middleware');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

/**
 * Special middleware for SSE endpoint:
 * Accepts token via query param (?token=xxx) because
 * the browser EventSource API cannot set custom headers.
 */
function authenticateSSE(req, res, next) {
  // Try Authorization header first (fallback)
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    // SSE clients pass token as query param
    token = req.query.token;
  }

  if (!token) {
    return next(ApiError.unauthorized('No token provided'));
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    return next();
  } catch (err) {
    return next(err);
  }
}

// ─── REST endpoints ───────────────────────────────────────────────────────────

// GET /api/notifications?page=1&limit=20
/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Lấy danh sách thông báo cá nhân phân trang
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Trả về danh sách thông báo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       content: { type: string }
 *                       isRead: { type: boolean }
 *                       createdAt: { type: string, format: 'date-time' }
 */
router.get('/', authenticate, notificationController.getAll);

// GET /api/notifications/unread-count  (must be BEFORE /:id routes)
/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Lấy số lượng thông báo chưa đọc
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về số lượng chưa đọc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count: { type: integer, example: 5 }
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// PATCH /api/notifications/read-all  (must be BEFORE /:id routes)
/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Đánh dấu tất cả thông báo của người dùng là đã đọc
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 */
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read
/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Đánh dấu một thông báo cụ thể là đã đọc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thông báo
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 */
router.patch('/:id/read', authenticate, notificationController.markAsRead);

// ─── SSE stream endpoint ──────────────────────────────────────────────────────

// GET /api/notifications/stream?token=xxx
/**
 * @swagger
 * /notifications/stream:
 *   get:
 *     tags: [Notifications]
 *     summary: Nhận thông báo thời gian thực qua Server-Sent Events (SSE)
 *     description: Endpoint này duy trì kết nối SSE dài hạn để nhận thông báo real-time. Token có thể được gửi qua query parameter `token`.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT Access Token của người dùng (vì EventSource trong JS không truyền Header tự chế được)
 *     responses:
 *       200:
 *         description: Đã mở kết nối EventStream thành công
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: text/event-stream
 */
router.get('/stream', authenticateSSE, notificationController.stream);

module.exports = router;
