import api from './api';

/**
 * User management service — wraps all /api/users endpoints (admin only).
 */
const userService = {
  /**
   * Get paginated list of users with optional filters.
   * @param {{ page?: number, limit?: number, role?: string, search?: string, isActive?: boolean }} params
   */
  async getUsers(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      searchParams.append(key, value);
    });
    const { data } = await api.get(`/users?${searchParams.toString()}`);
    return data;
  },

  /**
   * Get a single user by ID.
   * @param {string} id
   */
  async getUserById(id) {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  /**
   * Update a user's role.
   * @param {string} id
   * @param {'admin' | 'approver' | 'user'} role
   */
  async updateUserRole(id, role) {
    const { data } = await api.patch(`/users/${id}/role`, { role });
    return data;
  },

  /**
   * Update a user's information (fullName, isActive).
   * @param {string} id
   * @param {{ fullName?: string, isActive?: boolean }} userData
   */
  async updateUser(id, userData) {
    const { data } = await api.patch(`/users/${id}`, userData);
    return data;
  },
};

export default userService;
