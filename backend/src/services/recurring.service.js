const bookingRepository = require('../repositories/booking.repository');
const recurringRepository = require('../repositories/recurring.repository');
const roomRepository = require('../repositories/room.repository');
const { generateSlots } = require('../utils/recurring');
const prisma = require('../config/database');

// ─── Constants ────────────────────────────────────────────────────────────────
const BUSINESS_HOUR_START = 7;  // 07:00
const BUSINESS_HOUR_END = 22;   // 22:00

/**
 * Recurring booking service — business logic for the recurring booking feature.
 */
const recurringService = {
  /**
   * Preview recurring slots — generate and check conflicts without saving anything.
   * Two-step flow Step 1.
   *
   * @param {string} userId
   * @param {{ roomId, title, startDate, endDate, startTime, endTime, frequency }} data
   * @returns {{ okSlots: Slot[], conflictSlots: Slot[] }}
   */
  async preview(userId, data) {
    const { roomId, startDate, endDate, startTime, endTime, frequency } = data;

    // Validate room
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

    // Validate business hours
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startHourDecimal = startH + startM / 60;
    const endHourDecimal = endH + endM / 60;

    if (startHourDecimal < BUSINESS_HOUR_START || endHourDecimal > BUSINESS_HOUR_END) {
      const err = new Error('Booking must be between 07:00 and 22:00');
      err.statusCode = 400;
      throw err;
    }

    // Generate all possible slots
    const slots = generateSlots(startDate, endDate, startTime, endTime, frequency);

    if (slots.length === 0) {
      return { okSlots: [], conflictSlots: [], totalGenerated: 0 };
    }

    // Check conflicts for each slot independently
    const okSlots = [];
    const conflictSlots = [];

    for (const slot of slots) {
      const overlaps = await bookingRepository.findOverlapping(
        roomId,
        slot.startTime,
        slot.endTime
      );

      if (overlaps.length > 0) {
        conflictSlots.push({
          date: slot.date,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          conflicts: overlaps.map((b) => ({
            id: b.id,
            title: b.title,
            bookerName: b.user?.fullName || b.user?.email || 'Unknown',
          })),
        });
      } else {
        okSlots.push({
          date: slot.date,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
        });
      }
    }

    return {
      okSlots,
      conflictSlots,
      totalGenerated: slots.length,
    };
  },

  /**
   * Confirm and create a recurring booking series.
   * Two-step flow Step 2.
   *
   * @param {string} userId
   * @param {{ roomId, title, startDate, endDate, startTime, endTime, frequency, confirmedSlots? }} data
   * @returns {{ recurring: RecurringBooking, bookings: Booking[] }}
   */
  async create(userId, data) {
    const { roomId, title, startDate, endDate, startTime, endTime, frequency, confirmedSlots } = data;

    // Generate or use confirmed slots
    let slotsToBook;
    if (confirmedSlots && confirmedSlots.length > 0) {
      // Use the client-provided confirmed slots (already filtered)
      slotsToBook = confirmedSlots.map((s) => ({
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
      }));
    } else {
      // Auto-generate and only use OK slots
      const allSlots = generateSlots(startDate, endDate, startTime, endTime, frequency);
      slotsToBook = [];
      for (const slot of allSlots) {
        const overlaps = await bookingRepository.findOverlapping(
          roomId,
          slot.startTime,
          slot.endTime
        );
        if (overlaps.length === 0) {
          slotsToBook.push({ startTime: slot.startTime, endTime: slot.endTime });
        }
      }
    }

    if (slotsToBook.length === 0) {
      const err = new Error('No available slots to book — all proposed times have conflicts');
      err.statusCode = 409;
      throw err;
    }

    // Build time-only Date objects for RecurringBooking
    const [startH, startMin] = startTime.split(':').map(Number);
    const [endH, endMin] = endTime.split(':').map(Number);
    const startTimeDate = new Date(0);
    startTimeDate.setUTCHours(startH, startMin, 0, 0);
    const endTimeDate = new Date(0);
    endTimeDate.setUTCHours(endH, endMin, 0, 0);

    // Use a transaction: create RecurringBooking + all child Bookings atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the RecurringBooking record
      const recurring = await tx.recurringBooking.create({
        data: {
          userId,
          roomId,
          frequency,
          startDate: new Date(`${startDate}T00:00:00Z`),
          endDate: new Date(`${endDate}T00:00:00Z`),
          startTime: startTimeDate,
          endTime: endTimeDate,
        },
      });

      // 2. Create all child bookings linked to this recurring record
      const bookingData = slotsToBook.map((slot) => ({
        userId,
        roomId,
        title,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'pending',
        recurringId: recurring.id,
      }));

      await tx.booking.createMany({ data: bookingData });

      // 3. Fetch created bookings to return them
      const bookings = await tx.booking.findMany({
        where: { recurringId: recurring.id },
        orderBy: { startTime: 'asc' },
        include: {
          room: { select: { id: true, name: true, location: true, capacity: true } },
          user: { select: { id: true, fullName: true, email: true } },
        },
      });

      return { recurring, bookings };
    });

    return result;
  },

  /**
   * Cancel all pending/approved bookings in a recurring series.
   *
   * @param {string} recurringId
   * @param {{ id: string, role: string }} requestingUser
   * @returns {{ message: string, cancelledCount: number }}
   */
  async cancelAll(recurringId, requestingUser) {
    const recurring = await recurringRepository.findById(recurringId);
    if (!recurring) {
      const err = new Error('Recurring booking not found');
      err.statusCode = 404;
      throw err;
    }

    // Ownership check: only owner or admin can cancel
    const isOwner = recurring.userId === requestingUser.id;
    const isAdmin = requestingUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      const err = new Error('You can only cancel your own recurring bookings');
      err.statusCode = 403;
      throw err;
    }

    // Cancel all pending/approved bookings in the series
    const { count } = await prisma.booking.updateMany({
      where: {
        recurringId,
        status: { in: ['pending', 'approved'] },
      },
      data: { status: 'cancelled' },
    });

    return {
      message: `Cancelled ${count} bookings in the series`,
      cancelledCount: count,
    };
  },

  /**
   * Get all recurring booking series for a user, with stats.
   *
   * @param {string} userId
   * @returns {Array<RecurringBooking & { stats }>}
   */
  async getByUser(userId) {
    const series = await recurringRepository.findByUserId(userId);

    return series.map((s) => {
      const stats = {
        total: s.bookings.length,
        approved: s.bookings.filter((b) => b.status === 'approved').length,
        pending: s.bookings.filter((b) => b.status === 'pending').length,
        cancelled: s.bookings.filter((b) => b.status === 'cancelled').length,
        rejected: s.bookings.filter((b) => b.status === 'rejected').length,
      };
      return { ...s, stats };
    });
  },
};

module.exports = recurringService;
