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
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getPublicEvents);

// Protected routes (require user login) - must come before /:id
router.get('/user/my-events', protect, getMyEvents);

// Public route for specific event
router.get('/:id', getEventDetails);
router.get('/:id/attendees', getEventAttendees);

// Protected routes for registration
router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, cancelRegistration);

module.exports = router;
