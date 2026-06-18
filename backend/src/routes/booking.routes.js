const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/booking.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * Booking routes.
 * Base path: /api/bookings
 */

// List all bookings (role-filtered in service)
router.get('/', authenticate, bookingController.getAll);

// ── Recurring booking routes (must come BEFORE /:id routes) ──────────────────
// Get current user's recurring series
router.get('/recurring', authenticate, bookingController.getMyRecurring);

// Preview slots without saving
router.post('/recurring/preview', authenticate, bookingController.previewRecurring);

// Confirm and create recurring series
router.post('/recurring', authenticate, bookingController.createRecurring);

// Cancel all bookings in a recurring series
router.delete('/recurring/:id', authenticate, bookingController.cancelRecurring);

// ── Single booking routes ─────────────────────────────────────────────────────
// Get single booking
router.get('/:id', authenticate, bookingController.getById);

// Create new booking
router.post('/', authenticate, bookingController.create);

// Approve a pending booking (approver / admin only)
router.patch('/:id/approve', authenticate, authorize('admin', 'approver'), bookingController.approve);

// Reject a pending booking (approver / admin only)
router.patch('/:id/reject', authenticate, authorize('admin', 'approver'), bookingController.reject);

// Cancel a booking (owner or admin — enforced in service)
router.patch('/:id/cancel', authenticate, bookingController.cancel);

module.exports = router;
