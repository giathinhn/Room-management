const express = require('express');
const profileController = require('../controllers/profile.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../validators/auth.validator');

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

/**
 * GET /api/profile
 * Get the profile of the currently authenticated user.
 */
router.get('/', profileController.getProfile);

/**
 * PUT /api/profile
 * Update the authenticated user's full name.
 * Body: { fullName }
 */
router.put('/', validate(updateProfileSchema), profileController.updateProfile);

/**
 * PUT /api/profile/password
 * Change the authenticated user's password.
 * Body: { currentPassword, newPassword }
 */
router.put('/password', validate(changePasswordSchema), profileController.changePassword);

module.exports = router;
