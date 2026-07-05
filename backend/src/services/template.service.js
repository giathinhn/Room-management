const templateRepository = require('../repositories/template.repository');
const roomRepository = require('../repositories/room.repository');
const ApiError = require('../utils/ApiError');

/** Maximum templates per user */
const MAX_TEMPLATES = 10;

/**
 * Convert a "HH:mm" string into a DateTime stored as Time-only in the DB.
 * Prisma @db.Time stores it as a DateTime with date 1970-01-01.
 * @param {string} timeStr  e.g. "09:30"
 * @returns {Date}
 */
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(1970, 0, 1, hours, minutes, 0, 0);
  return d;
}

/**
 * Template service — business logic for booking templates.
 */
const templateService = {
  /**
   * Get all templates belonging to a user.
   * @param {string} userId
   */
  async getByUser(userId) {
    return templateRepository.findByUserId(userId);
  },

  /**
   * Create a new template.
   * Checks: limit (≤10), roomId validity if provided.
   *
   * @param {string} userId
   * @param {{ name, roomId?, title, startTime, endTime }} data  (startTime/endTime as HH:mm)
   */
  async create(userId, data) {
    // 1. Check limit
    const count = await templateRepository.countByUserId(userId);
    if (count >= MAX_TEMPLATES) {
      throw ApiError.badRequest('TEMPLATE_LIMIT_REACHED');
    }

    // 2. Validate roomId if provided
    const roomId = data.roomId && data.roomId !== '' ? data.roomId : null;
    if (roomId) {
      const room = await roomRepository.findById(roomId);
      if (!room || !room.isActive) {
        throw ApiError.notFound('ROOM_NOT_FOUND');
      }
    }

    // 3. Parse times
    const startTimeParsed = parseTime(data.startTime);
    const endTimeParsed = parseTime(data.endTime);

    // 4. Validate time range
    if (startTimeParsed >= endTimeParsed) {
      throw ApiError.badRequest('VALIDATION_ERROR');
    }

    return templateRepository.create({
      userId,
      name: data.name,
      roomId,
      title: data.title,
      startTime: startTimeParsed,
      endTime: endTimeParsed,
    });
  },

  /**
   * Update an existing template.
   * Checks: ownership, roomId validity if changing.
   *
   * @param {string} id
   * @param {string} userId
   * @param {{ name?, roomId?, title?, startTime?, endTime? }} data
   */
  async update(id, userId, data) {
    // 1. Check ownership
    const template = await templateRepository.findById(id);
    if (!template) {
      throw ApiError.notFound('TEMPLATE_NOT_FOUND');
    }
    if (template.userId !== userId) {
      throw ApiError.forbidden('FORBIDDEN');
    }

    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.title !== undefined) updateData.title = data.title;

    // roomId: allow null (remove room link), or new UUID
    if ('roomId' in data) {
      const roomId = data.roomId && data.roomId !== '' ? data.roomId : null;
      if (roomId) {
        const room = await roomRepository.findById(roomId);
        if (!room || !room.isActive) {
          throw ApiError.notFound('ROOM_NOT_FOUND');
        }
      }
      updateData.roomId = roomId;
    }

    if (data.startTime !== undefined) updateData.startTime = parseTime(data.startTime);
    if (data.endTime !== undefined) updateData.endTime = parseTime(data.endTime);

    // Validate new time range if both are changing
    const newStart = updateData.startTime || template.startTime;
    const newEnd = updateData.endTime || template.endTime;
    if (newStart >= newEnd) {
      throw ApiError.badRequest('VALIDATION_ERROR');
    }

    return templateRepository.update(id, updateData);
  },

  /**
   * Delete a template by ID.
   * Checks: ownership.
   *
   * @param {string} id
   * @param {string} userId
   */
  async delete(id, userId) {
    const template = await templateRepository.findById(id);
    if (!template) {
      throw ApiError.notFound('TEMPLATE_NOT_FOUND');
    }
    if (template.userId !== userId) {
      throw ApiError.forbidden('FORBIDDEN');
    }
    return templateRepository.delete(id);
  },

  /**
   * Create a template automatically from an existing booking.
   * @param {string} userId
   * @param {{ roomId, title, startTime, endTime }} booking  (full DateTime objects)
   * @param {string} name  template name supplied by user
   */
  async createFromBooking(userId, booking, name) {
    const count = await templateRepository.countByUserId(userId);
    if (count >= MAX_TEMPLATES) {
      throw ApiError.badRequest('TEMPLATE_LIMIT_REACHED');
    }

    // Extract HH:mm from booking DateTime
    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);
    const startHH = String(startDate.getHours()).padStart(2, '0');
    const startMM = String(startDate.getMinutes()).padStart(2, '0');
    const endHH = String(endDate.getHours()).padStart(2, '0');
    const endMM = String(endDate.getMinutes()).padStart(2, '0');

    return templateRepository.create({
      userId,
      name,
      roomId: booking.roomId || null,
      title: booking.title,
      startTime: parseTime(`${startHH}:${startMM}`),
      endTime: parseTime(`${endHH}:${endMM}`),
    });
  },
};

module.exports = templateService;
