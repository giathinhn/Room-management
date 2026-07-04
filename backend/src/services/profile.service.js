const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/database');

const SALT_ROUNDS = 12;

/**
 * Profile service — handles profile viewing and updating.
 */
const profileService = {
  /**
   * Get the profile of the currently authenticated user.
   * @param {string} userId
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  /**
   * Update the user's profile.
   * @param {string} userId
   * @param {object} profileData
   */
  async updateProfile(userId, { fullName, phone, avatar, department }) {
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (department !== undefined) updateData.department = department;

    const user = await userRepository.update(userId, updateData);
    if (!user) throw ApiError.notFound('Không tìm thấy người dùng');
    return user;
  },

  /**
   * Change the user's password (requires verifying current password).
   * @param {string} userId
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    // Fetch full user record (with passwordHash)
    const userRecord = await userRepository.findByEmail(
      (await userRepository.findById(userId)).email,
    );
    if (!userRecord) throw ApiError.notFound('User not found');

    const isMatch = await bcrypt.compare(currentPassword, userRecord.passwordHash);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepository.update(userId, { passwordHash });

    return { message: 'Password changed successfully' };
  },

  /**
   * Get personal booking statistics and recent history.
   * @param {string} userId
   */
  async getPersonalStats(userId) {
    const [bookingsCount, bookings] = await Promise.all([
      // Thống kê đếm số lượng theo trạng thái
      prisma.booking.groupBy({
        by: ['status'],
        where: { userId },
        _count: true
      }),
      // Danh sách 5 booking gần nhất
      prisma.booking.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: 5,
        include: { room: true }
      })
    ]);

    // Tính tổng số giờ họp của các booking đã duyệt (approved)
    const approvedBookings = await prisma.booking.findMany({
      where: { userId, status: 'approved' },
      select: { startTime: true, endTime: true }
    });

    let totalHours = 0;
    approvedBookings.forEach(b => {
      const diffMs = new Date(b.endTime) - new Date(b.startTime);
      totalHours += diffMs / (1000 * 60 * 60);
    });

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      total: 0
    };

    bookingsCount.forEach(item => {
      stats[item.status] = item._count;
      stats.total += item._count;
    });

    return {
      stats,
      totalMeetingHours: Math.round(totalHours * 10) / 10,
      recentBookings: bookings
    };
  }
};

module.exports = profileService;

