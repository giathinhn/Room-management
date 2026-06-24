const prisma = require('../config/database');

/**
 * Comment repository — handles all Prisma calls related to BookingComment.
 */
const commentRepository = {
  /**
   * Get all comments for a booking, ordered by createdAt ASC.
   * Includes user info.
   * @param {string} bookingId
   */
  async findByBookingId(bookingId) {
    return prisma.bookingComment.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });
  },

  /**
   * Find a single comment by ID.
   * @param {string} id
   */
  async findById(id) {
    return prisma.bookingComment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        booking: {
          select: { id: true, userId: true, approvedBy: true },
        },
      },
    });
  },

  /**
   * Create a new comment.
   * @param {{ bookingId: string, userId: string, content: string }} data
   */
  async create(data) {
    return prisma.bookingComment.create({
      data,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });
  },

  /**
   * Update comment content.
   * @param {string} id
   * @param {string} content
   */
  async update(id, content) {
    return prisma.bookingComment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });
  },

  /**
   * Delete a comment by ID.
   * @param {string} id
   */
  async delete(id) {
    return prisma.bookingComment.delete({ where: { id } });
  },
};

module.exports = commentRepository;
