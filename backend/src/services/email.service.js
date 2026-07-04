const transporter = require('../config/email');
const emailTemplates = require('../utils/emailTemplates');
const logger = require('../utils/logger');
const env = require('../config/env');
const prisma = require('../config/database');

/**
 * Email service — sends transactional emails for booking events.
 *
 * All methods use fire-and-forget pattern: they do NOT throw on failure.
 * Errors are logged; the caller does NOT need to await these methods.
 *
 * Usage pattern in booking.service.js:
 *   emailService.sendBookingApproved(booking).catch(err => logger.error(...));
 */
const emailService = {
  /**
   * Check if email is configured (SMTP_HOST is set).
   * If not configured, skip sending silently.
   */
  _isConfigured() {
    return !!env.SMTP_HOST && !!env.SMTP_USER;
  },

  /**
   * Core send method — wraps nodemailer sendMail.
   * @param {{ to, subject, html }} options
   */
  async _send({ to, subject, html }) {
    if (!this._isConfigured()) {
      logger.warn('[Email] SMTP not configured. Skipping email to:', to);
      return;
    }

    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    logger.info(`[Email] Sent "${subject}" to ${to} (messageId: ${info.messageId})`);
    return info;
  },

  // ─── Booking Event Emails ──────────────────────────────────────────────────

  /**
   * Notify booker that their booking was approved.
   * @param {object} booking — must include booking.user.email
   */
  async sendBookingApproved(booking) {
    await this._send({
      to: booking.user.email,
      subject: `✅ Lịch đặt phòng "${booking.title}" đã được duyệt`,
      html: emailTemplates.bookingApproved(booking),
    });
  },

  /**
   * Notify booker that their booking was rejected.
   * @param {object} booking — must include booking.user.email
   */
  async sendBookingRejected(booking) {
    await this._send({
      to: booking.user.email,
      subject: `❌ Lịch đặt phòng "${booking.title}" bị từ chối`,
      html: emailTemplates.bookingRejected(booking),
    });
  },

  /**
   * Notify booker that their booking was cancelled.
   * @param {object} booking — must include booking.user.email
   */
  async sendBookingCancelled(booking, reason) {
    await this._send({
      to: booking.user.email,
      subject: `🚫 Lịch đặt phòng "${booking.title}" đã bị hủy`,
      html: emailTemplates.bookingCancelled(booking, reason),
    });
  },

  /**
   * Notify booker that the check-in window is open.
   */
  async sendCheckInReminder(booking) {
    await this._send({
      to: booking.user.email,
      subject: `📍 Đến giờ Check-in cuộc họp "${booking.title}"`,
      html: emailTemplates.bookingCheckInReminder(booking),
    });
  },

  /**
   * Notify booker 5 minutes before check-in expires.
   */
  async sendCheckInWarning(booking) {
    await this._send({
      to: booking.user.email,
      subject: `⚠️ Cảnh báo: Sắp hết hạn Check-in cuộc họp "${booking.title}"`,
      html: emailTemplates.bookingCheckInWarning(booking),
    });
  },

  /**
   * Send a reminder email to the booker ~15 minutes before meeting.
   * @param {object} booking — must include booking.user.email
   */
  async sendBookingReminder(booking) {
    await this._send({
      to: booking.user.email,
      subject: `⏰ Nhắc lịch: "${booking.title}" sắp bắt đầu trong 15 phút`,
      html: emailTemplates.bookingReminder(booking),
    });
  },

  /**
   * Notify all approvers and admins about a new pending booking.
   * Fetches approver/admin list from database automatically.
   * @param {object} booking — the newly created booking (with room + user)
   */
  async sendNewBookingNotification(booking) {
    if (!this._isConfigured()) {
      logger.warn('[Email] SMTP not configured. Skipping new booking notification.');
      return;
    }

    // Fetch all approvers and admins
    const approvers = await prisma.user.findMany({
      where: {
        role: { in: ['approver', 'admin'] },
        isActive: true,
      },
      select: { email: true, fullName: true },
    });

    if (approvers.length === 0) {
      logger.warn('[Email] No approvers found to notify for booking:', booking.id);
      return;
    }

    const html = emailTemplates.newBookingForApprover(booking);
    const subject = `📋 Yêu cầu đặt phòng mới: "${booking.title}" (${booking.user?.fullName})`;

    // Send to all approvers in parallel
    await Promise.allSettled(
      approvers.map((approver) =>
        this._send({ to: approver.email, subject, html }).catch((err) =>
          logger.error(`[Email] Failed to notify approver ${approver.email}:`, err.message),
        ),
      ),
    );

    logger.info(`[Email] New booking notification sent to ${approvers.length} approver(s).`);
  },
};

module.exports = emailService;
