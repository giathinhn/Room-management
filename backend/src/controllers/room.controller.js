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
      const rooms = await roomService.findAvailable(req.query, req.user);
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
      const room = await roomService.getById(req.params.id, req.user);
      return res.status(200).json({ data: room });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/rooms
   * Body: { name, capacity, location, equipment }
   * Auto-populates floor, building, mapX, mapY from location.
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

  /**
   * GET /api/rooms/buildings
   * Returns list of unique buildings that have active rooms.
   */
  async getBuildings(req, res, next) {
    try {
      const buildings = await roomService.getBuildings();
      return res.status(200).json({ success: true, data: buildings });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/rooms/floors?building=A
   * Returns list of unique floors, optionally filtered by building.
   */
  async getFloors(req, res, next) {
    try {
      const { building } = req.query;
      const floors = await roomService.getFloors(building || null);
      return res.status(200).json({ success: true, data: floors });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/rooms/floor-map?floor=2&building=A
   * Returns all rooms with real-time status for the floor map view.
   */
  async getFloorMap(req, res, next) {
    try {
      const { floor, building } = req.query;
      const rooms = await roomService.getFloorMap(floor || null, building || null, req.user);
      return res.status(200).json({ success: true, data: rooms });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PUT /api/rooms/:id/map-position
   * Admin updates a room's grid position on the floor map.
   * Body: { floor?, building?, mapX?, mapY? }
   */
  async updateMapPosition(req, res, next) {
    try {
      const { id } = req.params;
      const { floor, building, mapX, mapY } = req.body;
      const room = await roomService.updateMapPosition(id, {
        ...(floor !== undefined && { floor }),
        ...(building !== undefined && { building }),
        ...(mapX !== undefined && { mapX: Number(mapX) }),
        ...(mapY !== undefined && { mapY: Number(mapY) }),
      });
      return res.status(200).json({ success: true, data: room });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/rooms/:id/favorite
   */
  async favoriteRoom(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await roomService.favoriteRoom(userId, id);
      return res.status(200).json({
        success: true,
        message: 'Đã thêm phòng họp vào danh sách yêu thích',
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * DELETE /api/rooms/:id/favorite
   */
  async unfavoriteRoom(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await roomService.unfavoriteRoom(userId, id);
      return res.status(200).json({
        success: true,
        message: 'Đã xóa phòng họp khỏi danh sách yêu thích',
      });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = roomController;
