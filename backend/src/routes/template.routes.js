const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const authenticate = require('../middlewares/auth.middleware');

/**
 * All template routes require authentication.
 *
 * GET    /api/templates                         — list user's templates
 * POST   /api/templates                         — create template
 * PUT    /api/templates/:id                     — update template (owner only)
 * DELETE /api/templates/:id                     — delete template (owner only)
 * POST   /api/templates/from-booking/:bookingId — save booking as template
 */

/**
 * @swagger
 * /templates:
 *   get:
 *     tags: [Templates]
 *     summary: Lấy danh sách các mẫu đặt phòng cá nhân
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách templates của tôi
 */
router.get('/', authenticate, templateController.getAll);

/**
 * @swagger
 * /templates:
 *   post:
 *     tags: [Templates]
 *     summary: Tạo mới một mẫu đặt phòng họp
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, title, roomId, startTime, endTime]
 *             properties:
 *               name: { type: string, example: 'Mẫu họp giao ban' }
 *               title: { type: string, example: 'Họp giao ban tuần' }
 *               roomId: { type: string, example: 'room-uuid' }
 *               startTime: { type: string, example: '09:00' }
 *               endTime: { type: string, example: '10:30' }
 *     responses:
 *       201:
 *         description: Tạo mẫu thành công
 */
router.post('/', authenticate, templateController.create);

/**
 * @swagger
 * /templates/{id}:
 *   put:
 *     tags: [Templates]
 *     summary: Cập nhật mẫu đặt phòng họp (Chủ sở hữu)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: 'Mẫu họp giao ban sửa đổi' }
 *               title: { type: string, example: 'Họp giao ban tuần update' }
 *               roomId: { type: string }
 *               startTime: { type: string, example: '10:00' }
 *               endTime: { type: string, example: '11:00' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', authenticate, templateController.update);

/**
 * @swagger
 * /templates/{id}:
 *   delete:
 *     tags: [Templates]
 *     summary: Xóa mẫu đặt phòng họp (Chủ sở hữu)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID template
 *     responses:
 *       200:
 *         description: Xóa mẫu thành công
 */
router.delete('/:id', authenticate, templateController.delete);

/**
 * @swagger
 * /templates/from-booking/{bookingId}:
 *   post:
 *     tags: [Templates]
 *     summary: Lưu lịch đặt phòng họp đã có thành mẫu đặt phòng nhanh
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID booking nguồn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: 'Mẫu lưu nhanh từ cuộc họp Q2' }
 *     responses:
 *       201:
 *         description: Tạo mẫu từ cuộc họp thành công
 */
router.post('/from-booking/:bookingId', authenticate, templateController.createFromBooking);

module.exports = router;
