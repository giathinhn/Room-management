/**
 * ai.routes.js — AI Chatbot routes (Plan 16)
 * Base path: /api/ai
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authenticate = require('../middlewares/auth.middleware');

/**
 * POST /api/ai/chat
 * Send a message to the AI assistant and receive a structured response.
 * Body: { message: string }
 */
router.post('/chat', authenticate, aiController.chat);

/**
 * GET /api/ai/history?limit=50
 * Retrieve the authenticated user's chat history.
 */
router.get('/history', authenticate, aiController.getHistory);

/**
 * DELETE /api/ai/history
 * Clear all chat messages for the authenticated user.
 */
router.delete('/history', authenticate, aiController.clearHistory);

module.exports = router;
