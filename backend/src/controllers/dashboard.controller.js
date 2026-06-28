const dashboardService = require('../services/dashboard.service');

/**
 * Parse startDate / endDate query params and validate them.
 * Defaults: last 7 days when not provided.
 */
function parseDateRange(query) {
  let { startDate, endDate } = query;

  if (!startDate || !endDate) {
    // Default: last 7 days
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    now.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: now };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }

  return { startDate: start, endDate: end };
}

const dashboardController = {
  /**
   * GET /api/dashboard/overview
   */
  async getOverview(req, res, next) {
    try {
      const dateRange = parseDateRange(req.query);
      const data = await dashboardService.getOverview(dateRange);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/dashboard/room-usage
   */
  async getRoomUsage(req, res, next) {
    try {
      const dateRange = parseDateRange(req.query);
      const data = await dashboardService.getRoomUsage(dateRange);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/dashboard/peak-hours
   */
  async getPeakHours(req, res, next) {
    try {
      const dateRange = parseDateRange(req.query);
      const data = await dashboardService.getPeakHours(dateRange);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/dashboard/top-users
   */
  async getTopUsers(req, res, next) {
    try {
      const dateRange = parseDateRange(req.query);
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
      const data = await dashboardService.getTopUsers(dateRange, limit);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/dashboard/trends
   */
  async getTrends(req, res, next) {
    try {
      const dateRange = parseDateRange(req.query);
      const granularity = req.query.granularity === 'month' ? 'month' : 'week';
      const data = await dashboardService.getTrends(dateRange, granularity);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/dashboard/personal
   */
  async getPersonalStats(req, res, next) {
    try {
      const { id: userId, role } = req.user;
      const data = await dashboardService.getPersonalStats(userId, role);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = dashboardController;
