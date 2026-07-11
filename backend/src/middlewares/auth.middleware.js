const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');

/**
 * authenticate — verifies the JWT access token in the Authorization header.
 * On success, attaches `req.user = { id, email, role }`.
 * On failure, passes an ApiError 401 to next().
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    
    // Fetch latest user details from DB to verify active status and role
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return next(ApiError.unauthorized('Tài khoản không tồn tại trên hệ thống'));
    }
    
    if (!user.isActive) {
      return next(ApiError.forbidden('Tài khoản đã bị khóa hoặc ngừng hoạt động'));
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authenticate;
