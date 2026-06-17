/**
 * Custom API Error class
 * Extends native Error with HTTP statusCode support
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {boolean} [isOperational=true] - Whether error is operational (trusted)
   */
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'ApiError';

    // Capture stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Factory: 400 Bad Request
   */
  static badRequest(message = 'Bad Request') {
    return new ApiError(400, message);
  }

  /**
   * Factory: 401 Unauthorized
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  /**
   * Factory: 403 Forbidden
   */
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  /**
   * Factory: 404 Not Found
   */
  static notFound(message = 'Not Found') {
    return new ApiError(404, message);
  }

  /**
   * Factory: 409 Conflict
   */
  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  /**
   * Factory: 422 Unprocessable Entity
   */
  static unprocessable(message = 'Unprocessable Entity') {
    return new ApiError(422, message);
  }

  /**
   * Factory: 500 Internal Server Error
   */
  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message, false);
  }
}

module.exports = ApiError;
