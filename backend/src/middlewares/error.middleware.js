const ApiError = require('../utils/ApiError');

/**
 * Global error handling middleware
 * Must have 4 parameters for Express to recognize it as error middleware
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_ERROR';

  // Handle Prisma known errors
  if (err.code === 'P2002') {
    statusCode = 409;
    const field = err.meta?.target?.[0] || 'field';
    errorCode = field === 'email' ? 'EMAIL_ALREADY_EXISTS' : (field === 'name' ? 'ROOM_NAME_EXISTS' : 'VALIDATION_ERROR');
    message = `A record with this ${field} already exists.`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    errorCode = 'RECORD_NOT_FOUND';
    message = 'Record not found.';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    errorCode = 'INVALID_REFERENCE';
    message = 'Invalid reference: related record not found.';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'TOKEN_INVALID';
    message = 'Invalid token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Token has expired.';
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    message = err.message;
  }

  // Don't expose internal error details in production
  const isDev = process.env.NODE_ENV === 'development';
  const isOperational = err instanceof ApiError && err.isOperational;

  if (!isOperational && !isDev) {
    message = 'Something went wrong. Please try again later.';
  }

  // Log non-operational errors
  if (!isOperational) {
    console.error('[Error]', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(err.details && { details: err.details }),
      ...(isDev && !isOperational && { stack: err.stack }),
    },
  });
};

module.exports = errorMiddleware;
