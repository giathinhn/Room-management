const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');

/**
 * User controller — admin operations on users.
 */
const userController = {
  /**
   * GET /api/users
   * Query params: page, limit, role, search, isActive
   */
  async getUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, role, search, isActive } = req.query;
      const filters = {
        page: parseInt(page, 10),
        limit: Math.min(parseInt(limit, 10), 100),
        role,
        search,
        isActive: isActive === undefined ? undefined : isActive === 'true',
      };
      const result = await userRepository.findAll(filters);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const user = await userRepository.findById(req.params.id);
      if (!user) throw ApiError.notFound('User not found');
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PATCH /api/users/:id/role
   * Body: { role: 'admin' | 'approver' | 'user' }
   */
  async updateUserRole(req, res, next) {
    try {
      const { role } = req.body;
      const validRoles = ['admin', 'approver', 'user'];
      if (!validRoles.includes(role)) {
        throw ApiError.badRequest(`Role must be one of: ${validRoles.join(', ')}`);
      }
      const user = await userRepository.updateRole(req.params.id, role);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PATCH /api/users/:id
   * Body: { fullName?, isActive? }
   */
  async updateUser(req, res, next) {
    try {
      const { fullName, isActive } = req.body;
      const updateData = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      if (Object.keys(updateData).length === 0) {
        throw ApiError.badRequest('No valid fields provided for update');
      }

      const user = await userRepository.update(req.params.id, updateData);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = userController;
