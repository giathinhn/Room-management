const express = require('express');

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Future routes will be added here:
// router.use('/auth', require('./auth.routes'));
// router.use('/rooms', require('./rooms.routes'));
// router.use('/bookings', require('./bookings.routes'));

module.exports = router;
