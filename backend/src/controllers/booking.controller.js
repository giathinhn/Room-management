const bookingService = require('../services/booking.service');
const { createBookingSchema, rejectBookingSchema, queryBookingSchema } = require('../validators/booking.validator');
const { validate } = require('../middlewares/validate.middleware');

/**
 * Booking controller — handles HTTP request/response for booking endpoints.
 */
const bookingController = {
  /**
   * POST /api/bookings
   * Create a new booking.
   */
  async create(req, res, next) {
    try {
      // Validate body
      const parsed = createBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const booking = await bookingService.create(req.user.id, parsed.data);
      return res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: booking,
      });
    } catch (err) {
      if (err.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: err.message,
          conflicts: err.conflicts || [],
        });
      }
      next(err);
    }
  },

  /**
   * GET /api/bookings
   * Get list of bookings with filters and pagination.
   */
  async getAll(req, res, next) {
    try {
      const parsed = queryBookingSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const result = await bookingService.getAll(parsed.data, req.user);
      return res.json({
        success: true,
        data: result.bookings,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/bookings/:id
   * Get a single booking by ID.
   */
  async getById(req, res, next) {
    try {
      const booking = await bookingService.getById(req.params.id, req.user);
      return res.json({
        success: true,
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/bookings/:id/approve
   * Approve a pending booking. (approver/admin only)
   */
  async approve(req, res, next) {
    try {
      const booking = await bookingService.approve(req.params.id, req.user.id);
      return res.json({
        success: true,
        message: 'Booking approved successfully',
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/bookings/:id/reject
   * Reject a pending booking with a reason. (approver/admin only)
   */
  async reject(req, res, next) {
    try {
      const parsed = rejectBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const booking = await bookingService.reject(
        req.params.id,
        req.user.id,
        parsed.data.rejectionReason
      );
      return res.json({
        success: true,
        message: 'Booking rejected',
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/bookings/:id/cancel
   * Cancel a booking. (owner or admin)
   */
  async cancel(req, res, next) {
    try {
      const booking = await bookingService.cancel(req.params.id, req.user);
      return res.json({
        success: true,
        message: 'Booking cancelled',
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = bookingController;
