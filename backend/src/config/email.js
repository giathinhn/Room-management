const nodemailer = require('nodemailer');
const env = require('./env');

/**
 * Nodemailer transporter configured from environment variables.
 * Supports Gmail, Ethereal, Mailtrap, or any SMTP provider.
 *
 * Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.
 * For testing, use https://ethereal.email/ (free, no real emails sent).
 */
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for port 465, false for 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  // Gracefully ignore TLS errors in development
  tls: {
    rejectUnauthorized: env.isProduction,
  },
});

module.exports = transporter;
