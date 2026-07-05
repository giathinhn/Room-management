const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// Personal stats for user/approver dashboard
/**
 * @swagger
 * /dashboard/personal:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy thống kê tổng quan cá nhân của người dùng hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về số liệu thống kê cá nhân
 */
router.get('/personal',   authenticate, dashboardController.getPersonalStats);

// All dashboard routes require admin role
/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy tổng quan toàn bộ hệ thống (Chỉ Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về tổng quan hệ thống
 */
router.get('/overview',   authenticate, authorize('admin'), dashboardController.getOverview);

/**
 * @swagger
 * /dashboard/room-usage:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy thống kê hiệu suất sử dụng của các phòng họp (Chỉ Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về phần trăm hiệu suất sử dụng từng phòng
 */
router.get('/room-usage', authenticate, authorize('admin'), dashboardController.getRoomUsage);

/**
 * @swagger
 * /dashboard/peak-hours:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy thống kê khung giờ cao điểm (Chỉ Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về phân bố lượng đặt phòng theo các giờ trong ngày
 */
router.get('/peak-hours', authenticate, authorize('admin'), dashboardController.getPeakHours);

/**
 * @swagger
 * /dashboard/top-users:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy danh sách người dùng đặt phòng nhiều nhất (Chỉ Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về top người dùng
 */
router.get('/top-users',  authenticate, authorize('admin'), dashboardController.getTopUsers);

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy xu hướng đặt phòng theo tuần/tháng (Chỉ Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về biểu đồ xu hướng đặt phòng
 */
router.get('/trends',     authenticate, authorize('admin'), dashboardController.getTrends);

module.exports = router;
