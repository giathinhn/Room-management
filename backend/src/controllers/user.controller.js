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

      const targetUserId = req.params.id;
      const targetUser = await userRepository.findById(targetUserId);
      if (!targetUser) {
        throw ApiError.notFound('Không tìm thấy người dùng');
      }

      // Nếu đang chuyển vai trò của Admin thành vai trò khác, cần kiểm tra xem họ có phải Admin đang hoạt động duy nhất hay không
      if (targetUser.role === 'admin' && role !== 'admin' && targetUser.isActive) {
        const activeAdmins = await userRepository.findByRole('admin');
        if (activeAdmins.length <= 1) {
          throw ApiError.badRequest('Hệ thống phải có tối thiểu một quản trị viên (Admin) đang hoạt động');
        }
      }

      const user = await userRepository.updateRole(targetUserId, role);
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

      const targetUserId = req.params.id;
      const targetUser = await userRepository.findById(targetUserId);
      if (!targetUser) {
        throw ApiError.notFound('Không tìm thấy người dùng');
      }

      // Nếu đang vô hiệu hóa một Admin đang hoạt động, cần kiểm tra xem có phải Admin đang hoạt động duy nhất không
      if (isActive === false && targetUser.role === 'admin' && targetUser.isActive) {
        const activeAdmins = await userRepository.findByRole('admin');
        if (activeAdmins.length <= 1) {
          throw ApiError.badRequest('Hệ thống phải có tối thiểu một quản trị viên (Admin) đang hoạt động');
        }
      }

      const user = await userRepository.update(targetUserId, updateData);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = userController;
