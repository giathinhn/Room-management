const profileService = require('../services/profile.service');

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
};

module.exports = profileController;
