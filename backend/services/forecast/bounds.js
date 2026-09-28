// Pure math helpers for attendance forecast.
// No DB access, no Express — safe to unit-test in isolation.

const ZETA = 1.28; // z-score for ~80% confidence interval

/** Clamp a value to [min, max]. */
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/**
 * 80% confidence bounds for attendance given n approvals and turnout rate p.
 * Returns { expected, low, high }, all integers in [0, n].
 */
function bounds(n, p) {
  const safeN = Number(n) || 0;
  const safeP = clamp(Number(p) || 0, 0.05, 0.99);
  if (safeN <= 0) return { expected: 0, low: 0, high: 0 };

  const mean = safeN * safeP;
  const sd = Math.sqrt(safeN * safeP * (1 - safeP));
  return {
    expected: clamp(Math.round(mean), 0, safeN),
    low: clamp(Math.round(mean - ZETA * sd), 0, safeN),
    high: clamp(Math.round(mean + ZETA * sd), 0, safeN),
  };
}

/**
 * Largest integer N in [0, capacity*2] such that the 90th-percentile
 * attendance (expected + 1.28*sd) stays within capacity.
 * Returns null when capacity is missing, 0 or negative.
 */
function maxApprovals(p, capacity) {
  const cap = Number(capacity);
  if (!cap || cap <= 0 || !isFinite(cap)) return null;

  const safeP = clamp(Number(p) || 0, 0.05, 0.99);
  const limit = Math.floor(cap * 2);

  for (let n = limit; n >= 0; n--) {
    const mean = n * safeP;
    const sd = Math.sqrt(n * safeP * (1 - safeP));
    if (mean + ZETA * sd <= cap) return n;
  }
  return 0;
}

/**
 * ~10 evenly spaced {approved, expected, low, high} points from `approved`
 * up to capacity*1.3 (or approved*1.5 when capacity is invalid).
 * Used to drive the what-if slider on the frontend.
 */
function curve(p, approved, capacity) {
  const safeApproved = Math.max(0, Math.round(Number(approved) || 0));
  const safeP = clamp(Number(p) || 0, 0.05, 0.99);
  const cap = Number(capacity);
  const validCap = cap && cap > 0 && isFinite(cap);

  const topEnd = validCap
    ? Math.round(cap * 1.3)
    : Math.round(safeApproved * 1.5);

  // Need at least 2 distinct points; if approved === topEnd, add one step.
  const steps = 10;
  const range = topEnd - safeApproved;
  const step = range > 0 ? Math.ceil(range / (steps - 1)) : 1;
  const points = [];

  for (let i = 0; i < steps; i++) {
    const n = safeApproved + i * step;
    if (n > topEnd && points.length >= 2) break;
    points.push({ approved: n, ...bounds(n, safeP) });
  }

  // Always include the topEnd point if not already there.
  if (points.length === 0 || points[points.length - 1].approved < topEnd) {
    points.push({ approved: topEnd, ...bounds(topEnd, safeP) });
  }

  return points;
}

module.exports = { bounds, maxApprovals, curve };
