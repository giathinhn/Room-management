const express = require('express');
const exportController = require('../controllers/export.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize    = require('../middlewares/role.middleware');

const router = express.Router();

/**
 * GET /api/export/bookings
 * Download booking list as .xlsx — admin and approver only.
 *
 * Query params:
 *   roomId?    — filter by room
 *   status?    — filter by status (pending|approved|rejected|cancelled)
 *   startDate? — from date (YYYY-MM-DD)
 *   endDate?   — to   date (YYYY-MM-DD)
 *   userId?    — filter by booker (admin only — ignored for approvers)
 */
/**
 * @swagger
 * /export/bookings:
 *   get:
 *     tags: [Export]
 *     summary: Xuất danh sách đặt phòng họp ra file Excel (.xlsx) (Admin / Approver)
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
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Lọc theo ID người đặt (Chỉ Admin được dùng tham số này)
 *     responses:
 *       200:
 *         description: File Excel chứa danh sách đặt phòng họp được tải về thành công
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không đủ quyền hạn
 */
router.get(
  '/bookings',
  authenticate,
  authorize('admin', 'approver'),
  exportController.exportBookings
);

module.exports = router;
