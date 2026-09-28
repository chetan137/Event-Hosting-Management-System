const express = require('express');
const router = express.Router();
const {
  getPublicEvents,
  getEventDetails,
  registerForEvent,
  getMyEvents,
  cancelRegistration,
  getEventAttendees,
  getShowcaseCredentials,
  getCredentialById
} = require('../controllers/eventRegistrationController');
const { protect } = require('../middleware/authMiddleware');

// Public showcase & credential routes - must come before /:id
router.get('/', getPublicEvents);
router.get('/public/showcase', getShowcaseCredentials);
router.get('/credentials/:id', getCredentialById);

// Protected routes (require user login) - must come before /:id
router.get('/user/my-events', protect, getMyEvents);

// Public route for specific event
router.get('/:id', getEventDetails);
router.get('/:id/attendees', getEventAttendees);

// Protected routes for registration
router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, cancelRegistration);

module.exports = router;
