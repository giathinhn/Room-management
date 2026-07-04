const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

const settingsService = {
  /**
   * Get user settings, lazy-creating them if they don't exist yet.
   * @param {string} userId
   */
  async getUserSettings(userId) {
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId }
      });
    }
    return settings;
  },

  /**
   * Update user settings.
   * @param {string} userId
   * @param {object} data
   */
  async updateUserSettings(userId, data) {
    const allowedFields = [
      'emailNotifyApproved', 'emailNotifyRejected', 'emailNotifyCancelled', 'emailNotifyReminder',
      'inAppNotifyApproved', 'inAppNotifyRejected', 'inAppNotifyCancelled', 'inAppNotifyReminder',
      'language', 'theme', 'defaultCalendarView'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // Ensure settings exist first (lazy-create if necessary)
    await this.getUserSettings(userId);

    return prisma.userSettings.update({
      where: { userId },
      data: updateData
    });
  },

  /**
   * Get global system settings.
   */
  async getSystemSettings() {
    let settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 1,
          workHourStart: '07:00',
          workHourEnd: '22:00',
          maxBookingDaysAhead: 30,
          minBookingDurationMin: 30,
          maxBookingDurationMin: 480,
          noShowReleaseTimeMin: 15,
          allowCancelApproved: true
        }
      });
    }
    return settings;
  },

  /**
   * Update global system settings.
   * @param {object} data
   */
  async updateSystemSettings(data) {
    const allowedFields = [
      'workHourStart', 'workHourEnd', 'maxBookingDaysAhead',
      'minBookingDurationMin', 'maxBookingDurationMin', 'noShowReleaseTimeMin',
      'allowCancelApproved'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // Validate time formats (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (updateData.workHourStart && !timeRegex.test(updateData.workHourStart)) {
      throw ApiError.badRequest('Giờ bắt đầu làm việc không đúng định dạng HH:MM');
    }
    if (updateData.workHourEnd && !timeRegex.test(updateData.workHourEnd)) {
      throw ApiError.badRequest('Giờ kết thúc làm việc không đúng định dạng HH:MM');
    }

    // Ensure system settings record exists
    await this.getSystemSettings();

    return prisma.systemSettings.update({
      where: { id: 1 },
      data: updateData
    });
  }
};

module.exports = settingsService;
