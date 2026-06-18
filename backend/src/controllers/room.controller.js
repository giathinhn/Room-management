const roomService = require('../services/room.service');

/**
 * Room controller — thin HTTP layer that delegates to roomService.
 */
const roomController = {
  /**
   * GET /api/rooms
   * Query: page, limit, capacity, location, equipment, search
   */
  async getAll(req, res, next) {
    try {
      const result = await roomService.getAll(req.query, req.user);
      return res.status(200).json({
        data: result.rooms,
        pagination: result.pagination,
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/rooms/available
   * Query: startTime, endTime, capacity?, equipment?
   */
  async findAvailable(req, res, next) {
    try {
      const rooms = await roomService.findAvailable(req.query);
      return res.status(200).json({ data: rooms });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/rooms/:id
   */
  async getById(req, res, next) {
    try {
      const room = await roomService.getById(req.params.id);
      return res.status(200).json({ data: room });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/rooms
   * Body: { name, capacity, location, equipment }
   */
  async create(req, res, next) {
    try {
      const room = await roomService.create(req.body);
      return res.status(201).json({ data: room });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PUT /api/rooms/:id
   * Body: { name?, capacity?, location?, equipment? }
   */
  async update(req, res, next) {
    try {
      const room = await roomService.update(req.params.id, req.body);
      return res.status(200).json({ data: room });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * DELETE /api/rooms/:id
   * Soft-delete (sets isActive = false).
   */
  async delete(req, res, next) {
    try {
      await roomService.delete(req.params.id);
      return res.status(200).json({ message: 'Room deactivated' });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = roomController;
