const asyncHandler = require('express-async-handler');
const geminiAIService = require('../services/geminiAIService');
const Event = require('../models/Event');

/**
 * =========================================================================
 * Team Foxtrot (F-06): AI User-Side Controller
 * Lead: Sahil Waghe
 * =========================================================================
 */

// @desc    Generate automated showcase narrative for an attendee
// @route   POST /api/ai/showcase-narrative
// @access  Public / Authenticated
const generateShowcaseNarrative = asyncHandler(async (req, res) => {
  const { 
    attendeeName, 
    eventName, 
    eventId,
    eventDescription, 
    eventTheme, 
    location, 
    tone = 'inspirational', 
    feedback = '', 
    skills = [] 
  } = req.body;

  let resolvedEventName = eventName;
  let resolvedDescription = eventDescription || '';
  let resolvedTheme = eventTheme || 'minimal';
  let resolvedLocation = location || 'Online / Offline';

  // If eventId provided, enrich with official database details
  if (eventId) {
    const event = await Event.findById(eventId);
    if (event) {
      resolvedEventName = event.eventName;
      resolvedDescription = event.description || resolvedDescription;
      resolvedTheme = event.theme || resolvedTheme;
      resolvedLocation = event.locationType === 'online' ? 'Online' : (event.locationValue || resolvedLocation);
    }
  }

  if (!attendeeName || !resolvedEventName) {
    res.status(400);
    throw new Error('Attendee name and event name (or valid eventId) are required');
  }

  const narrative = await geminiAIService.generateShowcaseNarrative({
    attendeeName,
    eventName: resolvedEventName,
    eventDescription: resolvedDescription,
    eventTheme: resolvedTheme,
    location: resolvedLocation,
    tone,
    feedback,
    skills
  });

  res.status(200).json({
    success: true,
    feature: 'F-06: AI Certificate & Showcase Highlights',
    team: 'Team Foxtrot (Lead: Sahil Waghe)',
    type: 'showcase_narrative',
    data: {
      attendeeName,
      eventName: resolvedEventName,
      tone,
      narrative
    }
  });
});

// @desc    Generate custom attendee accomplishment quote
// @route   POST /api/ai/accomplishment-quote
// @access  Public / Authenticated
const generateAccomplishmentQuote = asyncHandler(async (req, res) => {
  const { 
    attendeeName, 
    eventName, 
    eventId,
    tone = 'inspirational', 
    role = 'Participant', 
    feedback = '', 
    skills = [] 
  } = req.body;

  let resolvedEventName = eventName;

  if (eventId) {
    const event = await Event.findById(eventId);
    if (event) {
      resolvedEventName = event.eventName;
    }
  }

  if (!attendeeName || !resolvedEventName) {
    res.status(400);
    throw new Error('Attendee name and event name (or valid eventId) are required');
  }

  const quote = await geminiAIService.generateAccomplishmentQuote({
    attendeeName,
    eventName: resolvedEventName,
    tone,
    role,
    feedback,
    skills
  });

  res.status(200).json({
    success: true,
    feature: 'F-06: AI Certificate & Showcase Highlights',
    team: 'Team Foxtrot (Lead: Sahil Waghe)',
    type: 'accomplishment_quote',
    data: {
      attendeeName,
      eventName: resolvedEventName,
      tone,
      role,
      accomplishmentQuote: quote
    }
  });
});

// @desc    Generate complete showcase highlights bundle (quote + narrative + competency skills)
// @route   POST /api/ai/showcase-highlights
// @access  Public / Authenticated
const generateShowcaseHighlights = asyncHandler(async (req, res) => {
  const { 
    attendeeName, 
    eventName, 
    eventId,
    eventDescription, 
    eventTheme, 
    location, 
    tone = 'inspirational', 
    feedback = '', 
    skills = [] 
  } = req.body;

  let resolvedEventName = eventName;
  let resolvedDescription = eventDescription || '';
  let resolvedTheme = eventTheme || 'minimal';
  let resolvedLocation = location || 'Online / Offline';

  if (eventId) {
    const event = await Event.findById(eventId);
    if (event) {
      resolvedEventName = event.eventName;
      resolvedDescription = event.description || resolvedDescription;
      resolvedTheme = event.theme || resolvedTheme;
      resolvedLocation = event.locationType === 'online' ? 'Online' : (event.locationValue || resolvedLocation);
    }
  }

  if (!attendeeName || !resolvedEventName) {
    res.status(400);
    throw new Error('Attendee name and event name (or valid eventId) are required');
  }

  const highlights = await geminiAIService.generateShowcaseHighlights({
    attendeeName,
    eventName: resolvedEventName,
    eventDescription: resolvedDescription,
    eventTheme: resolvedTheme,
    location: resolvedLocation,
    tone,
    feedback,
    skills
  });

  res.status(200).json({
    success: true,
    feature: 'F-06: AI Certificate & Showcase Highlights',
    team: 'Team Foxtrot (Lead: Sahil Waghe)',
    type: 'showcase_highlights',
    data: {
      attendeeName,
      eventName: resolvedEventName,
      accomplishmentQuote: highlights.accomplishmentQuote,
      showcaseNarrative: highlights.showcaseNarrative,
      skills: highlights.skills,
      tone: highlights.tone
    }
  });
});

module.exports = {
  generateShowcaseNarrative,
  generateAccomplishmentQuote,
  generateShowcaseHighlights
};
