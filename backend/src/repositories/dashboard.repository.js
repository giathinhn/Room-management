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
          SUM(EXTRACT(EPOCH FROM (b."endTime" - b."startTime")) / 3600),
          0
        )               AS "totalHours"
      FROM bookings b
      JOIN rooms r ON r.id = b."roomId"
      WHERE b."startTime" >= ${startDate}
        AND b."startTime" <= ${endDate}
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
        EXTRACT(DOW FROM b."startTime" AT TIME ZONE 'UTC')   AS dow,
        EXTRACT(HOUR FROM b."startTime" AT TIME ZONE 'UTC')  AS hour,
        COUNT(b.id)                                          AS count
      FROM bookings b
      WHERE b."startTime" >= ${startDate}
        AND b."startTime" <= ${endDate}
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
        u."fullName"    AS "fullName",
        u.email         AS email,
        COUNT(b.id)     AS "bookingCount",
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (b."endTime" - b."startTime")) / 3600),
          0
        )               AS "totalHours"
      FROM bookings b
      JOIN users u ON u.id = b."userId"
      WHERE b."startTime" >= ${startDate}
        AND b."startTime" <= ${endDate}
      GROUP BY u.id, u."fullName", u.email
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
        DATE_TRUNC(${trunc}, b."startTime") AS period,
        COUNT(b.id)                          AS total,
        COUNT(b.id) FILTER (WHERE b.status = 'approved')  AS approved,
        COUNT(b.id) FILTER (WHERE b.status = 'rejected')  AS rejected,
        COUNT(b.id) FILTER (WHERE b.status = 'pending')   AS pending,
        COUNT(b.id) FILTER (WHERE b.status = 'cancelled') AS cancelled
      FROM bookings b
      WHERE b."startTime" >= ${startDate}
        AND b."startTime" <= ${endDate}
      GROUP BY period
      ORDER BY period ASC
    `;
    return results;
  },
};

module.exports = dashboardRepository;
