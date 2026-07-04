const settingsService = require('../services/settings.service');

const settingsController = {
  async getUserSettings(req, res, next) {
    try {
      const settings = await settingsService.getUserSettings(req.user.id);
      return res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  async updateUserSettings(req, res, next) {
    try {
      const settings = await settingsService.updateUserSettings(req.user.id, req.body);
      return res.json({ success: true, message: 'Cập nhật cài đặt thành công', data: settings });
    } catch (err) {
      next(err);
    }
  },

  async getSystemSettings(req, res, next) {
    try {
      const settings = await settingsService.getSystemSettings();
      return res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  async updateSystemSettings(req, res, next) {
    try {
      const settings = await settingsService.updateSystemSettings(req.body);
      return res.json({ success: true, message: 'Cập nhật cấu hình hệ thống thành công', data: settings });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = settingsController;
