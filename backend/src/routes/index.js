const express = require('express');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Kiểm tra trạng thái hoạt động của hệ thống (Health Check)
 *     description: Trả về trạng thái hoạt động hiện tại của server, thời gian chạy và môi trường.
 *     responses:
 *       200:
 *         description: Server hoạt động bình thường
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-07-05T08:00:00.000Z
 *                 uptime:
 *                   type: number
 *                   example: 124.5
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Auth routes ─────────────────────────────────────────────────────────────
router.use('/auth', require('./auth.routes'));

// ─── Profile routes ───────────────────────────────────────────────────────────
router.use('/profile', require('./profile.routes'));

// ─── Settings routes ──────────────────────────────────────────────────────────
router.use('/settings', require('./settings.routes'));

// ─── Admin — user management ──────────────────────────────────────────────────
router.use('/users', require('./user.routes'));

// ─── Room management ──────────────────────────────────────────────────────────
router.use('/rooms', require('./room.routes'));

// ─── Booking system ───────────────────────────────────────────────────────────
router.use('/bookings', require('./booking.routes'));

// ─── Export (Excel download) ──────────────────────────────────────────────────
router.use('/export', require('./export.routes'));

// ─── Notifications ────────────────────────────────────────────────────────────
router.use('/notifications', require('./notification.routes'));

// ─── Suggestions (alternative rooms/slots + smart suggestions) ────────────────
router.use('/suggestions', require('./suggestion.routes'));

// ─── Dashboard & Analytics (admin only) ───────────────────────────────────────
router.use('/dashboard', require('./dashboard.routes'));

// ─── Booking Templates ────────────────────────────────────────────────────────
router.use('/templates', require('./template.routes'));

// ─── AI Chatbot (Plan 16) ─────────────────────────────────────────────────────
router.use('/ai', require('./ai.routes'));

module.exports = router;

