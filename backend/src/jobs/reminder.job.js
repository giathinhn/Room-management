const cron = require('node-cron');
const prisma = require('../config/database');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * Reminder cron job - runs every 5 minutes.
 *
 * Checks for approved bookings starting in 15-20 minutes and sends
 * a reminder email to the booker. Uses `reminderSent` flag to prevent
 * duplicate sends even if the cron fires multiple times in the window.
 *
 * Schedule: every 5 minutes ("asterisk/5 asterisk asterisk asterisk asterisk").
 */
function startReminderJob() {
  logger.info('[ReminderJob] Scheduler started — running every 5 minutes.');

  cron.schedule('*/5 * * * *', async () => {
    logger.info('[ReminderJob] Tick — checking for upcoming bookings...');

    try {
      const now = new Date();
      // Window: bookings starting between now+15min and now+20min
      const windowStart = new Date(now.getTime() + 15 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + 20 * 60 * 1000);

      // Find approved bookings in the reminder window that haven't been notified yet
      const upcomingBookings = await prisma.booking.findMany({
        where: {
          status: 'approved',
          reminderSent: false,
          startTime: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
          room: {
            select: { id: true, name: true, location: true },
          },
        },
      });

      if (upcomingBookings.length === 0) {
        logger.info('[ReminderJob] No upcoming bookings in window. Skipping.');
        return;
      }

      logger.info(`[ReminderJob] Found ${upcomingBookings.length} booking(s) to remind.`);

      // Process each booking
      for (const booking of upcomingBookings) {
        try {
          // Send reminder email (fire-and-forget, but we await here for sequential processing)
          await emailService.sendBookingReminder(booking);

          // Mark reminder as sent AFTER successful email
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent: true },
          });

          logger.info(
            `[ReminderJob] Reminder sent for booking ${booking.id} ` +
              `(${booking.title} @ ${booking.room?.name}) to ${booking.user?.email}`,
          );
        } catch (err) {
          // Log failure but continue processing other bookings
          logger.error(
            `[ReminderJob] Failed to send reminder for booking ${booking.id}:`,
            err.message,
          );
        }
      }
    } catch (err) {
      logger.error('[ReminderJob] Cron execution error:', err.message);
    }
  });
}

module.exports = { startReminderJob };
