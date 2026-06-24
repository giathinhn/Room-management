const bookingRepository = require('../repositories/booking.repository');
const roomRepository = require('../repositories/room.repository');
const emailService = require('./email.service');
const logger = require('../utils/logger');

// ─── Constants ────────────────────────────────────────────────────────────────
const BUSINESS_HOUR_START = 7;   // 07:00
const BUSINESS_HOUR_END = 22;    // 22:00
const MIN_DURATION_MS = 30 * 60 * 1000;       // 30 minutes
const MAX_DURATION_MS = 8 * 60 * 60 * 1000;   // 8 hours
const MAX_ADVANCE_DAYS = 30;
const PAST_TOLERANCE_MS = 5 * 60 * 1000;       // 5 minutes grace period

/**
 * Booking service — business logic for the booking system.
 */
const bookingService = {
  /**
   * Create a new booking.
   * Validates business rules, checks for conflicts, then persists.
   *
   * @param {string} userId
   * @param {{ roomId, title, startTime, endTime }} data
   */
  async create(userId, data) {
    const { roomId, title, startTime: startTimeStr, endTime: endTimeStr } = data;

    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);
    const now = new Date();

    // 1. startTime < endTime
    if (startTime >= endTime) {
      const err = new Error('Start time must be before end time');
      err.statusCode = 400;
      throw err;
    }

    // 2. startTime not in the past (allow 5-min grace)
    if (startTime < new Date(now - PAST_TOLERANCE_MS)) {
      const err = new Error('Cannot book in the past');
      err.statusCode = 400;
      throw err;
    }

    // 3. Within business hours (07:00 – 22:00)
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    if (startHour < BUSINESS_HOUR_START || endHour > BUSINESS_HOUR_END) {
      const err = new Error('Booking must be between 07:00 and 22:00');
      err.statusCode = 400;
      throw err;
    }

    // 4. Minimum duration: 30 minutes
    const durationMs = endTime - startTime;
    if (durationMs < MIN_DURATION_MS) {
      const err = new Error('Minimum duration is 30 minutes');
      err.statusCode = 400;
      throw err;
    }

    // 5. Maximum duration: 8 hours
    if (durationMs > MAX_DURATION_MS) {
      const err = new Error('Maximum duration is 8 hours');
      err.statusCode = 400;
      throw err;
    }

    // 6. Cannot book more than 30 days in advance
    const maxAdvanceDate = new Date(now);
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + MAX_ADVANCE_DAYS);
    if (startTime > maxAdvanceDate) {
      const err = new Error('Cannot book more than 30 days in advance');
      err.statusCode = 400;
      throw err;
    }

    // 7. Check room exists and is active
    const room = await roomRepository.findById(roomId);
    if (!room) {
      const err = new Error('Room not found');
      err.statusCode = 404;
      throw err;
    }
    if (!room.isActive) {
      const err = new Error('Room is not available');
      err.statusCode = 400;
      throw err;
    }

    // 8. Check for overlapping bookings (CRITICAL)
    const conflicts = await bookingRepository.findOverlapping(roomId, startTime, endTime);
    if (conflicts.length > 0) {
      const err = new Error('Time slot conflicts with existing bookings');
      err.statusCode = 409;
      err.conflicts = conflicts;
      throw err;
    }

    // 9. Create the booking with status=pending
    const booking = await bookingRepository.create({
      userId,
      roomId,
      title,
      startTime,
      endTime,
      status: 'pending',
    });

    // 10. Notify approvers about new pending booking (fire-and-forget)
    emailService
      .sendNewBookingNotification(booking)
      .catch((err) => logger.error('[BookingService] Failed to send new booking notification:', err.message));

    return booking;
  },

  /**
   * Get list of bookings with filters.
   * User (role=user) only sees their own bookings.
   * Approver and Admin see all bookings.
   *
   * @param {object} filters
   * @param {{ id, role }} requestingUser
   */
  async getAll(filters, requestingUser) {
    const { role, id: userId } = requestingUser;

    // Restrict regular users to only their own bookings
    if (role === 'user') {
      filters = { ...filters, userId };
    }

    const { page, limit, ...rest } = filters;
    return bookingRepository.findAll({
      ...rest,
      page: page || 1,
      limit: limit || 10,
    });
  },

  /**
   * Get a single booking by ID.
   * Access: owner, approver, or admin.
   *
   * @param {string} id
   * @param {{ id, role }} requestingUser
   */
  async getById(id, requestingUser) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const { role, id: userId } = requestingUser;
    const isOwner = booking.userId === userId;
    const canView = isOwner || role === 'approver' || role === 'admin';

    if (!canView) {
      const err = new Error('Insufficient permissions');
      err.statusCode = 403;
      throw err;
    }

    return booking;
  },

  /**
   * Approve a pending booking.
   *
   * @param {string} id — booking id
   * @param {string} approverId — user performing the action
   */
  async approve(id, approverId) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    if (booking.status !== 'pending') {
      const err = new Error('Can only approve pending bookings');
      err.statusCode = 400;
      throw err;
    }

    const updatedBooking = await bookingRepository.updateStatus(id, 'approved', {
      approvedBy: approverId,
      approvedAt: new Date(),
    });

    // Notify booker of approval (fire-and-forget)
    emailService
      .sendBookingApproved(updatedBooking)
      .catch((err) => logger.error('[BookingService] Failed to send approval email:', err.message));

    return updatedBooking;
  },

  /**
   * Reject a pending booking.
   *
   * @param {string} id — booking id
   * @param {string} approverId — user performing the action
   * @param {string} rejectionReason
   */
  async reject(id, approverId, rejectionReason) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    if (booking.status !== 'pending') {
      const err = new Error('Can only reject pending bookings');
      err.statusCode = 400;
      throw err;
    }

    const updatedBooking = await bookingRepository.updateStatus(id, 'rejected', {
      approvedBy: approverId,
      approvedAt: new Date(),
      rejectionReason,
    });

    // Notify booker of rejection (fire-and-forget)
    emailService
      .sendBookingRejected(updatedBooking)
      .catch((err) => logger.error('[BookingService] Failed to send rejection email:', err.message));

    return updatedBooking;
  },

  /**
   * Cancel a booking.
   * Access: booking owner or admin. Status must be pending or approved.
   *
   * @param {string} id — booking id
   * @param {{ id, role }} requestingUser
   */
  async cancel(id, requestingUser) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const { role, id: userId } = requestingUser;
    const isOwner = booking.userId === userId;
    const isAdmin = role === 'admin';

    if (!isOwner && !isAdmin) {
      const err = new Error('You can only cancel your own bookings');
      err.statusCode = 403;
      throw err;
    }

    if (!['pending', 'approved'].includes(booking.status)) {
      const err = new Error('Can only cancel pending or approved bookings');
      err.statusCode = 400;
      throw err;
    }

    const updatedBooking = await bookingRepository.updateStatus(id, 'cancelled');

    // Notify booker of cancellation (fire-and-forget)
    emailService
      .sendBookingCancelled(updatedBooking)
      .catch((err) => logger.error('[BookingService] Failed to send cancellation email:', err.message));

    return updatedBooking;
  },
};

module.exports = bookingService;
