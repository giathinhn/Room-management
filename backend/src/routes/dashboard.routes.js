const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// Personal stats for user/approver dashboard
router.get('/personal',   authenticate, dashboardController.getPersonalStats);

// All dashboard routes require admin role
router.get('/overview',   authenticate, authorize('admin'), dashboardController.getOverview);
router.get('/room-usage', authenticate, authorize('admin'), dashboardController.getRoomUsage);
router.get('/peak-hours', authenticate, authorize('admin'), dashboardController.getPeakHours);
router.get('/top-users',  authenticate, authorize('admin'), dashboardController.getTopUsers);
router.get('/trends',     authenticate, authorize('admin'), dashboardController.getTrends);

module.exports = router;
