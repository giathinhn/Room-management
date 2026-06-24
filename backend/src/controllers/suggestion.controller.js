const suggestionService = require('../services/suggestion.service');

/**
 * Suggestion controller — handles HTTP endpoints for room/slot suggestions.
 */
const suggestionController = {
  /**
   * GET /api/suggestions/rooms
   * Query: roomId, startTime, endTime, minCapacity?
   * Returns top 5 alternative rooms, ranked by relevance.
   */
  async getAlternativeRooms(req, res, next) {
    try {
      const rooms = await suggestionService.getAlternativeRooms(req.query);
      res.json({ data: rooms });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/suggestions/alternatives
   * Query: roomId, date, preferredStartTime?
   * Returns up to 5 free time slots for the room on that date.
   */
  async getAlternativeSlots(req, res, next) {
    try {
      const slots = await suggestionService.getAlternativeSlots(req.query);
      res.json({ data: slots });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/suggestions/smart
   * Returns smart booking suggestions based on user history.
   */
  async getSmartSuggestions(req, res, next) {
    try {
      const suggestions = await suggestionService.getSmartSuggestions(req.user.id);
      res.json({ data: suggestions });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = suggestionController;
