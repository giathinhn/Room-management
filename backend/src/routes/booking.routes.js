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
