const dashboardRepository = require('../repositories/dashboard.repository');

/**
 * Dashboard service — transforms raw aggregate data into frontend-ready shapes.
 */
const dashboardService = {
  /**
   * Overview stats.
   * @param {{ startDate: Date, endDate: Date }} dateRange
   */
  async getOverview({ startDate, endDate }) {
    const { statusGroups, bookingsToday, bookingsThisWeek } =
      await dashboardRepository.getOverview(startDate, endDate);

    // Map status groups to { status: count } map
    const byStatus = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    let totalBookings = 0;

    for (const g of statusGroups) {
      const count = Number(g._count.id);
      byStatus[g.status] = count;
      totalBookings += count;
    }

    const approvalRate =
      totalBookings > 0 ? ((byStatus.approved / totalBookings) * 100).toFixed(1) : '0.0';

    return {
      totalBookings,
      approved: byStatus.approved,
      rejected: byStatus.rejected,
      pending: byStatus.pending,
      cancelled: byStatus.cancelled,
      approvalRate: parseFloat(approvalRate),
      bookingsToday,
      bookingsThisWeek,
    };
  },

  /**
   * Room usage sorted by booking count descending.
   * @param {{ startDate: Date, endDate: Date }} dateRange
   */
  async getRoomUsage({ startDate, endDate }) {
    const rows = await dashboardRepository.getRoomUsage(startDate, endDate);
    return rows.map((r) => ({
      roomId: r.roomId,
      roomName: r.roomName,
      location: r.location,
      bookingCount: Number(r.bookingCount),
      totalHours: Math.round(Number(r.totalHours) * 10) / 10,
    }));
  },

  /**
   * Heatmap: 7-row (Mon=0 … Sun=6) × 16-col (07–22) matrix.
   * Value = booking count at that slot.
   * @param {{ startDate: Date, endDate: Date }} dateRange
   */
  async getPeakHours({ startDate, endDate }) {
    const rows = await dashboardRepository.getPeakHours(startDate, endDate);

    // days: 0=Mon … 6=Sun  (DB returns 0=Sun,1=Mon,…,6=Sat → remap)
    const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7..22
    // matrix[dayIndex][hourIndex] where dayIndex 0=Mon
    const matrix = Array.from({ length: 7 }, () => Array(16).fill(0));

    for (const row of rows) {
      const dbDow = Number(row.dow); // 0=Sun, 1=Mon, … 6=Sat
      const hour = Number(row.hour);
      const count = Number(row.count);

      if (hour < 7 || hour > 22) continue;

      // Convert Sun=0 → Mon=0 … Sun=6
      const dayIndex = dbDow === 0 ? 6 : dbDow - 1;
      const hourIndex = hour - 7;
      matrix[dayIndex][hourIndex] = count;
    }

    return { matrix, hours: HOURS };
  },

  /**
   * Top N users by booking count.
   * @param {{ startDate: Date, endDate: Date }} dateRange
   * @param {number} limit
   */
  async getTopUsers({ startDate, endDate }, limit = 10) {
    const rows = await dashboardRepository.getTopUsers(startDate, endDate, limit);
    return rows.map((r) => ({
      userId: r.userId,
      fullName: r.fullName,
      email: r.email,
      bookingCount: Number(r.bookingCount),
      totalHours: Math.round(Number(r.totalHours) * 10) / 10,
    }));
  },

  /**
   * Booking trends by week or month.
   * @param {{ startDate: Date, endDate: Date }} dateRange
   * @param {'week'|'month'} granularity
   */
  async getTrends({ startDate, endDate }, granularity = 'week') {
    const rows = await dashboardRepository.getTrends(startDate, endDate, granularity);
    return rows.map((r) => ({
      period: r.period instanceof Date ? r.period.toISOString().split('T')[0] : String(r.period),
      total: Number(r.total),
      approved: Number(r.approved),
      rejected: Number(r.rejected),
      pending: Number(r.pending),
      cancelled: Number(r.cancelled),
    }));
  },
};

module.exports = dashboardService;
