import api from './api';

/**
 * Floor Map API service — wraps floor map endpoints.
 */
const floorMapService = {
  /**
   * Get list of unique buildings that have rooms on the map.
   * @returns {Promise<string[]>}
   */
  async getBuildings() {
    const { data } = await api.get('/rooms/buildings');
    return data.data;
  },

  /**
   * Get list of unique floors, optionally filtered by building.
   * @param {string|null} building
   * @returns {Promise<string[]>}
   */
  async getFloors(building = null) {
    const params = building ? { building } : {};
    const { data } = await api.get('/rooms/floors', { params });
    return data.data;
  },

  /**
   * Get all rooms with real-time booking status for the floor map.
   * @param {string|null} floor
   * @param {string|null} building
   * @returns {Promise<Array>}
   */
  async getFloorMap(floor = null, building = null) {
    const params = {};
    if (floor) params.floor = floor;
    if (building) params.building = building;
    const { data } = await api.get('/rooms/floor-map', { params });
    return data.data;
  },

  /**
   * Update a room's grid position on the floor map (admin only).
   * @param {string} roomId
   * @param {{ floor?: string, building?: string, mapX?: number, mapY?: number }} mapData
   */
  async updateMapPosition(roomId, mapData) {
    const { data } = await api.put(`/rooms/${roomId}/map-position`, mapData);
    return data.data;
  },
};

export default floorMapService;
