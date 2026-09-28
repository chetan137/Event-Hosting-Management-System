const express = require('express');
const router = express.Router();
const {
  getPublicEvents,
  getEventDetails,
  registerForEvent,
  getMyEvents,
  cancelRegistration,
  getEventAttendees,
  getCategories,
  enhanceSearchQuery
} = require('../controllers/eventRegistrationController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getPublicEvents);
router.get('/categories', getCategories);
router.get('/search/semantic', enhanceSearchQuery);

// Protected routes (require user login) - must come before /:id
router.get('/user/my-events', protect, getMyEvents);

// Public route for specific event
router.get('/:id', getEventDetails);
router.get('/:id/attendees', getEventAttendees);

// Protected routes for registration
router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, cancelRegistration);

module.exports = router;
