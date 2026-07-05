const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/booking.controller');
const commentController = require('../controllers/comment.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * Booking routes.
 * Base path: /api/bookings
 */

// List all bookings (role-filtered in service)
/**
 * @swagger
 * /bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Lấy danh sách lịch đặt phòng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *         description: Lọc theo phòng họp
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *         description: Lọc theo trạng thái đặt phòng
 *     responses:
 *       200:
 *         description: Trả về danh sách đặt phòng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 */
router.get('/', authenticate, bookingController.getAll);

// ── Recurring booking routes (must come BEFORE /:id routes) ──────────────────
/**
 * @swagger
 * /bookings/recurring:
 *   get:
 *     tags: [Bookings]
 *     summary: Lấy danh sách chuỗi đặt phòng lặp lại của tôi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về các chuỗi lặp lại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 series:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: 'series-uuid' }
 *                       roomId: { type: string, example: 'room-uuid' }
 *                       title: { type: string, example: 'Họp tuần' }
 *                       frequency: { type: string, example: 'weekly' }
 *                       startDate: { type: string, format: 'date-time' }
 *                       endDate: { type: string, format: 'date-time' }
 */
router.get('/recurring', authenticate, bookingController.getMyRecurring);

/**
 * @swagger
 * /bookings/recurring/preview:
 *   post:
 *     tags: [Bookings]
 *     summary: Xem trước các lịch đặt phòng sẽ được tạo cho chuỗi lặp lại
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomId, title, startTime, endTime, frequency, interval, endDate]
 *             properties:
 *               roomId: { type: string, example: 'room-uuid-456' }
 *               title: { type: string, example: 'Họp giao ban tuần' }
 *               description: { type: string, example: 'Họp team' }
 *               startTime: { type: string, example: '09:00' }
 *               endTime: { type: string, example: '10:00' }
 *               frequency: { type: string, enum: [daily, weekly, monthly], example: 'weekly' }
 *               interval: { type: integer, example: 1 }
 *               daysOfWeek: { type: array, items: { type: integer }, example: [1, 3] }
 *               startDate: { type: string, example: '2026-07-06' }
 *               endDate: { type: string, example: '2026-08-06' }
 *     responses:
 *       200:
 *         description: Danh sách các slot xem trước
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       startTime: { type: string, format: 'date-time' }
 *                       endTime: { type: string, format: 'date-time' }
 *                       isAvailable: { type: boolean, example: true }
 */
router.post('/recurring/preview', authenticate, bookingController.previewRecurring);

/**
 * @swagger
 * /bookings/recurring:
 *   post:
 *     tags: [Bookings]
 *     summary: Tạo chuỗi đặt phòng lặp lại
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomId, title, startTime, endTime, frequency, interval, endDate]
 *     responses:
 *       201:
 *         description: Tạo chuỗi đặt phòng lặp lại thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Tạo chuỗi đặt phòng lặp lại thành công' }
 *                 seriesId: { type: string }
 *                 createdCount: { type: integer }
 */
router.post('/recurring', authenticate, bookingController.createRecurring);

/**
 * @swagger
 * /bookings/recurring/{id}:
 *   delete:
 *     tags: [Bookings]
 *     summary: Hủy toàn bộ các lịch đặt phòng trong một chuỗi lặp lại
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chuỗi lặp lại (seriesId)
 *     responses:
 *       200:
 *         description: Đã hủy chuỗi thành công
 */
router.delete('/recurring/:id', authenticate, bookingController.cancelRecurring);

// ── Calendar route (must come BEFORE /:id routes) ────────────────────────────
/**
 * @swagger
 * /bookings/calendar:
 *   get:
 *     tags: [Bookings]
 *     summary: Lấy danh sách booking trong khoảng thời gian để hiển thị lên lịch (Calendar)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Thời gian bắt đầu khoảng lọc
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Thời gian kết thúc khoảng lọc
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *         description: Lọc theo phòng họp
 *     responses:
 *       200:
 *         description: Trả về danh sách booking phù hợp
 */
router.get('/calendar', authenticate, bookingController.getCalendarEvents);

// ── Single booking routes ─────────────────────────────────────────────────────
/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Lấy chi tiết lịch đặt phòng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch đặt phòng
 *     responses:
 *       200:
 *         description: Trả về chi tiết đặt phòng
 */
router.get('/:id', authenticate, bookingController.getById);

/**
 * @swagger
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Tạo mới yêu cầu đặt phòng họp đơn lẻ
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomId, title, startTime, endTime]
 *             properties:
 *               roomId: { type: string, example: 'room-uuid-456' }
 *               title: { type: string, example: 'Họp Kick-off Dự Án A' }
 *               description: { type: string, example: 'Thảo luận kế hoạch' }
 *               startTime: { type: string, format: 'date-time', example: '2026-07-06T09:00:00.000Z' }
 *               endTime: { type: string, format: 'date-time', example: '2026-07-06T10:30:00.000Z' }
 *     responses:
 *       201:
 *         description: Tạo lịch đặt phòng thành công
 */
router.post('/', authenticate, bookingController.create);

/**
 * @swagger
 * /bookings/{id}/approve:
 *   patch:
 *     tags: [Bookings]
 *     summary: Phê duyệt yêu cầu đặt phòng (Approver / Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đặt phòng
 *     responses:
 *       200:
 *         description: Duyệt đặt phòng thành công
 */
router.patch('/:id/approve', authenticate, authorize('admin', 'approver'), bookingController.approve);

/**
 * @swagger
 * /bookings/{id}/reject:
 *   patch:
 *     tags: [Bookings]
 *     summary: Từ chối yêu cầu đặt phòng (Approver / Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đặt phòng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rejectionReason]
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 example: Trùng giờ họp ban giám đốc
 *     responses:
 *       200:
 *         description: Từ chối đặt phòng thành công
 */
router.patch('/:id/reject', authenticate, authorize('admin', 'approver'), bookingController.reject);

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     summary: Hủy lịch đặt phòng (Người đặt hoặc Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đặt phòng
 *     responses:
 *       200:
 *         description: Hủy lịch đặt phòng thành công
 */
router.patch('/:id/cancel', authenticate, bookingController.cancel);

/**
 * @swagger
 * /bookings/{id}/check-in:
 *   post:
 *     tags: [Bookings]
 *     summary: Điểm danh (Check-in) vào cuộc họp đã được duyệt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đặt phòng
 *     responses:
 *       200:
 *         description: Check-in thành công
 */
router.post('/:id/check-in', authenticate, bookingController.checkIn);

// ── Comment routes (nested under bookings) ───────────────────────────────────
/**
 * @swagger
 * /bookings/{id}/comments:
 *   get:
 *     tags: [Bookings]
 *     summary: Lấy danh sách bình luận/góp ý của lịch đặt phòng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đặt phòng
 *     responses:
 *       200:
 *         description: Trả về danh sách bình luận
 */
router.get('/:id/comments', authenticate, commentController.getByBooking);

/**
 * @swagger
 * /bookings/{id}/comments:
 *   post:
 *     tags: [Bookings]
 *     summary: Thêm bình luận/góp ý vào lịch đặt phòng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đặt phòng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Hãy chuẩn bị thêm 2 ghế dự phòng
 *     responses:
 *       201:
 *         description: Thêm bình luận thành công
 */
router.post('/:id/comments', authenticate, commentController.create);

/**
 * @swagger
 * /bookings/{id}/comments/{cid}:
 *   put:
 *     tags: [Bookings]
 *     summary: Cập nhật nội dung bình luận
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đặt phòng
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bình luận
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Thay đổi bình luận thành công
 *     responses:
 *       200:
 *         description: Cập nhật bình luận thành công
 */
router.put('/:id/comments/:cid', authenticate, commentController.update);

/**
 * @swagger
 * /bookings/{id}/comments/{cid}:
 *   delete:
 *     tags: [Bookings]
 *     summary: Xóa bình luận
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đặt phòng
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bình luận
 *     responses:
 *       200:
 *         description: Xóa bình luận thành công
 */
router.delete('/:id/comments/:cid', authenticate, commentController.delete);

module.exports = router;
