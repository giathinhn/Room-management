/**
 * ai.controller.js — HTTP handlers for AI Chatbot endpoints (Plan 16)
 *
 * Routes:
 *   POST   /api/ai/chat     — Send a message and get AI response
 *   GET    /api/ai/history  — Fetch chat history
 *   DELETE /api/ai/history  — Clear chat history
 */

const aiService = require('../services/ai.service');
const ApiError = require('../utils/ApiError');

const aiController = {
  /**
   * POST /api/ai/chat
   * Body: { message: string }
   * Response: { success: true, data: { reply, action, rooms?, proposal?, bookings?, booking? } }
   */
  async chat(req, res, next) {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return next(ApiError.badRequest('Tin nhắn không được để trống'));
      }

      if (message.trim().length > 1000) {
        return next(ApiError.badRequest('Tin nhắn quá dài (tối đa 1000 ký tự)'));
      }

      const result = await aiService.processMessage(
        req.user.id,
        req.user.role,
        message.trim()
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/ai/history?limit=50
   * Response: { success: true, data: ChatMessage[] }
   */
  async getHistory(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const messages = await aiService.getHistory(req.user.id, limit);

      return res.json({
        success: true,
        data: messages,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/ai/history
   * Response: { success: true, message: 'Đã xóa lịch sử chat' }
   */
  async clearHistory(req, res, next) {
    try {
      await aiService.clearHistory(req.user.id);

      return res.json({
        success: true,
        message: 'Đã xóa toàn bộ lịch sử chat',
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = aiController;
