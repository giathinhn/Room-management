const express = require('express');
const profileController = require('../controllers/profile.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../validators/auth.validator');
const { uploadAvatar } = require('../middlewares/upload.middleware');

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

/**
 * POST /api/profile/avatar
 * Upload a profile avatar.
 */
router.post('/avatar', uploadAvatar.single('avatar'), profileController.uploadAvatar);

/**
 * GET /api/profile/stats
 * Get personal booking statistics.
 */
router.get('/stats', profileController.getStats);

module.exports = router;
