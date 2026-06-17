const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const router = express.Router();

// All user management routes: must be authenticated + admin role
router.use(authenticate, authorize('admin'));

/**
 * GET /api/users
 * List all users with pagination and optional filtering.
 * Query: page, limit, role, search, isActive
 */
router.get('/', userController.getUsers);

/**
 * GET /api/users/:id
 * Get a specific user's details.
 */
router.get('/:id', userController.getUserById);

/**
 * PATCH /api/users/:id/role
 * Change a user's role.
 * Body: { role: 'admin' | 'approver' | 'user' }
 */
router.patch('/:id/role', userController.updateUserRole);

/**
 * PATCH /api/users/:id
 * Update a user's information (fullName, isActive).
 * Body: { fullName?, isActive? }
 */
router.patch('/:id', userController.updateUser);

module.exports = router;
