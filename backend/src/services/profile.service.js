const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');

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
   * Update the user's full name.
   * @param {string} userId
   * @param {string} fullName
   */
  async updateProfile(userId, { fullName }) {
    const user = await userRepository.update(userId, { fullName });
    if (!user) throw ApiError.notFound('User not found');
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
};

module.exports = profileService;
