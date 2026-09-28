const express = require('express');
const router = express.Router();
const {
  getEventAnalytics,
  getCompletedEvents,
  regenerateAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const { getAttendanceForecast } = require('../controllers/forecastController');

// All routes require admin authentication
// Note: Add admin role check middleware if needed

// Get list of completed events
router.get('/completed-events', protect, getCompletedEvents);

// Attendance forecast (must be before /event/:eventId to avoid shadowing)
router.get('/event/:eventId/attendance-forecast', protect, requireAdmin, getAttendanceForecast);

// Get detailed analytics for a specific event
router.get('/event/:eventId', protect, getEventAnalytics);

// Regenerate analytics for an event
router.post('/event/:eventId/regenerate', protect, regenerateAnalytics);

module.exports = router;
