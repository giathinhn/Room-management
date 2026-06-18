const prisma = require('../config/database');

/**
 * Booking repository — handles all Prisma calls related to bookings.
 */
const bookingRepository = {
  /**
   * Get all bookings with filters and pagination.
   * Includes: room, user (booker), approver info.
   * @param {{ roomId?, userId?, status?, startDate?, endDate?, page?, limit? }} filters
   */
  async findAll({ roomId, userId, status, startDate, endDate, page = 1, limit = 10 } = {}) {
    const where = {};

    if (roomId) where.roomId = roomId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) {
        // Include full day: set endDate to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.startTime.lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          room: {
            select: { id: true, name: true, location: true, capacity: true },
          },
          user: {
            select: { id: true, fullName: true, email: true },
          },
          approver: {
            select: { id: true, fullName: true, email: true },
          },
          recurring: {
            select: { id: true, frequency: true },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Find a booking by ID with full details.
   * @param {string} id
   */
  async findById(id) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true, equipment: true },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
        approver: {
          select: { id: true, fullName: true, email: true },
        },
        recurring: {
          select: { id: true, frequency: true },
        },
      },
    });
  },

  /**
   * Create a new booking.
   * @param {{ userId, roomId, title, startTime, endTime }} data
   */
  async create(data) {
    return prisma.booking.create({
      data,
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  },

  /**
   * Update booking status + optional extra fields (approverId, approvedAt, rejectionReason).
   * @param {string} id
   * @param {string} status
   * @param {{ approverId?, approvedAt?, rejectionReason? }} extra
   */
  async updateStatus(id, status, extra = {}) {
    return prisma.booking.update({
      where: { id },
      data: { status, ...extra },
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
        approver: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  },

  /**
   * Find bookings that overlap with the given time range.
   * Overlap: existing.startTime < endTime AND existing.endTime > startTime
   * Only considers 'pending' and 'approved' bookings.
   *
   * @param {string} roomId
   * @param {Date} startTime
   * @param {Date} endTime
   * @param {string} [excludeId] — exclude this booking id (for edit scenarios)
   */
  async findOverlapping(roomId, startTime, endTime, excludeId) {
    const where = {
      roomId,
      status: { in: ['pending', 'approved'] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return prisma.booking.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });
  },

  /**
   * Count bookings matching the given filters.
   * @param {object} filters
   */
  async countByFilters(filters = {}) {
    const where = {};

    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;

    return prisma.booking.count({ where });
  },

  /**
   * Create multiple bookings at once (for recurring booking).
   * @param {Array<{ userId, roomId, title, startTime, endTime, status, recurringId }>} bookings
   */
  async createMany(bookings) {
    return prisma.booking.createMany({ data: bookings });
  },

  /**
   * Cancel all pending/approved bookings belonging to a recurring series.
   * @param {string} recurringId
   * @returns {{ count: number }}
   */
  async cancelByRecurringId(recurringId) {
    return prisma.booking.updateMany({
      where: {
        recurringId,
        status: { in: ['pending', 'approved'] },
      },
      data: { status: 'cancelled' },
    });
  },
};

module.exports = bookingRepository;
