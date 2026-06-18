const express = require('express');

const router = express.Router();
const roomController = require('../controllers/room.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// ⚠️  /available MUST be declared before /:id to avoid "available" being parsed as a UUID
router.get('/', authenticate, roomController.getAll);
router.get('/available', authenticate, roomController.findAvailable);
router.get('/:id', authenticate, roomController.getById);
router.post('/', authenticate, authorize('admin'), roomController.create);
router.put('/:id', authenticate, authorize('admin'), roomController.update);
router.delete('/:id', authenticate, authorize('admin'), roomController.delete);

module.exports = router;
