const express = require('express');

const router = express.Router();
const roomController = require('../controllers/room.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// ── Floor Map routes (MUST be before /:id to avoid param conflicts) ──────────
/**
 * @swagger
 * /rooms/buildings:
 *   get:
 *     tags: [Rooms]
 *     summary: Lấy danh sách các tòa nhà
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách tên tòa nhà
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 buildings:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['Building A', 'Building B']
 */
router.get('/buildings',  authenticate, roomController.getBuildings);

/**
 * @swagger
 * /rooms/floors:
 *   get:
 *     tags: [Rooms]
 *     summary: Lấy danh sách các tầng có trong hệ thống
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách số tầng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 floors:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [1, 2, 3]
 */
router.get('/floors',     authenticate, roomController.getFloors);

/**
 * @swagger
 * /rooms/floor-map:
 *   get:
 *     tags: [Rooms]
 *     summary: Lấy sơ đồ tầng và vị trí các phòng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: building
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên tòa nhà
 *       - in: query
 *         name: floor
 *         required: true
 *         schema:
 *           type: integer
 *         description: Số tầng
 *     responses:
 *       200:
 *         description: Trả về sơ đồ tầng và danh sách phòng kèm tọa độ x, y
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 rooms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Room'
 */
router.get('/floor-map',  authenticate, roomController.getFloorMap);

router.get('/floor-setting', authenticate, roomController.getFloorSetting);
router.put('/floor-setting', authenticate, authorize('admin'), roomController.updateFloorSetting);
router.put('/bulk-auto-approve', authenticate, authorize('admin'), roomController.bulkUpdateAutoApprove);

// ⚠️  /available MUST be before /:id
/**
 * @swagger
 * /rooms/available:
 *   get:
 *     tags: [Rooms]
 *     summary: Tìm kiếm phòng họp trống theo thời gian và bộ lọc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startTime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Thời gian bắt đầu (ISO string)
 *       - in: query
 *         name: endTime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Thời gian kết thúc (ISO string)
 *       - in: query
 *         name: minCapacity
 *         schema:
 *           type: integer
 *         description: Sức chứa tối thiểu
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *         description: Danh sách thiết bị (cách nhau bởi dấu phẩy, vd Projector,Wifi)
 *       - in: query
 *         name: building
 *         schema:
 *           type: string
 *         description: Lọc theo tòa nhà
 *       - in: query
 *         name: floor
 *         schema:
 *           type: integer
 *         description: Lọc theo tầng
 *     responses:
 *       200:
 *         description: Trả về danh sách các phòng còn trống
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 rooms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Room'
 */
router.get('/available', authenticate, roomController.findAvailable);

// ── Standard CRUD ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: Lấy danh sách tất cả các phòng họp
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: building
 *         schema:
 *           type: string
 *         description: Lọc theo tòa nhà
 *       - in: query
 *         name: floor
 *         schema:
 *           type: integer
 *         description: Lọc theo tầng
 *     responses:
 *       200:
 *         description: Trả về danh sách phòng họp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 rooms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Room'
 */
router.get('/',    authenticate, roomController.getAll);

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     tags: [Rooms]
 *     summary: Lấy chi tiết thông tin một phòng họp
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phòng họp
 *     responses:
 *       200:
 *         description: Trả về chi tiết phòng họp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       404:
 *         description: Không tìm thấy phòng họp
 */
router.get('/:id', authenticate, roomController.getById);

/**
 * @swagger
 * /rooms/{id}/favorite:
 *   post:
 *     tags: [Rooms]
 *     summary: Thêm phòng họp vào danh sách yêu thích
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phòng họp
 *     responses:
 *       200:
 *         description: Đã thêm vào yêu thích thành công
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
 *                   example: Đã thêm phòng họp vào danh sách yêu thích
 */
router.post('/:id/favorite', authenticate, roomController.favoriteRoom);

/**
 * @swagger
 * /rooms/{id}/favorite:
 *   delete:
 *     tags: [Rooms]
 *     summary: Xóa phòng họp khỏi danh sách yêu thích
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phòng họp
 *     responses:
 *       200:
 *         description: Đã xóa khỏi yêu thích thành công
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
 *                   example: Đã xóa phòng họp khỏi danh sách yêu thích
 */
router.delete('/:id/favorite', authenticate, roomController.unfavoriteRoom);

/**
 * @swagger
 * /rooms:
 *   post:
 *     tags: [Rooms]
 *     summary: Tạo phòng họp mới (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, capacity, location]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Phòng Hội Thảo A
 *               capacity:
 *                 type: integer
 *                 example: 20
 *               location:
 *                 type: string
 *                 example: Tầng 2, Tòa A
 *               equipment:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['Projector', 'Whiteboard']
 *               building:
 *                 type: string
 *                 example: Building A
 *               floor:
 *                 type: integer
 *                 example: 2
 *               x:
 *                 type: number
 *                 example: 100.5
 *               y:
 *                 type: number
 *                 example: 150.2
 *     responses:
 *       201:
 *         description: Tạo phòng họp thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc trùng tên phòng
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không đủ quyền hạn
 */
router.post('/',   authenticate, authorize('admin'), roomController.create);

/**
 * @swagger
 * /rooms/{id}/map-position:
 *   put:
 *     tags: [Rooms]
 *     summary: Cập nhật tọa độ x, y của phòng họp trên sơ đồ (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phòng họp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [x, y]
 *             properties:
 *               x:
 *                 type: number
 *                 example: 215.3
 *               y:
 *                 type: number
 *                 example: 80.4
 *     responses:
 *       200:
 *         description: Cập nhật tọa độ thành công
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
 *                   example: Cập nhật tọa độ phòng họp thành công
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 */
router.put('/:id/map-position', authenticate, authorize('admin'), roomController.updateMapPosition);

/**
 * @swagger
 * /rooms/{id}:
 *   put:
 *     tags: [Rooms]
 *     summary: Cập nhật thông tin phòng họp (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phòng họp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Phòng Hội Thảo A+
 *               capacity:
 *                 type: integer
 *                 example: 25
 *               location:
 *                 type: string
 *                 example: Tầng 2, Tòa A
 *               equipment:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['Projector', 'Whiteboard', 'Smart TV']
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               building:
 *                 type: string
 *                 example: Building A
 *               floor:
 *                 type: integer
 *                 example: 2
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
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       404:
 *         description: Không tìm thấy phòng họp
 */
router.put('/:id',  authenticate, authorize('admin'), roomController.update);

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     tags: [Rooms]
 *     summary: Xóa phòng họp (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phòng họp
 *     responses:
 *       200:
 *         description: Xóa phòng họp thành công
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
 *                   example: Xóa phòng họp thành công
 *       404:
 *         description: Không tìm thấy phòng họp
 */
router.delete('/:id', authenticate, authorize('admin'), roomController.delete);

module.exports = router;
