const roomRepository = require('../repositories/room.repository');
const ApiError = require('../utils/ApiError');
const sseManager = require('../utils/sseManager');
const {
  createRoomSchema,
  updateRoomSchema,
  queryRoomSchema,
  availableRoomSchema,
} = require('../validators/room.validator');



// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Room service — business logic layer.
 */
const roomService = {
  /**
   * Get paginated list of rooms with optional filters.
   * Non-admin users only see active rooms.
   *
   * @param {object} rawQuery — raw query parameters from request
   * @param {{ role: string }} user  — authenticated user
   */
  async getAll(rawQuery, user) {
    const parsed = queryRoomSchema.safeParse(rawQuery);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.errors[0].message);
    }

    const filters = parsed.data;

    // Non-admin users can only see active rooms
    if (user.role !== 'admin') {
      filters.isActive = true;
    }

    const result = await roomRepository.findAll({
      ...filters,
      userId: user?.id,
    });
    return result;
  },

  /**
   * Get a single room by ID.
   * @param {string} id
   */
  async getById(id, user) {
    const room = await roomRepository.findById(id, user?.id);
    if (!room) {
      throw ApiError.notFound('ROOM_NOT_FOUND');
    }
    return room;
  },

  /**
   * Create a new room (admin only).
   * Automatically parses floor & building from location, then assigns
   * a grid position on the floor map.
   * @param {object} body — request body
   */
  async create(body) {
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.errors[0].message);
    }

    const { name, capacity, location, floor, building, equipment } = parsed.data;

    // Check for duplicate room name
    const existing = await roomRepository.findByName(name);
    if (existing) {
      throw ApiError.conflict('ROOM_NAME_EXISTS');
    }

    const finalBuilding = building.toUpperCase();
    const finalLocation = location ? location.trim() : `Tang ${floor}, Toa ${finalBuilding}`;

    let mapX = null;
    let mapY = null;
    if (floor && finalBuilding) {
      const pos = await roomRepository.autoAssignGridPosition(floor, finalBuilding);
      mapX = pos.mapX;
      mapY = pos.mapY;
    }

    const room = await roomRepository.create({
      name,
      capacity,
      location: finalLocation,
      equipment,
      floor,
      building: finalBuilding,
      mapX,
      mapY,
    });

    sseManager.broadcast({ event: 'rooms_changed', data: { roomId: room.id, action: 'create' } });

    return room;
  },

  /**
   * Update an existing room (admin only).
   * @param {string} id
   * @param {object} body — request body
   */
  async update(id, body) {
    const parsed = updateRoomSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.errors[0].message);
    }

    const room = await roomRepository.findById(id);
    if (!room) {
      throw ApiError.notFound('ROOM_NOT_FOUND');
    }

    // If name is changing, check for duplicates
    if (parsed.data.name && parsed.data.name !== room.name) {
      const existingName = await roomRepository.findByName(parsed.data.name, id);
      if (existingName) {
        throw ApiError.conflict('ROOM_NAME_EXISTS');
      }
    }

    // Resolve final floor/building
    const finalFloor = parsed.data.floor !== undefined ? parsed.data.floor : room.floor;
    let finalBuilding = parsed.data.building !== undefined ? parsed.data.building : room.building;
    if (finalBuilding) finalBuilding = finalBuilding.toUpperCase();

    // Resolve final location (construct if empty or if building/floor changed while location wasn't explicitly updated)
    let finalLocation = parsed.data.location !== undefined ? parsed.data.location : room.location;
    
    const floorChanged = parsed.data.floor !== undefined && parsed.data.floor !== room.floor;
    const buildingChanged = parsed.data.building !== undefined && parsed.data.building !== room.building;

    if (parsed.data.location === undefined && (floorChanged || buildingChanged)) {
      const oldDefaultPattern = `Tang ${room.floor}, Toa ${room.building}`;
      if (room.location === oldDefaultPattern || !room.location) {
        finalLocation = `Tang ${finalFloor}, Toa ${finalBuilding}`;
      }
    }

    const extraFields = {
      location: finalLocation,
    };

    if (finalFloor !== room.floor || finalBuilding !== room.building) {
      extraFields.floor = finalFloor;
      extraFields.building = finalBuilding;

      if (finalFloor && finalBuilding) {
        const pos = await roomRepository.autoAssignGridPosition(finalFloor, finalBuilding);
        extraFields.mapX = pos.mapX;
        extraFields.mapY = pos.mapY;
      }
    }

    const updated = await roomRepository.update(id, { ...parsed.data, ...extraFields });

    sseManager.broadcast({ event: 'rooms_changed', data: { roomId: id, action: 'update' } });

    return updated;
  },

  /**
   * Soft-delete a room (admin only).
   * @param {string} id
   */
  async delete(id) {
    const room = await roomRepository.findById(id);
    if (!room) {
      throw ApiError.notFound('ROOM_NOT_FOUND');
    }

    await roomRepository.softDelete(id);

    sseManager.broadcast({ event: 'rooms_changed', data: { roomId: id, action: 'delete' } });
  },

  /**
   * Find rooms available during a given time window.
   * @param {object} rawQuery — raw query parameters from request
   */
  async findAvailable(rawQuery, user) {
    const parsed = availableRoomSchema.safeParse(rawQuery);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.errors[0].message);
    }

    const { startTime, endTime, capacity, equipment, location } = parsed.data;

    const rooms = await roomRepository.findAvailable(
      new Date(startTime),
      new Date(endTime),
      { capacity, equipment, location, userId: user?.id }
    );

    return rooms;
  },

  /**
   * Get floor map data: all rooms with real-time booking status.
   * @param {string|null} [floor]
   * @param {string|null} [building]
   */
  async getFloorMap(floor, building, user) {
    return roomRepository.findAllWithStatus(floor || undefined, building || undefined, user?.id);
  },

  /**
   * Get list of unique buildings that have rooms.
   * @returns {string[]}
   */
  async getBuildings() {
    return roomRepository.getBuildings();
  },

  /**
   * Get list of unique floors, optionally filtered by building.
   * @param {string|null} [building]
   * @returns {string[]}
   */
  async getFloors(building) {
    return roomRepository.getFloors(building || undefined);
  },

  /**
   * Update a room's position on the floor map (admin only).
   * @param {string} roomId
   * @param {{ floor?: string, building?: string, mapX?: number, mapY?: number }} mapData
   */
  async updateMapPosition(roomId, mapData) {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw ApiError.notFound('ROOM_NOT_FOUND');
    }
    return roomRepository.updateMapPosition(roomId, mapData);
  },

  /**
   * Add room to user favorites.
   * @param {string} userId
   * @param {string} roomId
   */
  async favoriteRoom(userId, roomId) {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw ApiError.notFound('ROOM_NOT_FOUND');
    }
    return roomRepository.favoriteRoom(userId, roomId);
  },

  /**
   * Remove room from user favorites.
   * @param {string} userId
   * @param {string} roomId
   */
  async unfavoriteRoom(userId, roomId) {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw ApiError.notFound('ROOM_NOT_FOUND');
    }
    return roomRepository.unfavoriteRoom(userId, roomId);
  },

  /**
   * Get settings for a floor (admin/user).
   * @param {string} building
   * @param {string} floor
   */
  async getFloorSetting(building, floor) {
    if (!building || !floor) {
      throw ApiError.badRequest('Building and floor are required');
    }
    return roomRepository.getFloorSetting(building, floor);
  },

  /**
   * Update settings (cols count) for a floor (admin only).
   * @param {string} building
   * @param {string} floor
   * @param {number} cols
   */
  async updateFloorSetting(building, floor, cols, rows) {
    if (!building || !floor) {
      throw ApiError.badRequest('Building and floor are required');
    }
    const updateData = {};
    if (cols !== undefined) {
      const colsNum = parseInt(cols, 10);
      if (isNaN(colsNum) || colsNum < 2 || colsNum > 8) {
        throw ApiError.badRequest('Columns must be a number between 2 and 8');
      }
      updateData.cols = colsNum;
    }
    if (rows !== undefined) {
      const rowsNum = parseInt(rows, 10);
      if (isNaN(rowsNum) || rowsNum < 2 || rowsNum > 20) {
        throw ApiError.badRequest('Rows must be a number between 2 and 20');
      }
      updateData.rows = rowsNum;
    }
    return roomRepository.upsertFloorSetting(building, floor, updateData);
  },
};

module.exports = roomService;
