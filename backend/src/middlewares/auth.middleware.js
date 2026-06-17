const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

/**
 * authenticate — verifies the JWT access token in the Authorization header.
 * On success, attaches `req.user = { id, email, role }`.
 * On failure, passes an ApiError 401 to next().
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authenticate;
