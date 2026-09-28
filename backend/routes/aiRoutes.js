const express = require('express');
const router = express.Router();
const {
  generateShowcaseNarrative,
  generateAccomplishmentQuote,
  generateShowcaseHighlights
} = require('../controllers/aiController');

/**
 * =========================================================================
 * Team Foxtrot (F-06): AI User-Side Routes
 * Lead: Sahil Waghe
 * =========================================================================
 */

// Automated showcase narrative generator
router.post('/showcase-narrative', generateShowcaseNarrative);

// Custom attendee accomplishment quote generator
router.post('/accomplishment-quote', generateAccomplishmentQuote);

// Complete showcase highlights generator (quote + narrative + competency skills)
router.post('/showcase-highlights', generateShowcaseHighlights);

module.exports = router;
