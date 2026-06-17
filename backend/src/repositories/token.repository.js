const prisma = require('../config/database');

/**
 * Token repository — manages refresh tokens in the database.
 */
const tokenRepository = {
  /**
   * Save a new refresh token.
   * @param {string} userId
   * @param {string} token
   * @param {Date}   expiresAt
   */
  async create(userId, token, expiresAt) {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  },

  /**
   * Find a refresh token record by token string.
   * @param {string} token
   */
  async findByToken(token) {
    return prisma.refreshToken.findFirst({ where: { token } });
  },

  /**
   * Revoke all refresh tokens belonging to a user.
   * @param {string} userId
   */
  async revokeByUserId(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  },

  /**
   * Revoke a single refresh token by token string.
   * @param {string} token
   */
  async revokeByToken(token) {
    return prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  },
};

module.exports = tokenRepository;
