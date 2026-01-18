const express = require('express');
const router = express.Router();
const {
  getEventAnalytics,
  getCompletedEvents,
  regenerateAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require admin authentication
// Note: Add admin role check middleware if needed

// Get list of completed events
router.get('/completed-events', protect, getCompletedEvents);

// Get detailed analytics for a specific event
router.get('/event/:eventId', protect, getEventAnalytics);

// Regenerate analytics for an event
router.post('/event/:eventId/regenerate', protect, regenerateAnalytics);

module.exports = router;
