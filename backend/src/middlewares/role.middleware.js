const ApiError = require('../utils/ApiError');

/**
 * authorize — factory that returns a middleware restricting access to specific roles.
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize('admin'), handler)
 *   router.get('/approvals', authenticate, authorize('admin', 'approver'), handler)
 *
 * @param {...string} allowedRoles — roles that may access the route
 * @returns {import('express').RequestHandler}
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    return next();
  };
}

module.exports = authorize;
