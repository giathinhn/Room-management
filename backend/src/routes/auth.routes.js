const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account.
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * POST /api/auth/login
 * Authenticate with email + password, receive JWT tokens.
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * POST /api/auth/refresh
 * Exchange a refresh token for a new access token.
 * Body: { refreshToken }
 */
router.post('/refresh', authController.refreshToken);

/**
 * POST /api/auth/logout
 * Revoke the supplied refresh token.
 * Body: { refreshToken }
 * Requires: valid access token (authenticate)
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
