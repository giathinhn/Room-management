const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const tokenRepository = require('../repositories/token.repository');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const SALT_ROUNDS = 12;

/**
 * Parse the JWT_REFRESH_EXPIRY string (e.g. '7d', '24h', '60m') into milliseconds.
 */
function parseExpiry(expiry) {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * (multipliers[unit] || 0);
}

/**
 * Build a safe user object to return in responses (no passwordHash).
 */
function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

const authService = {
  /**
   * Register a new user account.
   * @param {{ email: string, password: string, fullName: string }} data
   */
  async register({ email, password, fullName }) {
    // Check for duplicate email
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('Email is already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await userRepository.create({ email, passwordHash, fullName });

    // Generate tokens
    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Persist refresh token
    const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRY));
    await tokenRepository.create(user.id, refreshToken, expiresAt);

    return { user: safeUser(user), accessToken, refreshToken };
  },

  /**
   * Log in an existing user.
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRY));
    await tokenRepository.create(user.id, refreshToken, expiresAt);

    return { user: safeUser(user), accessToken, refreshToken };
  },

  /**
   * Issue a new access token using a valid refresh token.
   * @param {string} token — refresh token string
   */
  async refreshToken(token) {
    if (!token) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    const record = await tokenRepository.findByToken(token);
    if (!record) {
      throw ApiError.unauthorized('Refresh token not found');
    }
    if (record.isRevoked) {
      throw ApiError.unauthorized('Refresh token has been revoked');
    }
    if (record.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token has expired');
    }

    // Verify JWT signature
    const decoded = verifyToken(token);

    const user = await userRepository.findById(decoded.id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);

    return { accessToken };
  },

  /**
   * Log out — revoke the given refresh token.
   * @param {string} token — refresh token string
   */
  async logout(token) {
    if (!token) {
      throw ApiError.badRequest('Refresh token is required');
    }
    await tokenRepository.revokeByToken(token);
  },
};

module.exports = authService;
