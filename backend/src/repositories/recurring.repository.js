const prisma = require('../config/database');

/**
 * Recurring booking repository — handles all Prisma calls for recurring_booking records.
 */
const recurringRepository = {
  /**
   * Create a new recurring_booking record.
   * @param {{ userId, roomId, title, startDate, endDate, startTime, endTime, frequency }} data
   */
  async create(data) {
    return prisma.recurringBooking.create({
      data,
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
        bookings: {
          orderBy: { startTime: 'asc' },
        },
      },
    });
  },

  /**
   * Find a recurring_booking by ID with its child bookings.
   * @param {string} id
   */
  async findById(id) {
    return prisma.recurringBooking.findUnique({
      where: { id },
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
        bookings: {
          orderBy: { startTime: 'asc' },
          include: {
            room: { select: { id: true, name: true, location: true } },
          },
        },
      },
    });
  },

  /**
   * Find all recurring bookings belonging to a user.
   * @param {string} userId
   */
  async findByUserId(userId) {
    return prisma.recurringBooking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true },
        },
        bookings: {
          select: { id: true, status: true, startTime: true, endTime: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });
  },

  /**
   * Delete a recurring_booking record by ID.
   * (Child bookings are NOT deleted here — they are cancelled via booking.repository)
   * @param {string} id
   */
  async delete(id) {
    return prisma.recurringBooking.delete({ where: { id } });
  },
};

module.exports = recurringRepository;
