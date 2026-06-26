const prisma = require('../config/database');

/**
 * Template repository — handles all Prisma calls related to BookingTemplate.
 */
const templateRepository = {
  /**
   * Get all templates for a user, including room info.
   * @param {string} userId
   */
  async findByUserId(userId) {
    return prisma.bookingTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        room: {
          select: { id: true, name: true, location: true },
        },
      },
    });
  },

  /**
   * Find a template by ID with room info.
   * @param {string} id
   */
  async findById(id) {
    return prisma.bookingTemplate.findUnique({
      where: { id },
      include: {
        room: {
          select: { id: true, name: true, location: true },
        },
      },
    });
  },

  /**
   * Create a new booking template.
   * @param {{ userId, name, roomId?, title, startTime, endTime }} data
   */
  async create(data) {
    return prisma.bookingTemplate.create({
      data,
      include: {
        room: {
          select: { id: true, name: true, location: true },
        },
      },
    });
  },

  /**
   * Update a booking template by ID.
   * @param {string} id
   * @param {{ name?, roomId?, title?, startTime?, endTime? }} data
   */
  async update(id, data) {
    return prisma.bookingTemplate.update({
      where: { id },
      data,
      include: {
        room: {
          select: { id: true, name: true, location: true },
        },
      },
    });
  },

  /**
   * Delete a booking template by ID.
   * @param {string} id
   */
  async delete(id) {
    return prisma.bookingTemplate.delete({ where: { id } });
  },

  /**
   * Count templates belonging to a user (for limit check).
   * @param {string} userId
   */
  async countByUserId(userId) {
    return prisma.bookingTemplate.count({ where: { userId } });
  },
};

module.exports = templateRepository;
