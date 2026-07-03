const express = require('express');

const router = express.Router();
const roomController = require('../controllers/room.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// ── Floor Map routes (MUST be before /:id to avoid param conflicts) ──────────
router.get('/buildings',  authenticate, roomController.getBuildings);
router.get('/floors',     authenticate, roomController.getFloors);
router.get('/floor-map',  authenticate, roomController.getFloorMap);

// ⚠️  /available MUST be before /:id
router.get('/available', authenticate, roomController.findAvailable);

// ── Standard CRUD ────────────────────────────────────────────────────────────
router.get('/',    authenticate, roomController.getAll);
router.get('/:id', authenticate, roomController.getById);
router.post('/',   authenticate, authorize('admin'), roomController.create);
router.put('/:id/map-position', authenticate, authorize('admin'), roomController.updateMapPosition);
router.put('/:id',  authenticate, authorize('admin'), roomController.update);
router.delete('/:id', authenticate, authorize('admin'), roomController.delete);

module.exports = router;
