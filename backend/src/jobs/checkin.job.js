const cron = require('node-cron');
const bookingService = require('../services/booking.service');
const logger = require('../utils/logger');

/**
 * Check-in background job - runs every 1 minute.
 * Scans bookings to:
 * 1. Send check-in reminder email (startTime - 10 min).
 * 2. Send check-in warning email (startTime + 10 min).
 * 3. Auto-release/Cancel no-show bookings (startTime + 15 min).
 */
function startCheckInJob() {
  logger.info('[CheckInJob] Scheduler started — running every minute.');

  cron.schedule('*/1 * * * *', async () => {
    logger.info('[CheckInJob] Tick — processing check-in windows & no-shows...');
    try {
      await bookingService.processCheckInWindows();
    } catch (err) {
      logger.error('[CheckInJob] Cron execution error:', err.message);
    }
  });
}

module.exports = { startCheckInJob };
