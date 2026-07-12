import api from './api';

/**
 * Room API service — wraps all /api/rooms endpoints.
 */
const roomService = {
  /**
   * Get paginated list of rooms with optional filters.
   * @param {{ page?: number, limit?: number, capacity?: number, location?: string, equipment?: string[], search?: string }} params
   */
  async getRooms(params = {}) {
    // Flatten equipment array to repeated query params
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    });

    const { data } = await api.get(`/rooms?${searchParams.toString()}`);
    return data;
  },

  /**
   * Get a single room by ID.
   * @param {string} id
   */
  async getRoom(id) {
    const { data } = await api.get(`/rooms/${id}`);
    return data;
  },

  /**
   * Create a new room (admin only).
   * @param {{ name: string, capacity: number, location: string, equipment: string[] }} roomData
   */
  async createRoom(roomData) {
    const { data } = await api.post('/rooms', roomData);
    return data;
  },

  /**
   * Update an existing room (admin only).
   * @param {string} id
   * @param {object} roomData
   */
  async updateRoom(id, roomData) {
    const { data } = await api.put(`/rooms/${id}`, roomData);
    return data;
  },

  /**
   * Soft-delete a room (admin only).
   * @param {string} id
   */
  async deleteRoom(id) {
    const { data } = await api.delete(`/rooms/${id}`);
    return data;
  },

  /**
   * Get rooms available during a given time window.
   * @param {{ startTime: string, endTime: string, capacity?: number, equipment?: string[] }} params
   */
  async getAvailableRooms(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    });

    const { data } = await api.get(`/rooms/available?${searchParams.toString()}`);
    return data;
  },

  /**
   * Favorite a room.
   * @param {string} roomId
   */
  async favoriteRoom(roomId) {
    const { data } = await api.post(`/rooms/${roomId}/favorite`);
    return data;
  },

  /**
   * Unfavorite a room.
   * @param {string} roomId
   */
  async unfavoriteRoom(roomId) {
    const { data } = await api.delete(`/rooms/${roomId}/favorite`);
    return data;
  },

  /**
   * Bulk toggle auto-approve setting for all rooms (admin only).
   * @param {boolean} autoApprove
   */
  async bulkUpdateAutoApprove(autoApprove) {
    const { data } = await api.put('/rooms/bulk-auto-approve', { autoApprove });
    return data;
  },
};

export default roomService;
