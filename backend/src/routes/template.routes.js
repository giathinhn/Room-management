const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const authenticate = require('../middlewares/auth.middleware');

/**
 * All template routes require authentication.
 *
 * GET    /api/templates                         — list user's templates
 * POST   /api/templates                         — create template
 * PUT    /api/templates/:id                     — update template (owner only)
 * DELETE /api/templates/:id                     — delete template (owner only)
 * POST   /api/templates/from-booking/:bookingId — save booking as template
 */

router.get('/', authenticate, templateController.getAll);
router.post('/', authenticate, templateController.create);
router.put('/:id', authenticate, templateController.update);
router.delete('/:id', authenticate, templateController.delete);
router.post('/from-booking/:bookingId', authenticate, templateController.createFromBooking);

module.exports = router;
