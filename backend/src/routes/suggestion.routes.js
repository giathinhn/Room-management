const express = require('express');
const router = express.Router();

const suggestionController = require('../controllers/suggestion.controller');
const authenticate = require('../middlewares/auth.middleware');

/**
 * Suggestion routes.
 * Base path: /api/suggestions
 */

// GET /api/suggestions/rooms?roomId=&startTime=&endTime=&minCapacity=
router.get('/rooms', authenticate, suggestionController.getAlternativeRooms);

// GET /api/suggestions/alternatives?roomId=&date=&preferredStartTime=
router.get('/alternatives', authenticate, suggestionController.getAlternativeSlots);

// GET /api/suggestions/smart
router.get('/smart', authenticate, suggestionController.getSmartSuggestions);

module.exports = router;
