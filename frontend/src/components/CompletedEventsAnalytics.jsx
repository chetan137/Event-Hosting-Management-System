import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, MessageSquare, Star, ChevronRight, Sparkles } from 'lucide-react';
import API from '../services/api';

const CompletedEventsAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompletedEvents();
  }, []);

  const fetchCompletedEvents = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/api/analytics/completed-events');
      setEvents(data.events);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load completed events');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading completed events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-4 sm:p-6 lg:p-8"> <br /><br /><br />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3 mb-2">
            <Sparkles className="text-cyan-400" />
            Completed Event Analytics
          </h1>
          <p className="text-gray-400">
            View AI-powered insights and feedback analysis for past events
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1E1E1E] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="text-cyan-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Events</p>
                <p className="text-white text-2xl font-bold">{events.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1E] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="text-pink-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Feedback</p>
                <p className="text-white text-2xl font-bold">
                  {events.reduce((sum, e) => sum + e.feedbackCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1E] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Analyzed Events</p>
                <p className="text-white text-2xl font-bold">
                  {events.filter(e => e.hasAnalytics).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-[#1E1E1E] rounded-2xl p-12 border border-white/10 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Completed Events</h3>
            <p className="text-gray-400">
              Completed events will appear here once they have ended
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/admin/analytics/${event.id}`)}
                className="bg-[#1E1E1E] rounded-xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {event.name}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {new Date(event.endDate).toLocaleDateString()} - Ended
                        </p>
                      </div>
                      <ChevronRight className="text-gray-600 group-hover:text-cyan-400 transition-colors" size={24} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Feedback Count</p>
                        <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-gray-400" />
                          <span className="text-white font-semibold">{event.feedbackCount}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs mb-1">Average Rating</p>
                        <div className="flex items-center gap-2">
                          <Star size={16} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-white font-semibold">
                            {event.averageRating > 0 ? event.averageRating.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs mb-1">AI Analysis</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          event.hasAnalytics
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {event.hasAnalytics ? (
                            <>
                              <Sparkles size={12} />
                              Available
                            </>
                          ) : (
                            'Pending'
                          )}
                        </span>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs mb-1">Last Analyzed</p>
                        <span className="text-gray-400 text-sm">
                          {event.lastAnalyzed
                            ? new Date(event.lastAnalyzed).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedEventsAnalytics;
