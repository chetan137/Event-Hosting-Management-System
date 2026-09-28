import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  ArrowLeft, AlertTriangle, AlertCircle, CheckCircle,
  TrendingUp, Info, RefreshCw, Sliders,
} from 'lucide-react';
import API from '../services/api';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Filler, Title, Tooltip, Legend,
);

// No-op tracking stub — Data Analytics team will wire the real endpoint.
const track = (payload) => { try { void payload; } catch (_) {} };

const safeNum = (v, fb = 0) => { const n = Number(v); return isFinite(n) ? n : fb; };

// ─── Loading ─────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="min-h-screen bg-[#121212] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-400">Loading forecast...</p>
    </div>
  </div>
);

// ─── Error ────────────────────────────────────────────────────────────────────
const ErrorState = ({ msg, onRetry }) => (
  <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <p className="text-red-400 mb-4">{msg}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 mx-auto"
      >
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  </div>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color }) => (
  <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-4">
    <p className="text-gray-500 text-xs font-semibold tracking-widest mb-1">{label}</p>
    <p className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-gray-500 text-xs mt-1">{sub}</p>
  </div>
);

// ─── Alert configs ────────────────────────────────────────────────────────────
const ALERT = {
  over: {
    bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400',
    Icon: AlertTriangle, label: 'OVER CAPACITY',
    msg: 'Predicted attendance may exceed capacity. Consider capping approvals.',
  },
  near: {
    bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400',
    Icon: AlertTriangle, label: 'NEAR CAPACITY',
    msg: 'Predicted attendance is near capacity (≥90%). Monitor closely.',
  },
  none: {
    bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400',
    Icon: CheckCircle, label: 'CAPACITY OK',
    msg: 'Predicted attendance is comfortably within venue capacity.',
  },
};

// ─── Main component ───────────────────────────────────────────────────────────
const AttendanceForecast = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sliderIdx, setSliderIdx] = useState(0);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError('');
    try {
      track({ event_name: 'forecast_viewed', action_type: 'forecast_viewed', timestamp: new Date().toISOString(), metadata: { eventId } });
      const { data } = await API.get(`/api/analytics/event/${eventId}/attendance-forecast`, { signal: ctrl.signal });
      setForecast(data);
      setSliderIdx(0);
      track({ event_name: 'forecast_loaded', action_type: 'forecast_loaded', timestamp: new Date().toISOString(), metadata: { eventId, source: data.source } });
      if (data.capacityAlert !== 'none') {
        track({ event_name: 'capacity_alert_shown', action_type: 'capacity_alert_shown', timestamp: new Date().toISOString(), metadata: { eventId, capacityAlert: data.capacityAlert } });
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      setError(err.response?.data?.message || 'Failed to load attendance forecast');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState msg={error} onRetry={load} />;
  if (!forecast) return null;

  const {
    capacity, registered, approved, approvalRatio,
    actualAttended, projectedApproved, turnoutRate,
    predictedTurnout, predictedDropouts,
    range = {}, recommendation, curve = [],
    source, capacityAlert,
  } = forecast;

  const validCap = safeNum(capacity) > 0;
  const capUtil = validCap ? Math.round((safeNum(predictedTurnout) / safeNum(capacity)) * 100) : null;
  const alertCfg = ALERT[capacityAlert] || ALERT.none;
  const sliderPt = curve[sliderIdx] ?? curve[0] ?? null;

  // ── Bar chart: predicted vs actual ─────────────────────────────────────────
  const barData = {
    labels: ['Range Low', 'Predicted Turnout', 'Range High', 'Actual Attended'],
    datasets: [{
      label: 'Attendance',
      data: [
        safeNum(range.low),
        safeNum(predictedTurnout),
        safeNum(range.high),
        actualAttended !== null ? safeNum(actualAttended) : null,
      ],
      backgroundColor: [
        'rgba(0,255,255,0.25)',
        'rgba(0,255,255,0.8)',
        'rgba(0,255,255,0.25)',
        actualAttended !== null ? 'rgba(255,0,204,0.8)' : 'rgba(255,255,255,0.05)',
      ],
      borderColor: [
        'rgba(0,255,255,0.5)',
        'rgb(0,255,255)',
        'rgba(0,255,255,0.5)',
        actualAttended !== null ? 'rgb(255,0,204)' : 'rgba(255,255,255,0.1)',
      ],
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ctx.raw !== null ? `${ctx.raw} attendees` : 'Not yet available' } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  // ── Line chart: what-if curve ───────────────────────────────────────────────
  const curveLabels = curve.map((pt) => `${pt.approved}`);
  const lineData = {
    labels: curveLabels,
    datasets: [
      {
        label: 'Range (80% CI)',
        data: curve.map((pt) => pt.high),
        borderColor: 'rgba(0,255,255,0.3)',
        backgroundColor: 'rgba(0,255,255,0.07)',
        fill: '+1',
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Expected',
        data: curve.map((pt) => pt.expected),
        borderColor: 'rgb(0,255,255)',
        backgroundColor: 'rgba(0,255,255,0.2)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'Range Low',
        data: curve.map((pt) => pt.low),
        borderColor: 'rgba(168,85,247,0.3)',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
      ...(validCap ? [{
        label: 'Capacity',
        data: curve.map(() => safeNum(capacity)),
        borderColor: 'rgba(239,68,68,0.5)',
        borderDash: [6, 3],
        fill: false,
        pointRadius: 0,
        borderWidth: 1.5,
      }] : []),
    ],
  };

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 11 }, boxWidth: 12 } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      x: { title: { display: true, text: 'Approvals', color: '#6b7280' }, ticks: { color: '#9ca3af', maxTicksLimit: 6 }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  return (
    <div className="min-h-screen bg-[#121212] p-4 sm:p-6 lg:p-8"> <br /><br /><br />
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2">
              <ArrowLeft size={20} /> Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="text-cyan-400" /> Attendance Analytics
            </h1>
            <p className="text-gray-400 text-sm mt-1">AI-powered turnout prediction &amp; event capacity insights</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {source === 'fallback' && (
              <span className="px-3 py-1.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs rounded-full flex items-center gap-1.5">
                <Info size={12} /> Demo data — values are illustrative, not production statistics.
              </span>
            )}
            <button onClick={load} title="Refresh" className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="TOTAL REGISTRATIONS" value={safeNum(registered)} sub={`${safeNum(approved)} approved`} color="text-white" />
          <StatCard label="APPROVAL RATE" value={`${Math.round(safeNum(approvalRatio) * 100)}%`} sub={`${safeNum(approved)} approved`} color="text-cyan-400" />
          <StatCard label="PREDICTED ATTENDANCE" value={safeNum(predictedTurnout)} sub="Expected turnout" color="text-purple-400" />
          <StatCard label="PREDICTED DROPOUTS" value={safeNum(predictedDropouts)} sub={`${Math.round(safeNum(1 - safeNum(turnoutRate)) * 100)}% of approved`} color="text-pink-400" />
        </div>

        {/* Bar Chart + Forecast Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-3 bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-1">Predicted vs Actual Attendance</h3>
            <p className="text-gray-500 text-sm mb-4">Turnout comparison with 80% confidence range</p>
            <div className="h-64">
              <Bar data={barData} options={barOpts} />
            </div>
            <p className="text-gray-600 text-xs mt-3 flex items-center gap-1">
              <Info size={11} /> Estimate based on past events. Accuracy improves with more data.
            </p>
          </div>

          {/* Forecast Summary Panel */}
          <div className="lg:col-span-2 bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-cyan-400 text-xs font-semibold tracking-widest mb-3">⚡ AI ATTENDANCE FORECAST</p>
              <p className="text-5xl font-black text-cyan-400 leading-none mb-1">{safeNum(predictedTurnout)}</p>
              <p className="text-gray-400 text-sm mb-4">predicted attendees</p>

              {validCap
                ? <p className="text-white text-sm mb-4"><span className="font-bold">{capUtil}%</span><span className="text-gray-400"> capacity utilization</span></p>
                : <p className="text-gray-500 text-sm mb-4">Capacity not set</p>
              }

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-cyan-400 font-bold text-xl">{safeNum(approved)}</p>
                  <p className="text-gray-500 text-xs">Approved registrations</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-pink-400 font-bold text-xl">{safeNum(predictedDropouts)}</p>
                  <p className="text-gray-500 text-xs">Expected dropouts</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-1">Actual Attended</p>
                {actualAttended !== null
                  ? <p className="text-white font-bold text-lg">{safeNum(actualAttended)}</p>
                  : <p className="text-gray-500 text-sm italic">Not yet available</p>
                }
              </div>
            </div>

            <p className="text-gray-600 text-xs flex items-center gap-1 mt-4">
              <Info size={10} /> Prediction based on registration pace and historical event data.
              {source === 'fallback' && ' (Demo estimate — prediction model not yet connected.)'}
            </p>
          </div>
        </div>

        {/* Registration Approval + Venue Capacity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Registration Approval */}
          <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
            <p className="text-gray-500 text-xs font-semibold tracking-widest mb-3">REGISTRATION APPROVAL</p>
            <p className="text-4xl font-bold text-white mb-3">{Math.round(safeNum(approvalRatio) * 100)}%</p>
            <div className="w-full bg-white/10 rounded-full h-2 mb-5">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 transition-all"
                style={{ width: `${Math.min(100, Math.round(safeNum(approvalRatio) * 100))}%` }}
              />
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Approved', count: safeNum(approved), color: 'bg-cyan-500' },
                { label: 'Registered', count: safeNum(registered), color: 'bg-purple-500' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-gray-400">{label}</span>
                  </div>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Venue Capacity */}
          <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
            <p className="text-gray-500 text-xs font-semibold tracking-widest mb-3">VENUE CAPACITY</p>
            {validCap ? (
              <>
                <p className="text-4xl font-bold text-white mb-1">
                  {safeNum(predictedTurnout)}
                  <span className="text-gray-500 text-2xl font-normal"> / {safeNum(capacity)}</span>
                </p>
                <p className="text-gray-400 text-sm mb-4">{capUtil}% capacity utilization</p>
                <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      capUtil >= 100 ? 'bg-red-500' : capUtil >= 90 ? 'bg-yellow-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, safeNum(capUtil))}%` }}
                  />
                </div>
                <p className="text-gray-400 text-sm">
                  Remaining capacity:{' '}
                  <span className="text-white font-semibold">
                    {Math.max(0, safeNum(capacity) - safeNum(predictedTurnout))} seats
                  </span>
                </p>
              </>
            ) : (
              <p className="text-gray-500 italic text-sm pt-2">Capacity not set for this event</p>
            )}
          </div>
        </div>

        {/* What-If Simulator (SHOULD) */}
        {recommendation && validCap && curve.length > 1 && (
          <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sliders className="text-purple-400" size={20} />
              Overbooking What-If Simulator
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              Approve up to{' '}
              <span className="text-cyan-400 font-bold">{recommendation.maxApprovals}</span>{' '}
              registrations to stay within capacity (~90% confidence).
            </p>

            {/* Line chart of curve */}
            <div className="h-48 mb-5">
              <Line data={lineData} options={lineOpts} />
            </div>

            {/* Slider */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{curve[0]?.approved} approvals</span>
                <span>{curve[curve.length - 1]?.approved} approvals</span>
              </div>
              <input
                type="range"
                min={0}
                max={curve.length - 1}
                value={sliderIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setSliderIdx(idx);
                  track({ event_name: 'whatif_used', action_type: 'whatif_used', timestamp: new Date().toISOString(), metadata: { eventId, approved: curve[idx]?.approved } });
                }}
                className="w-full accent-cyan-400"
              />
            </div>

            {sliderPt && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Approvals', value: sliderPt.approved, color: 'text-white' },
                  { label: 'Expected', value: sliderPt.expected, color: 'text-cyan-400' },
                  { label: 'Low (80%)', value: sliderPt.low, color: 'text-green-400' },
                  { label: 'High (80%)', value: sliderPt.high, color: sliderPt.high > safeNum(capacity) ? 'text-red-400' : 'text-yellow-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-gray-500 text-xs">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {sliderPt && sliderPt.high > safeNum(capacity) && (
              <p className="text-red-400 text-xs mt-3 flex items-center gap-1">
                <AlertTriangle size={12} /> At this approval level, the high-end estimate exceeds capacity.
              </p>
            )}
          </div>
        )}

        {/* Capacity Alert Banner */}
        {validCap && (
          <div className={`${alertCfg.bg} ${alertCfg.border} border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <alertCfg.Icon className={alertCfg.text} size={20} />
              <div>
                <p className={`font-bold text-sm ${alertCfg.text}`}>{alertCfg.label}</p>
                <p className="text-gray-400 text-sm">{alertCfg.msg}</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm shrink-0">
              {safeNum(predictedTurnout)} expected attendees / {safeNum(capacity)} capacity
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AttendanceForecast;
