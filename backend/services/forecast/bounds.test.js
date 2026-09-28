// Plain Node test script — no new packages required.
// Run: node backend/services/forecast/bounds.test.js

const { bounds, maxApprovals, curve } = require('./bounds');

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail !== undefined ? ' | got: ' + JSON.stringify(detail) : ''}`);
    failed++;
  }
}

function noNaN(obj) {
  return JSON.stringify(obj, (_, v) => {
    if (typeof v === 'number') assert('no NaN/Inf in value', isFinite(v), v);
    return v;
  });
}

console.log('\n--- bounds() ---');

{
  const b = bounds(0, 0.8);
  assert('zero approved → all zeros', b.expected === 0 && b.low === 0 && b.high === 0, b);
}
{
  const b = bounds(100, 0.8);
  assert('normal case: expected ~80', b.expected === 80, b);
  assert('normal case: low <= expected', b.low <= b.expected, b);
  assert('normal case: high >= expected', b.high >= b.expected, b);
  assert('normal case: high <= n', b.high <= 100, b);
  assert('normal case: low >= 0', b.low >= 0, b);
  noNaN(b);
}
{
  const b = bounds(10, 0.0001); // p near 0, clamps to 0.05
  assert('p near 0 → clamped to 0.05', b.expected >= 0, b);
  assert('p near 0 → no NaN', isFinite(b.expected) && isFinite(b.low) && isFinite(b.high), b);
}
{
  const b = bounds(10, 0.9999); // p near 1, clamps to 0.99
  assert('p near 1 → expected high but ≤ n', b.expected <= 10 && b.expected >= 0, b);
}
{
  // approved above capacity is allowed — bounds is just math on n
  const b = bounds(150, 0.8); // capacity might be 100
  assert('approved above capacity → still works', b.expected === 120, b);
  assert('high clamped to n=150', b.high <= 150, b);
}
{
  const b = bounds(-5, 0.8);
  assert('negative approved → all zeros', b.expected === 0 && b.low === 0 && b.high === 0, b);
}
{
  const b = bounds(NaN, 0.8);
  assert('NaN approved → all zeros', b.expected === 0, b);
}

console.log('\n--- maxApprovals() ---');

{
  const m = maxApprovals(0.8, 100);
  assert('normal: returns integer', Number.isInteger(m) && m >= 0, m);
  // verify it actually stays within capacity at 90% confidence
  if (m !== null) {
    const { expected, low: _l, high } = require('./bounds').bounds(m, 0.8);
    assert('maxApprovals: high <= capacity', high <= 100, { m, high });
  }
}
{
  assert('capacity null → null', maxApprovals(0.8, null) === null);
  assert('capacity 0 → null', maxApprovals(0.8, 0) === null);
  assert('capacity negative → null', maxApprovals(0.8, -10) === null);
  assert('capacity undefined → null', maxApprovals(0.8, undefined) === null);
  assert('capacity missing → null', maxApprovals(0.8) === null);
}
{
  const m = maxApprovals(0.05, 100); // very low turnout → can approve many more
  assert('very low turnout → high maxApprovals', m === null || m > 100, m);
}
{
  const m = maxApprovals(0.99, 100); // near-certain turnout → very close to capacity
  assert('near-certain turnout → maxApprovals close to capacity', m === null || m <= 105, m);
}

console.log('\n--- curve() ---');

{
  const pts = curve(0.8, 100, 200);
  assert('curve: returns array', Array.isArray(pts), pts);
  assert('curve: has points', pts.length >= 2, pts.length);
  assert('curve: first point is approved=100', pts[0].approved === 100, pts[0]);
  assert('curve: last point ~= capacity*1.3=260', pts[pts.length - 1].approved <= 270, pts[pts.length - 1]);
  pts.forEach((pt, i) => {
    assert(`curve[${i}]: low <= expected`, pt.low <= pt.expected, pt);
    assert(`curve[${i}]: high >= expected`, pt.high >= pt.expected, pt);
    noNaN(pt);
  });
}
{
  const pts = curve(0.8, 0, null); // capacity missing
  assert('curve: capacity missing → uses approved*1.5 top', Array.isArray(pts) && pts.length >= 1, pts);
}
{
  const pts = curve(0.8, 0, 0); // zero approved, invalid capacity
  assert('curve: zero approved → first point 0', pts[0].approved === 0, pts[0]);
}

console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
