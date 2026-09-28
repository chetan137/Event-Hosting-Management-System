// Forecast service: pure projection logic + DB data-loading.
// Pure functions have no DB access and can be tested with plain inputs.

const EventRegistration = require('../../models/EventRegistration');
const Attendance = require('../../models/Attendance');
const Event = require('../../models/Event');
const { bounds, maxApprovals, curve } = require('./bounds');

const K = 20;                  // shrinkage weight (equivalent to 20 "average" observations)
const FALLBACK_RATE = 0.8;     // used when no historical data exists
const MIN_RATE = 0.05;
const MAX_RATE = 0.99;

/** Replace any non-finite number with a safe substitute. */
function safeNum(val, fallback = 0) {
  const n = Number(val);
  return isFinite(n) ? n : fallback;
}

/**
 * Pure function: compute the full forecast from pre-loaded counts.
 * No DB access. All inputs are plain numbers.
 *
 * @param {object} input
 * @param {number} input.registered   - total non-rejected registrations
 * @param {number} input.approved     - approved registrations
 * @param {number} input.capacity     - event capacity (0 / null = unset)
 * @param {number} input.totalAttended  - sum of attended across history
 * @param {number} input.totalApproved  - sum of approved across history
 * @param {number} input.daysLeft     - days remaining until event start (0 for past/live)
 * @param {number} input.pace         - registrations per day so far
 * @param {number|null} input.actualAttended - real check-in count, or null
 * @returns {object} forecast result (no NaN, no Infinity, no undefined)
 */
function computeForecast({
  registered, approved, capacity,
  totalAttended, totalApproved,
  daysLeft, pace, actualAttended,
}) {
  const reg = safeNum(registered);
  const appr = safeNum(approved);
  const cap = safeNum(capacity);
  const validCap = cap > 0;

  const approvalRatio = reg > 0 ? safeNum(appr / reg) : 0;

  // Shrinkage estimator: blend category (global here) rate with fallback.
  let turnoutRate;
  let source;
  if (safeNum(totalApproved) > 0) {
    const globalRate = safeNum(totalAttended) / safeNum(totalApproved);
    // Clamp to valid range before shrinkage to avoid anchoring on extreme outliers.
    const clampedGlobal = Math.max(MIN_RATE, Math.min(MAX_RATE, globalRate));
    turnoutRate = (safeNum(totalAttended) + K * clampedGlobal) / (safeNum(totalApproved) + K);
    source = 'model';
  } else {
    turnoutRate = FALLBACK_RATE;
    source = 'fallback';
  }
  turnoutRate = Math.max(MIN_RATE, Math.min(MAX_RATE, turnoutRate));

  // Projected approved: for upcoming events grow via pace, else stay at approved.
  let projectedApproved;
  if (daysLeft > 0 && reg > 0) {
    const projected = appr + safeNum(pace) * daysLeft * approvalRatio;
    const cap15 = validCap ? cap * 1.5 : Infinity;
    projectedApproved = Math.round(Math.min(projected, cap15));
  } else {
    projectedApproved = Math.round(appr);
  }
  projectedApproved = Math.max(0, projectedApproved);

  const { expected: predictedTurnout, low, high } = bounds(projectedApproved, turnoutRate);
  const predictedDropouts = projectedApproved - predictedTurnout;

  // Capacity alert uses the high-end estimate (pessimistic).
  let capacityAlert = 'none';
  if (validCap) {
    if (high > cap) capacityAlert = 'over';
    else if (predictedTurnout >= cap * 0.9) capacityAlert = 'near';
  }

  const recommendation = maxApprovals(turnoutRate, validCap ? cap : null);
  const whatIfCurve = curve(turnoutRate, projectedApproved, validCap ? cap : null);

  return {
    capacity: validCap ? Math.round(cap) : null,
    registered: Math.round(reg),
    approved: Math.round(appr),
    approvalRatio: safeNum(Math.round(approvalRatio * 1000) / 1000),
    actualAttended: actualAttended !== null ? Math.round(safeNum(actualAttended)) : null,
    projectedApproved,
    turnoutRate: safeNum(Math.round(turnoutRate * 1000) / 1000),
    predictedTurnout,
    predictedDropouts: Math.max(0, Math.round(predictedDropouts)),
    range: { low, high, confidence: 0.8 },
    recommendation: recommendation !== null
      ? { maxApprovals: recommendation, targetConfidence: 0.9 }
      : null,
    curve: whatIfCurve,
    source,
    capacityAlert,
    explanation: null,
  };
}

/**
 * Load all counts needed for the forecast from the DB.
 * Uses countDocuments / aggregation only — never loads documents into memory.
 *
 * @param {string} eventId - MongoDB ObjectId string (already validated)
 * @param {object} event   - lean Event document
 * @returns {object} raw counts to pass into computeForecast
 */
async function loadForecastInputs(eventId, event) {
  const now = new Date();

  // Registered = pending + approved (exclude rejected — only real statuses in schema).
  const [registered, approved] = await Promise.all([
    EventRegistration.countDocuments({ event: eventId, status: { $in: ['pending', 'approved'] } }),
    EventRegistration.countDocuments({ event: eventId, status: 'approved' }),
  ]);

  // Pace: registrations per day since first registration for this event.
  const firstReg = await EventRegistration.findOne({ event: eventId })
    .sort({ registrationDate: 1 })
    .select('registrationDate')
    .lean();

  let pace = 0;
  if (firstReg?.registrationDate) {
    const daysSince = Math.max(
      1,
      (now - new Date(firstReg.registrationDate)) / 86400000,
    );
    pace = registered / daysSince;
  }

  // Days left until event start (UTC, 0 if past or invalid date).
  const start = event.startDateTime ? new Date(event.startDateTime) : null;
  const daysLeft = start && start > now
    ? Math.max(0, (start - now) / 86400000)
    : 0;

  // Actual attended: real check-in data only when event has started.
  let actualAttended = null;
  const eventStarted = start && start <= now;
  if (eventStarted) {
    const count = await Attendance.countDocuments({ event: eventId });
    actualAttended = count > 0 ? count : null;
  }

  // Historical turnout: past completed events (excluding this one) with check-ins.
  // We compute totalAttended and totalApproved across all such events.
  const pastEventIds = await Event.find({
    _id: { $ne: eventId },
    endDateTime: { $lt: now },
  }).select('_id').lean();

  let totalAttended = 0;
  let totalApproved = 0;

  if (pastEventIds.length > 0) {
    const ids = pastEventIds.map(e => e._id);

    const [attendedCount, approvedCount] = await Promise.all([
      Attendance.countDocuments({ event: { $in: ids } }),
      EventRegistration.countDocuments({ event: { $in: ids }, status: 'approved' }),
    ]);
    totalAttended = attendedCount;
    totalApproved = approvedCount;
  }

  return {
    registered,
    approved,
    capacity: event.capacity,
    totalAttended,
    totalApproved,
    daysLeft,
    pace,
    actualAttended,
  };
}

module.exports = { computeForecast, loadForecastInputs };
