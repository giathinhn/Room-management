/**
 * ai.routes.js — AI Chatbot routes (Plan 16)
 * Base path: /api/ai
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authenticate = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     tags: [AI Chatbot]
 *     summary: Gửi tin nhắn tới trợ lý AI thông minh (Plan 16)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: Hãy tìm phòng họp trống vào lúc 9 giờ sáng mai cho 10 người.
 *     responses:
 *       200:
 *         description: Trả về câu trả lời có cấu trúc của AI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 reply: { type: string, example: "Tôi tìm thấy phòng họp..." }
 *                 suggestedAction: { type: object, description: "Các thao tác đề xuất nếu có (vd điền sẵn booking info)" }
 */
router.post('/chat', authenticate, aiController.chat);

/**
 * @swagger
 * /ai/history:
 *   get:
 *     tags: [AI Chatbot]
 *     summary: Lấy lịch sử hội thoại của người dùng với trợ lý AI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Giới hạn số lượng tin nhắn cần lấy
 *     responses:
 *       200:
 *         description: Trả về lịch sử tin nhắn
 */
router.get('/history', authenticate, aiController.getHistory);

/**
 * @swagger
 * /ai/history:
 *   delete:
 *     tags: [AI Chatbot]
 *     summary: Xóa toàn bộ lịch sử tin nhắn của người dùng hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã xóa lịch sử hội thoại thành công
 */
router.delete('/history', authenticate, aiController.clearHistory);

module.exports = router;
