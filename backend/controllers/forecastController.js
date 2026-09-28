const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const { computeForecast, loadForecastInputs } = require('../services/forecast/forecastService');
const track = require('../utils/track');

// @desc    Attendance forecast for a single event
// @route   GET /api/analytics/event/:eventId/attendance-forecast
// @access  Private (admin role only — protect + requireAdmin)
const getAttendanceForecast = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  if (!mongoose.isValidObjectId(eventId)) {
    res.status(400);
    throw new Error('Invalid event ID');
  }

  const event = await Event.findById(eventId).lean();
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // DB errors bubble to the global error handler (500).
  // Forecast calculation errors return a safe fallback instead.
  let inputs;
  try {
    inputs = await loadForecastInputs(eventId, event);
  } catch (dbErr) {
    // Re-throw so asyncHandler sends 500 — this is a real infrastructure failure.
    throw dbErr;
  }

  let result;
  try {
    result = computeForecast(inputs);
  } catch (_calcErr) {
    // Calculation error → safe fallback with zeros, source: 'fallback'.
    result = computeForecast({
      registered: 0, approved: 0, capacity: inputs?.capacity ?? null,
      totalAttended: 0, totalApproved: 0,
      daysLeft: 0, pace: 0, actualAttended: null,
    });
    result.source = 'fallback';
  }

  // Fire-and-forget tracking — must never affect the response.
  track({
    event_name: 'forecast_loaded',
    user_id: req.user?._id ?? null,
    action_type: 'forecast_loaded',
    timestamp: new Date().toISOString(),
    metadata: { eventId, source: result.source, capacityAlert: result.capacityAlert },
  });

  if (result.capacityAlert !== 'none') {
    track({
      event_name: 'capacity_alert_shown',
      user_id: req.user?._id ?? null,
      action_type: 'capacity_alert_shown',
      timestamp: new Date().toISOString(),
      metadata: { eventId, capacityAlert: result.capacityAlert },
    });
  }

  res.json({ eventId, ...result });
});

module.exports = { getAttendanceForecast };
