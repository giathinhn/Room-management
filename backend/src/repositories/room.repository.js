const prisma = require('../config/database');

/**
 * Room repository — handles all Prisma / raw-SQL calls related to rooms.
 */
const roomRepository = {
  /**
   * Get all rooms with pagination and filtering.
   * @param {{ page?: number, limit?: number, capacity?: number, location?: string, equipment?: string[], search?: string, isActive?: boolean }} filters
   */
  async findAll({ page = 1, limit = 10, capacity, location, equipment, search, isActive, userId } = {}) {
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
        include: userId ? {
          favoritedBy: {
            where: { id: userId },
            select: { id: true }
          }
        } : undefined,
      }),
      prisma.room.count({ where }),
    ]);

    const mappedRooms = rooms.map((room) => {
      const isFavorite = userId ? (room.favoritedBy && room.favoritedBy.length > 0) : false;
      const { favoritedBy, ...rest } = room;
      return { ...rest, isFavorite };
    });

    return {
      rooms: mappedRooms,
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
   * @param {string} [userId]
   */
  async findById(id, userId) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: userId ? {
        favoritedBy: {
          where: { id: userId },
          select: { id: true },
        },
      } : undefined,
    });

    if (!room) return null;

    const isFavorite = userId ? (room.favoritedBy && room.favoritedBy.length > 0) : false;
    const { favoritedBy, ...rest } = room;
    return { ...rest, isFavorite };
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
   * @param {object} data
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
   * @param {{ capacity?: number, equipment?: string[], location?: string }} filters
   */
  async findAvailable(startTime, endTime, { capacity, equipment, location, userId } = {}) {
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

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    const rooms = await prisma.room.findMany({
      where,
      include: userId ? {
        favoritedBy: {
          where: { id: userId },
          select: { id: true },
        },
      } : undefined,
      orderBy: { capacity: 'asc' },
    });

    return rooms.map((room) => {
      const isFavorite = userId ? (room.favoritedBy && room.favoritedBy.length > 0) : false;
      const { favoritedBy, ...rest } = room;
      return { ...rest, isFavorite };
    });
  },

  /**
   * Get all active rooms with real-time booking status for floor map.
   * Status computed from approved bookings within the next 30 minutes.
   * @param {string} [floor] — filter by floor (optional)
   * @param {string} [building] — filter by building (optional)
   */
  async findAllWithStatus(floor, building, userId) {
    const now = new Date();
    const next30min = new Date(now.getTime() + 30 * 60 * 1000);

    const where = { isActive: true };
    if (floor) where.floor = floor;
    if (building) where.building = building;

    const rooms = await prisma.room.findMany({
      where,
      include: {
        bookings: {
          where: {
            status: 'approved',
            startTime: { lte: next30min },
            endTime: { gt: now },
          },
          orderBy: { startTime: 'asc' },
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        favoritedBy: userId ? {
          where: { id: userId },
          select: { id: true },
        } : undefined,
      },
      // Sort by grid position so rooms appear in natural order
      orderBy: [{ mapY: 'asc' }, { mapX: 'asc' }, { name: 'asc' }],
    });

    return rooms.map((room) => {
      const currentBooking = room.bookings.find(
        (b) => b.startTime <= now && b.endTime > now
      ) || null;
      const nextBooking = room.bookings.find(
        (b) => b.startTime > now && b.startTime <= next30min
      ) || null;

      let status = 'available';
      if (currentBooking) status = 'in_use';
      else if (nextBooking) status = 'upcoming';

      const isFavorite = userId ? (room.favoritedBy && room.favoritedBy.length > 0) : false;

      return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        location: room.location,
        equipment: room.equipment,
        floor: room.floor,
        building: room.building,
        mapX: room.mapX,
        mapY: room.mapY,
        status,
        currentBooking,
        nextBooking,
        isFavorite,
      };
    });
  },

  /**
   * Get list of unique buildings that have active rooms.
   * @returns {string[]}
   */
  async getBuildings() {
    const result = await prisma.room.findMany({
      where: { isActive: true, building: { not: null } },
      select: { building: true },
      distinct: ['building'],
      orderBy: { building: 'asc' },
    });
    return result.map((r) => r.building).filter(Boolean);
  },

  /**
   * Get list of unique floors for a given building (or all if no building).
   * @param {string} [building]
   * @returns {string[]}
   */
  async getFloors(building) {
    const where = { isActive: true, floor: { not: null } };
    if (building) where.building = building;

    const result = await prisma.room.findMany({
      where,
      select: { floor: true },
      distinct: ['floor'],
      orderBy: { floor: 'asc' },
    });
    return result.map((r) => r.floor).filter(Boolean);
  },

  /**
   * Auto-assign the next available grid position for a new room on a floor.
   * Fills cells left-to-right, top-to-bottom with MAX_COLS = 4.
   * @param {string} floor
   * @param {string} building
   */
  async autoAssignGridPosition(floor, building) {
    const setting = await this.getFloorSetting(building, floor);
    const MAX_COLS = setting?.cols || 4;
    const existing = await prisma.room.findMany({
      where: { floor, building, isActive: true },
      select: { mapX: true, mapY: true },
    });

    const occupied = new Set(existing.map((r) => `${r.mapX},${r.mapY}`));

    for (let row = 0; row < 50; row++) {
      for (let col = 0; col < MAX_COLS; col++) {
        if (!occupied.has(`${col},${row}`)) {
          return { mapX: col, mapY: row };
        }
      }
    }
    // Fallback: append after last
    return { mapX: 0, mapY: existing.length };
  },

  /**
   * Update a room's position on the floor map (admin only).
   * @param {string} id
   * @param {{ floor?: string, building?: string, mapX?: number, mapY?: number }} mapData
   */
  async updateMapPosition(id, mapData) {
    return prisma.room.update({
      where: { id },
      data: mapData,
    });
  },

  /**
   * Add a room to user's favorites.
   * @param {string} userId
   * @param {string} roomId
   */
  async favoriteRoom(userId, roomId) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        favoriteRooms: {
          connect: { id: roomId },
        },
      },
    });
  },

  /**
   * Remove a room from user's favorites.
   * @param {string} userId
   * @param {string} roomId
   */
  async unfavoriteRoom(userId, roomId) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        favoriteRooms: {
          disconnect: { id: roomId },
        },
      },
    });
  },

  /**
   * Get settings (e.g. columns/rows count) for a specific floor of a building.
   * @param {string} building
   * @param {string} floor
   */
  async getFloorSetting(building, floor) {
    if (!building || !floor) return { cols: 4, rows: 4 };
    const setting = await prisma.floorSetting.findUnique({
      where: {
        building_floor: { building, floor }
      }
    });
    return setting || { cols: 4, rows: 4 };
  },

  /**
   * Create or update settings (e.g. columns/rows count) for a specific floor.
   * @param {string} building
   * @param {string} floor
   * @param {object} data
   */
  async upsertFloorSetting(building, floor, data) {
    const updateData = {};
    if (data.cols !== undefined) updateData.cols = data.cols;
    if (data.rows !== undefined) updateData.rows = data.rows;

    return prisma.floorSetting.upsert({
      where: {
        building_floor: { building, floor }
      },
      update: updateData,
      create: {
        building,
        floor,
        cols: data.cols !== undefined ? data.cols : 4,
        rows: data.rows !== undefined ? data.rows : 4,
      }
    });
  },
};

module.exports = roomRepository;
