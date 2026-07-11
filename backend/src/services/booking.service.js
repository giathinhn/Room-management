const bookingRepository = require('../repositories/booking.repository');
const roomRepository = require('../repositories/room.repository');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');
const emailService = require('./email.service');
const notificationService = require('./notification.service');
const settingsService = require('./settings.service');
const logger = require('../utils/logger');
const prisma = require('../config/database');
const sseManager = require('../utils/sseManager');

// ─── Constants ────────────────────────────────────────────────────────────────
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
      throw ApiError.badRequest('VALIDATION_ERROR');
    }

    // 2. startTime not in the past (allow 5-min grace)
    if (startTime < new Date(now - PAST_TOLERANCE_MS)) {
      throw ApiError.badRequest('BOOKING_PAST_TIME');
    }

    // Load dynamic system settings
    const sysSettings = await settingsService.getSystemSettings();
    const parseTimeToHour = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h + m / 60;
    };
    const workHourStartVal = parseTimeToHour(sysSettings.workHourStart);
    const workHourEndVal = parseTimeToHour(sysSettings.workHourEnd);

    // 3. Within business hours
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    if (startHour < workHourStartVal || endHour > workHourEndVal) {
      throw ApiError.badRequest('BOOKING_OUTSIDE_HOURS');
    }

    // 4. Minimum duration
    const durationMs = endTime - startTime;
    const minDurationMs = sysSettings.minBookingDurationMin * 60 * 1000;
    if (durationMs < minDurationMs) {
      throw ApiError.badRequest('BOOKING_TOO_SHORT');
    }

    // 5. Maximum duration
    const maxDurationMs = sysSettings.maxBookingDurationMin * 60 * 1000;
    if (durationMs > maxDurationMs) {
      throw ApiError.badRequest('BOOKING_TOO_LONG');
    }

    // 6. Cannot book too far in advance
    const maxAdvanceDate = new Date(now);
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + sysSettings.maxBookingDaysAhead);
    if (startTime > maxAdvanceDate) {
      throw ApiError.badRequest('BOOKING_TOO_FAR_AHEAD');
    }

    // 7. Check room exists and is active
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw ApiError.notFound('ROOM_NOT_FOUND');
    }
    if (!room.isActive) {
      throw ApiError.badRequest('ROOM_INACTIVE');
    }

    // 8. Check for overlapping bookings (CRITICAL)
    const conflicts = await bookingRepository.findOverlapping(roomId, startTime, endTime);
    if (conflicts.length > 0) {
      const err = ApiError.conflict('BOOKING_CONFLICT');
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

    // 11. In-app notifications: notify all approvers + admins (fire-and-forget)
    Promise.resolve().then(async () => {
      try {
        const startLabel = new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short', timeStyle: 'short',
        }).format(startTime);
        const notifyRoles = await Promise.all([
          userRepository.findByRole('approver'),
          userRepository.findByRole('admin'),
        ]);
        const recipients = [...notifyRoles[0], ...notifyRoles[1]];
        // Deduplicate by id
        const seen = new Set();
        for (const u of recipients) {
          if (seen.has(u.id)) continue;
          seen.add(u.id);
          await notificationService.createNotification(
            u.id,
            'new_booking_pending',
            'Có booking mới cần duyệt',
            `${booking.user?.fullName || 'Một người dùng'} đặt phòng ${booking.room?.name || ''} lúc ${startLabel}`,
            booking.id
          );
        }
      } catch (err) {
        logger.error('[BookingService] Failed to send in-app notifications to approvers:', err.message);
      }
    });

    sseManager.broadcast({ event: 'bookings_changed', data: { bookingId: booking.id, action: 'create' } });

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
      throw ApiError.notFound('BOOKING_NOT_FOUND');
    }

    const { role, id: userId } = requestingUser;
    const isOwner = booking.userId === userId;
    const canView = isOwner || role === 'approver' || role === 'admin';

    if (!canView) {
      throw ApiError.forbidden('FORBIDDEN');
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
      throw ApiError.notFound('BOOKING_NOT_FOUND');
    }

    if (booking.status !== 'pending') {
      throw ApiError.badRequest('BOOKING_INVALID_STATUS');
    }

    const updatedBooking = await bookingRepository.updateStatus(id, 'approved', {
      approvedBy: approverId,
      approvedAt: new Date(),
    });

    // Notify booker of approval (fire-and-forget)
    emailService
      .sendBookingApproved(updatedBooking)
      .catch((err) => logger.error('[BookingService] Failed to send approval email:', err.message));

    // In-app notification to booker (fire-and-forget)
    Promise.resolve().then(async () => {
      try {
        const startLabel = new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short', timeStyle: 'short',
        }).format(new Date(updatedBooking.startTime));
        await notificationService.createNotification(
          updatedBooking.userId,
          'booking_approved',
          'Booking đã được duyệt',
          `Phòng ${updatedBooking.room?.name || ''} lúc ${startLabel} đã được duyệt`,
          updatedBooking.id
        );
      } catch (err) {
        logger.error('[BookingService] Failed to send in-app approval notification:', err.message);
      }
    });

    sseManager.broadcast({ event: 'bookings_changed', data: { bookingId: updatedBooking.id, action: 'approve' } });

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
      throw ApiError.notFound('BOOKING_NOT_FOUND');
    }

    if (booking.status !== 'pending') {
      throw ApiError.badRequest('BOOKING_INVALID_STATUS');
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

    // In-app notification to booker (fire-and-forget)
    Promise.resolve().then(async () => {
      try {
        const startLabel = new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short', timeStyle: 'short',
        }).format(new Date(updatedBooking.startTime));
        await notificationService.createNotification(
          updatedBooking.userId,
          'booking_rejected',
          'Booking bị từ chối',
          `Phòng ${updatedBooking.room?.name || ''} lúc ${startLabel} bị từ chối. Lý do: ${rejectionReason || 'Không có lý do'}`,
          updatedBooking.id
        );
      } catch (err) {
        logger.error('[BookingService] Failed to send in-app rejection notification:', err.message);
      }
    });

    sseManager.broadcast({ event: 'bookings_changed', data: { bookingId: updatedBooking.id, action: 'reject' } });

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
      throw ApiError.notFound('BOOKING_NOT_FOUND');
    }

    const { role, id: userId } = requestingUser;
    const isOwner = booking.userId === userId;
    const isAdmin = role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('FORBIDDEN');
    }

    if (!['pending', 'approved'].includes(booking.status)) {
      throw ApiError.badRequest('BOOKING_INVALID_STATUS');
    }

    if (booking.status === 'approved' && !isAdmin) {
      const sysSettings = await settingsService.getSystemSettings();
      if (sysSettings && !sysSettings.allowCancelApproved) {
        throw ApiError.badRequest('BOOKING_INVALID_STATUS');
      }
    }

    const updatedBooking = await bookingRepository.updateStatus(id, 'cancelled');

    // Notify booker of cancellation (fire-and-forget)
    emailService
      .sendBookingCancelled(updatedBooking)
      .catch((err) => logger.error('[BookingService] Failed to send cancellation email:', err.message));

    // In-app notification: notify booker (and approvers/admins if cancelled by admin) (fire-and-forget)
    Promise.resolve().then(async () => {
      try {
        const startLabel = new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short', timeStyle: 'short',
        }).format(new Date(updatedBooking.startTime));

        // Always notify the booker
        if (updatedBooking.userId !== userId) {
          await notificationService.createNotification(
            updatedBooking.userId,
            'booking_cancelled',
            'Booking đã bị hủy',
            `Phòng ${updatedBooking.room?.name || ''} lúc ${startLabel} đã bị hủy bởi quản trị viên`,
            updatedBooking.id
          );
        }
      } catch (err) {
        logger.error('[BookingService] Failed to send in-app cancellation notification:', err.message);
      }
    });

    sseManager.broadcast({ event: 'bookings_changed', data: { bookingId: updatedBooking.id, action: 'cancel' } });

    return updatedBooking;
  },

  /**
   * Check in to a booking.
   * @param {string} bookingId
   * @param {string} userId
   * @param {string} userRole
   */
  async checkIn(bookingId, userId, userRole) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw ApiError.notFound('BOOKING_NOT_FOUND');
    }
    if (booking.status !== 'approved') {
      throw ApiError.badRequest('BOOKING_INVALID_STATUS');
    }
  
    // Check permission: owner or admin/approver
    if (booking.userId !== userId && userRole === 'user') {
      throw ApiError.forbidden('FORBIDDEN');
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
  
    const sysSettings = await settingsService.getSystemSettings();
    const releaseTimeMin = sysSettings?.noShowReleaseTimeMin ?? 15;

    const checkInStart = new Date(startTime.getTime() - 10 * 60 * 1000); // 10 minutes before
    const checkInEnd = new Date(startTime.getTime() + releaseTimeMin * 60 * 1000);  // dynamic minutes after

    if (now < checkInStart) {
      throw ApiError.badRequest('VALIDATION_ERROR');
    }
    if (now > checkInEnd) {
      throw ApiError.badRequest('VALIDATION_ERROR');
    }

    const updated = await bookingRepository.update(bookingId, {
      checkedIn: true,
      checkInTime: now,
    });

    sseManager.broadcast({ event: 'bookings_changed', data: { bookingId, action: 'checkin' } });

    return updated;
  },

  /**
   * Scan bookings and process check-in reminder, warning, and no-show auto-release.
   * Runs periodically (every minute).
   */
  async processCheckInWindows() {
    const now = new Date();

    // Load dynamic system settings
    let sysSettings;
    try {
      sysSettings = await settingsService.getSystemSettings();
    } catch (err) {
      logger.error('[CheckInJob] Failed to load system settings:', err.message);
    }
    const noShowMin = sysSettings?.noShowReleaseTimeMin ?? 15;

    // 1. Send Check-in Reminder (Start of check-in window: startTime - 10 min)
    // Find approved bookings starting in 10 minutes that haven't been notified yet.
    const reminderWindowEnd = new Date(now.getTime() + 10 * 60 * 1000);
    const startOfReminderWindow = new Date(now.getTime() - 5 * 60 * 1000); // safety buffer for past meetings that haven't been processed
    const bookingsForReminder = await prisma.booking.findMany({
      where: {
        status: 'approved',
        checkedIn: false,
        checkInReminderSent: false,
        startTime: {
          lte: reminderWindowEnd,
          gte: startOfReminderWindow
        }
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        room: { select: { id: true, name: true, location: true } }
      }
    });

    for (const booking of bookingsForReminder) {
      try {
        await bookingRepository.update(booking.id, { checkInReminderSent: true });
        emailService.sendCheckInReminder(booking).catch(err => 
          logger.error(`[CheckInJob] Failed to send check-in reminder for booking ${booking.id}: ${err.message}`)
        );
        logger.info(`[CheckInJob] Sent check-in reminder for booking ${booking.id}`);
      } catch (err) {
        logger.error(`[CheckInJob] Failed to update check-in reminder flag for booking ${booking.id}: ${err.message}`);
      }
    }

    // 2. Send Check-in Warning (5 minutes before expiration: startTime + noShowMin - 5 min)
    const warningWindowStart = new Date(now.getTime() - noShowMin * 60 * 1000);
    const warningWindowEnd = new Date(now.getTime() - Math.max(0, noShowMin - 5) * 60 * 1000);
    const bookingsForWarning = await prisma.booking.findMany({
      where: {
        status: 'approved',
        checkedIn: false,
        checkInWarningSent: false,
        startTime: {
          gte: warningWindowStart,
          lte: warningWindowEnd
        }
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        room: { select: { id: true, name: true, location: true } }
      }
    });

    for (const booking of bookingsForWarning) {
      try {
        await bookingRepository.update(booking.id, { checkInWarningSent: true });
        emailService.sendCheckInWarning(booking).catch(err => 
          logger.error(`[CheckInJob] Failed to send check-in warning for booking ${booking.id}: ${err.message}`)
        );
        logger.info(`[CheckInJob] Sent check-in warning for booking ${booking.id}`);
      } catch (err) {
        logger.error(`[CheckInJob] Failed to update check-in warning flag for booking ${booking.id}: ${err.message}`);
      }
    }

    // 3. Auto-release/Cancel No-Show bookings (startTime + noShowMin min)
    const limitTime = new Date(now.getTime() - noShowMin * 60 * 1000);
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'approved',
        checkedIn: false,
        startTime: { lt: limitTime },
        endTime: { gt: now }
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        room: { select: { id: true, name: true, location: true } }
      }
    });

    for (const booking of expiredBookings) {
      try {
        const cancelReason = 'Hệ thống tự động hủy do quá giờ check-in (No-Show)';
        
        await bookingRepository.update(booking.id, {
          status: 'cancelled',
          cancelReason
        });

        sseManager.broadcast({ event: 'bookings_changed', data: { bookingId: booking.id, action: 'auto_release' } });

        // 1. Send email cancellation notification (fire-and-forget)
        emailService.sendBookingCancelled(booking, cancelReason).catch(err => 
          logger.error(`[CheckInJob] Failed to send email cancellation notification for booking ${booking.id}: ${err.message}`)
        );

        // 2. Send In-app notification
        await notificationService.createNotification(
          booking.userId,
          'booking_cancelled',
          'Lịch họp bị hủy tự động',
          `Lịch đặt phòng "${booking.title}" tại ${booking.room.name} đã bị tự động hủy do không check-in đúng giờ.`,
          booking.id
        ).catch(err => 
          logger.error(`[CheckInJob] Failed to create in-app cancellation notification for booking ${booking.id}: ${err.message}`)
        );

        logger.info(`[CheckInJob] Auto-released booking ${booking.id} due to no-show`);
      } catch (err) {
        logger.error(`[CheckInJob] Failed to auto-release booking ${booking.id}: ${err.message}`);
      }
    }
  },
};

module.exports = bookingService;
