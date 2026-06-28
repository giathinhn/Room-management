const prisma = require('../config/database');

/**
 * Dashboard repository — raw aggregate queries for analytics.
 */
const dashboardRepository = {
  /**
   * Overview: total bookings by status + today/this-week counts.
   * @param {Date} startDate
   * @param {Date} endDate
   */
  async getOverview(startDate, endDate) {
    const where = {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Group by status
    const statusGroups = await prisma.booking.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    // Bookings created today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const bookingsToday = await prisma.booking.count({
      where: { startTime: { gte: todayStart, lte: todayEnd } },
    });

    // Bookings this week (Mon–Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const bookingsThisWeek = await prisma.booking.count({
      where: { startTime: { gte: weekStart, lte: weekEnd } },
    });

    return { statusGroups, bookingsToday, bookingsThisWeek };
  },

  /**
   * Room usage: booking count + total hours per room.
   * @param {Date} startDate
   * @param {Date} endDate
   */
  async getRoomUsage(startDate, endDate) {
    // Use queryRaw for hour calculation
    const results = await prisma.$queryRaw`
      SELECT
        r.id            AS "roomId",
        r.name          AS "roomName",
        r.location      AS "location",
        COUNT(b.id)     AS "bookingCount",
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600),
          0
        )               AS "totalHours"
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      WHERE b.start_time >= ${startDate}
        AND b.start_time <= ${endDate}
        AND b.status IN ('approved', 'pending')
      GROUP BY r.id, r.name, r.location
      ORDER BY "bookingCount" DESC
    `;
    return results;
  },

  /**
   * Peak hours: bookings count per day-of-week × hour slot.
   * Returns raw rows: { dow (0=Sun–6=Sat), hour, count }
   * @param {Date} startDate
   * @param {Date} endDate
   */
  async getPeakHours(startDate, endDate) {
    const results = await prisma.$queryRaw`
      SELECT
        EXTRACT(DOW FROM b.start_time AT TIME ZONE 'UTC')   AS dow,
        EXTRACT(HOUR FROM b.start_time AT TIME ZONE 'UTC')  AS hour,
        COUNT(b.id)                                          AS count
      FROM bookings b
      WHERE b.start_time >= ${startDate}
        AND b.start_time <= ${endDate}
        AND b.status IN ('approved', 'pending')
      GROUP BY dow, hour
      ORDER BY dow, hour
    `;
    return results;
  },

  /**
   * Top users: most bookings + total hours.
   * @param {Date} startDate
   * @param {Date} endDate
   * @param {number} limit
   */
  async getTopUsers(startDate, endDate, limit = 10) {
    const results = await prisma.$queryRaw`
      SELECT
        u.id            AS "userId",
        u.full_name     AS "fullName",
        u.email         AS email,
        COUNT(b.id)     AS "bookingCount",
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600),
          0
        )               AS "totalHours"
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      WHERE b.start_time >= ${startDate}
        AND b.start_time <= ${endDate}
      GROUP BY u.id, u.full_name, u.email
      ORDER BY "bookingCount" DESC
      LIMIT ${limit}
    `;
    return results;
  },

  /**
   * Trends: booking counts grouped by week or month.
   * @param {Date} startDate
   * @param {Date} endDate
   * @param {'week'|'month'} granularity
   */
  async getTrends(startDate, endDate, granularity = 'week') {
    const trunc = granularity === 'month' ? 'month' : 'week';
    const results = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC(${trunc}, b.start_time) AS period,
        COUNT(b.id)                          AS total,
        COUNT(b.id) FILTER (WHERE b.status = 'approved')  AS approved,
        COUNT(b.id) FILTER (WHERE b.status = 'rejected')  AS rejected,
        COUNT(b.id) FILTER (WHERE b.status = 'pending')   AS pending,
        COUNT(b.id) FILTER (WHERE b.status = 'cancelled') AS cancelled
      FROM bookings b
      WHERE b.start_time >= ${startDate}
        AND b.start_time <= ${endDate}
      GROUP BY period
      ORDER BY period ASC
    `;
    return results;
  },

  /**
   * Get personal statistics for User or Approver roles.
   * @param {string} userId
   * @param {string} role
   */
  async getPersonalStats(userId, role) {
    // 1. Core stats: count of personal bookings by status
    const statusGroups = await prisma.booking.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    });

    // 2. Personal bookings approved total hours
    const personalApprovedBookings = await prisma.booking.findMany({
      where: { userId, status: 'approved' },
      select: { startTime: true, endTime: true },
    });

    let totalHours = 0;
    for (const b of personalApprovedBookings) {
      const diffMs = b.endTime - b.startTime;
      const hours = diffMs / 3600000;
      totalHours += hours;
    }

    // 3. Top 5 upcoming bookings for the user (pending or approved)
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        userId,
        startTime: { gte: new Date() },
        status: { in: ['approved', 'pending'] },
      },
      include: {
        room: {
          select: { name: true, location: true },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    });

    // Initialize return object
    const result = {
      statusGroups,
      totalHours,
      upcomingBookings,
    };

    // 4. If role is approver, load approval metrics
    if (role === 'approver') {
      // Pending bookings in system
      const pendingApprovalsCount = await prisma.booking.count({
        where: { status: 'pending' },
      });

      // Approved by this approver
      const myApprovedCount = await prisma.booking.count({
        where: { approvedBy: userId, status: 'approved' },
      });

      // Rejected by this approver
      const myRejectedCount = await prisma.booking.count({
        where: { approvedBy: userId, status: 'rejected' },
      });

      // Recent 5 approvals handled by this approver
      const approvalsHistory = await prisma.booking.findMany({
        where: { approvedBy: userId },
        include: {
          room: { select: { name: true } },
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { approvedAt: 'desc' },
        take: 5,
      });

      result.approverMetrics = {
        pendingApprovalsCount,
        myApprovedCount,
        myRejectedCount,
        approvalsHistory,
      };
    }

    return result;
  },
};

module.exports = dashboardRepository;
