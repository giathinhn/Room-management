const bookingService = require('../services/booking.service');
const recurringService = require('../services/recurring.service');
const { createBookingSchema, rejectBookingSchema, queryBookingSchema } = require('../validators/booking.validator');
const { createRecurringSchema } = require('../validators/recurring.validator');

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
          errors: (parsed.error.errors || parsed.error.issues || []).map((e) => ({
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
          errors: (parsed.error.errors || parsed.error.issues || []).map((e) => ({
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
          errors: (parsed.error.errors || parsed.error.issues || []).map((e) => ({
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

  // ──────────────────────────────────────────────────────────────────────────
  // RECURRING BOOKING ENDPOINTS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/bookings/recurring/preview
   * Preview recurring slots — returns okSlots and conflictSlots without saving.
   */
  async previewRecurring(req, res, next) {
    try {
      const parsed = createRecurringSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: (parsed.error.errors || parsed.error.issues || []).map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const result = await recurringService.preview(req.user.id, parsed.data);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/bookings/recurring
   * Confirm and create a recurring booking series.
   */
  async createRecurring(req, res, next) {
    try {
      const parsed = createRecurringSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: (parsed.error.errors || parsed.error.issues || []).map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const result = await recurringService.create(req.user.id, parsed.data);
      return res.status(201).json({
        success: true,
        message: `Recurring booking created: ${result.bookings.length} bookings`,
        data: result,
      });
    } catch (err) {
      if (err.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  },

  /**
   * DELETE /api/bookings/recurring/:id
   * Cancel all pending/approved bookings in a recurring series.
   */
  async cancelRecurring(req, res, next) {
    try {
      const result = await recurringService.cancelAll(req.params.id, req.user);
      return res.json({
        success: true,
        message: result.message,
        cancelledCount: result.cancelledCount,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/bookings/recurring
   * Get all recurring series for the current user.
   */
  async getMyRecurring(req, res, next) {
    try {
      const series = await recurringService.getByUser(req.user.id);
      return res.json({
        success: true,
        data: series,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/bookings/calendar
   * Return bookings within a date range formatted for FullCalendar.
   * Query params: start (ISO), end (ISO), roomId? (optional UUID)
   */
  async getCalendarEvents(req, res, next) {
    try {
      const { start, end, roomId } = req.query;

      if (!start || !end) {
        return res.status(400).json({
          success: false,
          message: 'Query params "start" and "end" are required.',
        });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid "start" or "end" date format.',
        });
      }

      const bookingRepository = require('../repositories/booking.repository');
      const bookings = await bookingRepository.findByDateRange(
        startDate,
        endDate,
        roomId || undefined
      );

      // Map to FullCalendar event format
      const events = bookings.map((b) => ({
        id: b.id,
        title: b.title,
        start: b.startTime,
        end: b.endTime,
        status: b.status,
        roomId: b.room?.id,
        roomName: b.room?.name,
        userId: b.user?.id,
        userName: b.user?.fullName,
        isRecurring: !!b.recurring,
      }));

      return res.json({
        success: true,
        data: events,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/bookings/:id/check-in
   * Check in to a booking.
   */
  async checkIn(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const booking = await bookingService.checkIn(id, userId, userRole);
      return res.json({
        success: true,
        message: 'Check-in phòng họp thành công',
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = bookingController;
