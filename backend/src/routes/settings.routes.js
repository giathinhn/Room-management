const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Personal user settings routes
router.get('/user', authenticate, settingsController.getUserSettings);
router.put('/user', authenticate, settingsController.updateUserSettings);

// Operational system settings routes
router.get('/system', authenticate, settingsController.getSystemSettings); // Authorized users can read system settings
router.put('/system', authenticate, authorize('admin'), settingsController.updateSystemSettings); // Only admins can update system settings

module.exports = router;
