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
router.get('/', authenticate, notificationController.getAll);

// GET /api/notifications/unread-count  (must be BEFORE /:id routes)
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// PATCH /api/notifications/read-all  (must be BEFORE /:id routes)
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, notificationController.markAsRead);

// ─── SSE stream endpoint ──────────────────────────────────────────────────────

// GET /api/notifications/stream?token=xxx
router.get('/stream', authenticateSSE, notificationController.stream);

module.exports = router;
