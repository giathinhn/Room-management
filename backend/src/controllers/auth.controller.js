const authService = require('../services/auth.service');

/**
 * Auth controller — thin layer that delegates to authService and formats responses.
 */
const authController = {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/auth/logout
   * Requires authenticate middleware — refresh token is in body.
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      return res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = authController;
