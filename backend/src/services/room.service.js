const roomRepository = require('../repositories/room.repository');
const ApiError = require('../utils/ApiError');
const {
  createRoomSchema,
  updateRoomSchema,
  queryRoomSchema,
  availableRoomSchema,
} = require('../validators/room.validator');

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

    const result = await roomRepository.findAll(filters);
    return result;
  },

  /**
   * Get a single room by ID.
   * @param {string} id
   */
  async getById(id) {
    const room = await roomRepository.findById(id);
    if (!room) {
      throw ApiError.notFound('Room not found');
    }
    return room;
  },

  /**
   * Create a new room (admin only).
   * @param {object} body — request body
   */
  async create(body) {
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.errors[0].message);
    }

    const { name, capacity, location, equipment } = parsed.data;

    // Check for duplicate room name
    const existing = await roomRepository.findByName(name);
    if (existing) {
      throw ApiError.conflict('A room with this name already exists');
    }

    const room = await roomRepository.create({ name, capacity, location, equipment });
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
      throw ApiError.notFound('Room not found');
    }

    // If name is changing, check for duplicates
    if (parsed.data.name && parsed.data.name !== room.name) {
      const existing = await roomRepository.findByName(parsed.data.name, id);
      if (existing) {
        throw ApiError.conflict('A room with this name already exists');
      }
    }

    const updated = await roomRepository.update(id, parsed.data);
    return updated;
  },

  /**
   * Soft-delete a room (admin only).
   * @param {string} id
   */
  async delete(id) {
    const room = await roomRepository.findById(id);
    if (!room) {
      throw ApiError.notFound('Room not found');
    }

    await roomRepository.softDelete(id);
  },

  /**
   * Find rooms available during a given time window.
   * @param {object} rawQuery — raw query parameters from request
   */
  async findAvailable(rawQuery) {
    const parsed = availableRoomSchema.safeParse(rawQuery);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.errors[0].message);
    }

    const { startTime, endTime, capacity, equipment, location } = parsed.data;

    const rooms = await roomRepository.findAvailable(
      new Date(startTime),
      new Date(endTime),
      { capacity, equipment, location }
    );

    return rooms;
  },
};

module.exports = roomService;
