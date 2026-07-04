const profileService = require('../services/profile.service');
const ApiError = require('../utils/ApiError');

/**
 * Profile controller — view and edit the authenticated user's profile.
 */
const profileController = {
  /**
   * GET /api/profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await profileService.getProfile(req.user.id);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PUT /api/profile
   */
  async updateProfile(req, res, next) {
    try {
      const user = await profileService.updateProfile(req.user.id, req.body);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PUT /api/profile/password
   */
  async changePassword(req, res, next) {
    try {
      const result = await profileService.changePassword(req.user.id, req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/profile/avatar
   */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('Vui lòng chọn ảnh để tải lên');
      }
    
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      // Cập nhật ngay vào database cho user
      const user = await profileService.updateProfile(req.user.id, { avatar: avatarUrl });

      return res.status(200).json({
        success: true,
        message: 'Tải lên ảnh đại diện thành công',
        data: {
          avatar: user.avatar
        }
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/profile/stats
   */
  async getStats(req, res, next) {
    try {
      const statsData = await profileService.getPersonalStats(req.user.id);
      return res.status(200).json({
        success: true,
        data: statsData
      });
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = profileController;
