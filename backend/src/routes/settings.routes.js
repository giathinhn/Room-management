const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Personal user settings routes
/**
 * @swagger
 * /settings/user:
 *   get:
 *     tags: [Settings]
 *     summary: Lấy cài đặt cá nhân của người dùng hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về cài đặt cá nhân
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 settings:
 *                   type: object
 *                   properties:
 *                     language:
 *                       type: string
 *                       example: vi
 *                     emailNotifications:
 *                       type: boolean
 *                       example: true
 *                     inAppNotifications:
 *                       type: boolean
 *                       example: true
 *                     calendarSync:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Không có quyền truy cập
 */
router.get('/user', authenticate, settingsController.getUserSettings);

/**
 * @swagger
 * /settings/user:
 *   put:
 *     tags: [Settings]
 *     summary: Cập nhật cài đặt cá nhân của người dùng hiện tại
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 example: en
 *               emailNotifications:
 *                 type: boolean
 *                 example: false
 *               inAppNotifications:
 *                 type: boolean
 *                 example: true
 *               calendarSync:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật cài đặt cá nhân thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật cài đặt thành công
 *                 settings:
 *                   type: object
 */
router.put('/user', authenticate, settingsController.updateUserSettings);

// Operational system settings routes
/**
 * @swagger
 * /settings/system:
 *   get:
 *     tags: [Settings]
 *     summary: Lấy cấu hình hệ thống (Admin & Approver)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về cấu hình hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 settings:
 *                   type: object
 *                   properties:
 *                     companyName:
 *                       type: string
 *                       example: RoomSync Corp
 *                     allowRecurringBookings:
 *                       type: boolean
 *                       example: true
 *                     maxBookingDaysInAdvance:
 *                       type: integer
 *                       example: 30
 *                     requireApproval:
 *                       type: boolean
 *                       example: true
 *                     autoReleaseNoShowMins:
 *                       type: integer
 *                       example: 15
 *       401:
 *         description: Không có quyền truy cập
 */
router.get('/system', authenticate, settingsController.getSystemSettings); // Authorized users can read system settings

/**
 * @swagger
 * /settings/system:
 *   put:
 *     tags: [Settings]
 *     summary: Cập nhật cấu hình hệ thống (Chỉ Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: RoomSync Corp Updated
 *               allowRecurringBookings:
 *                 type: boolean
 *                 example: true
 *               maxBookingDaysInAdvance:
 *                 type: integer
 *                 example: 60
 *               requireApproval:
 *                 type: boolean
 *                 example: false
 *               autoReleaseNoShowMins:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Cập nhật cấu hình hệ thống thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật cấu hình hệ thống thành công
 *                 settings:
 *                   type: object
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không đủ quyền hạn (Yêu cầu role admin)
 */
router.put('/system', authenticate, authorize('admin'), settingsController.updateSystemSettings); // Only admins can update system settings

module.exports = router;
