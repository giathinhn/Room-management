const express = require('express');
const router = express.Router();

const suggestionController = require('../controllers/suggestion.controller');
const authenticate = require('../middlewares/auth.middleware');

/**
 * Suggestion routes.
 * Base path: /api/suggestions
 */

// GET /api/suggestions/rooms?roomId=&startTime=&endTime=&minCapacity=
/**
 * @swagger
 * /suggestions/rooms:
 *   get:
 *     tags: [Suggestions]
 *     summary: Gợi ý các phòng họp thay thế khi bị trùng lịch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startTime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endTime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: minCapacity
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trả về danh sách phòng thay thế phù hợp và còn trống
 */
router.get('/rooms', authenticate, suggestionController.getAlternativeRooms);

// GET /api/suggestions/alternatives?roomId=&date=&preferredStartTime=
/**
 * @swagger
 * /suggestions/alternatives:
 *   get:
 *     tags: [Suggestions]
 *     summary: Gợi ý các khung giờ thay thế khác trong cùng một ngày cho một phòng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần gợi ý (YYYY-MM-DD)
 *       - in: query
 *         name: preferredStartTime
 *         required: true
 *         schema:
 *           type: string
 *         description: Giờ mong muốn bắt đầu (HH:MM)
 *     responses:
 *       200:
 *         description: Trả về danh sách khung giờ trống thay thế gần với giờ mong muốn nhất
 */
router.get('/alternatives', authenticate, suggestionController.getAlternativeSlots);

// GET /api/suggestions/smart
/**
 * @swagger
 * /suggestions/smart:
 *   get:
 *     tags: [Suggestions]
 *     summary: Đưa ra gợi ý thông minh dựa trên thói quen đặt phòng của người dùng
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về các phòng và khung giờ gợi ý thông minh
 */
router.get('/smart', authenticate, suggestionController.getSmartSuggestions);

module.exports = router;
