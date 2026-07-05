const express = require('express');
const profileController = require('../controllers/profile.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../validators/auth.validator');
const { uploadAvatar } = require('../middlewares/upload.middleware');

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /profile:
 *   get:
 *     tags: [Profile]
 *     summary: Lấy thông tin profile của người dùng hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin profile chi tiết
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Không có quyền truy cập
 */
router.get('/', profileController.getProfile);

/**
 * @swagger
 * /profile:
 *   put:
 *     tags: [Profile]
 *     summary: Cập nhật thông tin họ tên của người dùng
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn B
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
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
 *                   example: Cập nhật thông tin cá nhân thành công
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 */
router.put('/', validate(updateProfileSchema), profileController.updateProfile);

/**
 * @swagger
 * /profile/password:
 *   put:
 *     tags: [Profile]
 *     summary: Thay đổi mật khẩu người dùng
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: Password123!
 *               newPassword:
 *                 type: string
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Thay đổi mật khẩu thành công
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
 *                   example: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu hiện tại không đúng hoặc mật khẩu mới trùng mật khẩu cũ
 */
router.put('/password', validate(changePasswordSchema), profileController.changePassword);

/**
 * @swagger
 * /profile/avatar:
 *   post:
 *     tags: [Profile]
 *     summary: Tải ảnh đại diện (avatar)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Tải ảnh lên thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 avatarUrl:
 *                   type: string
 *                   example: /uploads/avatar-123.jpg
 *       400:
 *         description: File không đúng định dạng hoặc vượt quá kích thước cho phép
 */
router.post('/avatar', uploadAvatar.single('avatar'), profileController.uploadAvatar);

/**
 * @swagger
 * /profile/stats:
 *   get:
 *     tags: [Profile]
 *     summary: Lấy thống kê đặt phòng cá nhân
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về số liệu thống kê cá nhân
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalBookings:
 *                       type: integer
 *                       example: 12
 *                     approvedBookings:
 *                       type: integer
 *                       example: 8
 *                     pendingBookings:
 *                       type: integer
 *                       example: 2
 *                     rejectedBookings:
 *                       type: integer
 *                       example: 1
 *                     cancelledBookings:
 *                       type: integer
 *                       example: 1
 */
router.get('/stats', profileController.getStats);

module.exports = router;
