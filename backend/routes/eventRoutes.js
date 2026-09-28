const express = require('express');
const router = express.Router();
const {
  getPublicEvents,
  getEventDetails,
  registerForEvent,
  getMyEvents,
  cancelRegistration,
  getEventAttendees
} = require('../controllers/eventRegistrationController');
const { getEventAISentiment } = require('../controllers/eventSentimentController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getPublicEvents);

// Protected routes (require user login) - must come before /:id
router.get('/user/my-events', protect, getMyEvents);

// Team Alpha: AI Sentiment endpoint with statistical fallback
router.get('/:id/ai-sentiment', getEventAISentiment);

// Public route for specific event
router.get('/:id', getEventDetails);
router.get('/:id/attendees', getEventAttendees);

// Protected routes for registration
router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, cancelRegistration);

module.exports = router;
