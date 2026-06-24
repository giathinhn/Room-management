/**
 * Simple logger utility.
 * Wraps console with level-prefixed output and timestamps.
 * In production, replace with winston or pino for structured logging.
 */

const logger = {
  /**
   * Log informational message.
   * @param {string} message
   * @param {...any} args
   */
  info(message, ...args) {
    console.log(`[${new Date().toISOString()}] [INFO]  ${message}`, ...args);
  },

  /**
   * Log warning message.
   * @param {string} message
   * @param {...any} args
   */
  warn(message, ...args) {
    console.warn(`[${new Date().toISOString()}] [WARN]  ${message}`, ...args);
  },

  /**
   * Log error message.
   * @param {string} message
   * @param {...any} args
   */
  error(message, ...args) {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, ...args);
  },

  /**
   * Log debug message (only in development).
   * @param {string} message
   * @param {...any} args
   */
  debug(message, ...args) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`, ...args);
    }
  },
};

module.exports = logger;
