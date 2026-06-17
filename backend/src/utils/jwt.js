const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('./ApiError');

/**
 * Generate a short-lived access token.
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {string} JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY });
}

/**
 * Generate a long-lived refresh token.
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY });
}

/**
 * Verify a JWT token and return the decoded payload.
 * Throws ApiError 401 if invalid or expired.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired');
    }
    throw ApiError.unauthorized('Invalid token');
  }
}

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
