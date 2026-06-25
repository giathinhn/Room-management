import api from './api';

/**
 * Dashboard API service — calls the /api/dashboard/* endpoints.
 */
const dashboardService = {
  /**
   * Build common date-range query params.
   * @param {string} startDate  — ISO date string (YYYY-MM-DD)
   * @param {string} endDate    — ISO date string (YYYY-MM-DD)
   */
  _params(startDate, endDate) {
    return { params: { startDate, endDate } };
  },

  /** GET /api/dashboard/overview */
  async getOverview(startDate, endDate) {
    const { data } = await api.get('/dashboard/overview', this._params(startDate, endDate));
    return data.data;
  },

  /** GET /api/dashboard/room-usage */
  async getRoomUsage(startDate, endDate) {
    const { data } = await api.get('/dashboard/room-usage', this._params(startDate, endDate));
    return data.data;
  },

  /** GET /api/dashboard/peak-hours */
  async getPeakHours(startDate, endDate) {
    const { data } = await api.get('/dashboard/peak-hours', this._params(startDate, endDate));
    return data.data;
  },

  /** GET /api/dashboard/top-users */
  async getTopUsers(startDate, endDate, limit = 10) {
    const { data } = await api.get('/dashboard/top-users', {
      params: { startDate, endDate, limit },
    });
    return data.data;
  },

  /** GET /api/dashboard/trends */
  async getTrends(startDate, endDate, granularity = 'week') {
    const { data } = await api.get('/dashboard/trends', {
      params: { startDate, endDate, granularity },
    });
    return data.data;
  },
};

export default dashboardService;
