const prisma = require('../config/database');

/**
 * Room repository — handles all Prisma / raw-SQL calls related to rooms.
 */
const roomRepository = {
  /**
   * Get all rooms with pagination and filtering.
   * @param {{ page?: number, limit?: number, capacity?: number, location?: string, equipment?: string[], search?: string, isActive?: boolean }} filters
   */
  async findAll({ page = 1, limit = 10, capacity, location, equipment, search, isActive } = {}) {
    const where = {};

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (capacity) {
      where.capacity = { gte: Number(capacity) };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (equipment && equipment.length > 0) {
      // Room must contain ALL requested equipment
      where.equipment = { hasEvery: equipment };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.room.count({ where }),
    ]);

    return {
      rooms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Find a single room by ID.
   * @param {string} id
   */
  async findById(id) {
    return prisma.room.findUnique({ where: { id } });
  },

  /**
   * Find a room by name (for duplicate check).
   * @param {string} name
   * @param {string} [excludeId] — exclude this id (for update)
   */
  async findByName(name, excludeId) {
    return prisma.room.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  /**
   * Create a new room.
   * @param {{ name: string, capacity: number, location: string, equipment: string[] }} data
   */
  async create(data) {
    return prisma.room.create({ data });
  },

  /**
   * Update a room.
   * @param {string} id
   * @param {object} data
   */
  async update(id, data) {
    return prisma.room.update({ where: { id }, data });
  },

  /**
   * Soft-delete a room by setting isActive = false.
   * @param {string} id
   */
  async softDelete(id) {
    return prisma.room.update({ where: { id }, data: { isActive: false } });
  },

  /**
   * Find rooms available during [startTime, endTime].
   * A room is available if it has NO booking with status 'pending' or 'approved'
   * that overlaps the requested interval.
   * Overlap condition: booking.start_time < endTime AND booking.end_time > startTime
   *
   * @param {Date} startTime
   * @param {Date} endTime
   * @param {{ capacity?: number, equipment?: string[] }} filters
   */
  async findAvailable(startTime, endTime, { capacity, equipment } = {}) {
    const where = {
      isActive: true,
      // Exclude rooms that have overlapping bookings
      bookings: {
        none: {
          status: { in: ['pending', 'approved'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      },
    };

    if (capacity) {
      where.capacity = { gte: Number(capacity) };
    }

    if (equipment && equipment.length > 0) {
      where.equipment = { hasEvery: equipment };
    }

    return prisma.room.findMany({
      where,
      orderBy: { capacity: 'asc' },
    });
  },
};

module.exports = roomRepository;
