const express = require('express');
const exportController = require('../controllers/export.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize    = require('../middlewares/role.middleware');

const router = express.Router();

/**
 * GET /api/export/bookings
 * Download booking list as .xlsx — admin and approver only.
 *
 * Query params:
 *   roomId?    — filter by room
 *   status?    — filter by status (pending|approved|rejected|cancelled)
 *   startDate? — from date (YYYY-MM-DD)
 *   endDate?   — to   date (YYYY-MM-DD)
 *   userId?    — filter by booker (admin only — ignored for approvers)
 */
router.get(
  '/bookings',
  authenticate,
  authorize('admin', 'approver'),
  exportController.exportBookings
);

module.exports = router;
