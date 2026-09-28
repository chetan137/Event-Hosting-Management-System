import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Users, Clock, Filter, Search, Loader, Sparkles, X, Tag, Globe, CheckCircle2 } from 'lucide-react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const QUICK_SEMANTIC_PRESETS = [
  { label: '⚡ Tech & Coding', query: 'tech coding workshop' },
  { label: '🎟️ Free Events', query: 'free admission' },
  { label: '🌐 Online / Remote', query: 'online virtual' },
  { label: '📍 In-Person', query: 'in-person venue' },
  { label: '🤝 Networking', query: 'networking meetup' },
  { label: '📅 This Weekend', query: 'weekend' },
];

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningEvent, setJoiningEvent] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSemanticChip, setActiveSemanticChip] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const info = localStorage.getItem('userInfo');
    if (info) {
      setUserInfo(JSON.parse(info));
    }
    fetchEvents();
  }, [statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all'
        ? '/api/events'
        : `/api/events?status=${statusFilter}`;
      const { data } = await API.get(url);
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Team Alpha FE F-02: Smart Event Search & Semantic Query Engine
  const parsedIntent = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return null;

    const intents = [];
    if (query.includes('free') || query.includes('0') || query.includes('no cost')) {
      intents.push({ type: 'price', label: 'Free Admission' });
    }
    if (query.includes('paid') || query.includes('ticket') || query.includes('fee')) {
      intents.push({ type: 'price', label: 'Ticketed / Paid' });
    }
    if (query.includes('online') || query.includes('virtual') || query.includes('remote') || query.includes('zoom')) {
      intents.push({ type: 'format', label: 'Virtual Event' });
    }
    if (query.includes('in-person') || query.includes('offline') || query.includes('venue') || query.includes('hall')) {
      intents.push({ type: 'format', label: 'In-Person Venue' });
    }
    if (query.includes('tech') || query.includes('coding') || query.includes('software') || query.includes('ai') || query.includes('hackathon')) {
      intents.push({ type: 'topic', label: 'Technology' });
    }
    if (query.includes('network') || query.includes('meetup') || query.includes('community') || query.includes('connect')) {
      intents.push({ type: 'topic', label: 'Networking & Community' });
    }
    if (query.includes('weekend')) {
      intents.push({ type: 'timing', label: 'Weekend Timing' });
    }
    return intents;
  }, [searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return events.map(e => ({ ...e, matchReason: null }));
    }

    const query = searchQuery.toLowerCase().trim();
    const queryTokens = query.split(/\s+/).filter(t => t.length > 1);

    return events
      .map(event => {
        const name = (event.eventName || '').toLowerCase();
        const desc = (event.description || '').toLowerCase();
        const loc = (event.locationValue || '').toLowerCase();
        const theme = (event.theme || '').toLowerCase();
        const eventDate = new Date(event.startDateTime);
        const isWeekend = eventDate.getDay() === 0 || eventDate.getDay() === 6;

        let score = 0;
        const reasons = [];

        // Direct Substring Matches
        if (name.includes(query)) {
          score += 15;
          reasons.push('Title match');
        } else if (queryTokens.some(t => name.includes(t))) {
          score += 8;
          reasons.push('Title keyword');
        }

        if (desc.includes(query)) {
          score += 10;
          reasons.push('Description match');
        } else if (queryTokens.some(t => desc.includes(t))) {
          score += 5;
        }

        if (loc.includes(query)) {
          score += 8;
          reasons.push('Location match');
        }

        // Semantic Intent Matches
        if ((query.includes('free') || query.includes('no cost')) && event.ticketType === 'free') {
          score += 7;
          reasons.push('Free Entry');
        }

        if ((query.includes('online') || query.includes('virtual') || query.includes('remote')) && event.locationType === 'online') {
          score += 7;
          reasons.push('Virtual Format');
        }

        if ((query.includes('in-person') || query.includes('offline')) && event.locationType === 'offline') {
          score += 7;
          reasons.push('In-Person Venue');
        }

        if (query.includes('weekend') && isWeekend) {
          score += 8;
          reasons.push('Happening Weekend');
        }

        if (theme.includes(query) || (theme && queryTokens.some(t => theme.includes(t)))) {
          score += 6;
          reasons.push(`Theme: ${event.theme}`);
        }

        return {
          ...event,
          semanticScore: score,
          matchReason: reasons.length > 0 ? reasons.slice(0, 2).join(' • ') : null
        };
      })
      .filter(event => event.semanticScore > 0)
      .sort((a, b) => b.semanticScore - a.semanticScore);
  }, [events, searchQuery]);

  const handleApplyPreset = (preset) => {
    if (activeSemanticChip === preset.label) {
      setActiveSemanticChip('');
      setSearchQuery('');
    } else {
      setActiveSemanticChip(preset.label);
      setSearchQuery(preset.query);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSemanticChip('');
  };

  const handleJoinEvent = async (eventId) => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      window.showToast('Please login first', 'info', 2000);
      navigate('/login');
      return;
    }

    try {
      setJoiningEvent(eventId);
      try {
        await API.post(`/api/events/${eventId}/register`);
        window.showToast('Successfully registered! Welcome to the event 🎉', 'success', 2000);
      } catch (regError) {
        if (regError.response?.status === 400 && regError.response?.data?.message?.includes('already')) {
          window.showToast('You have already requested to join. Checking status... 🚀', 'info', 2000);
        } else {
          throw regError;
        }
      }
      setTimeout(() => {
        navigate(`/events/${eventId}`);
      }, 500);
    } catch (error) {
      window.showToast(error.response?.data?.message || 'Failed to register for event', 'error', 3000);
    } finally {
      setJoiningEvent(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      live: 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return badges[status] || badges.upcoming;
  };

  const isEventEnded = (event) => {
    const endTime = new Date(event.endDateTime);
    return new Date() > endTime;
  };

  const isRegistrationClosed = (event) => {
    if (!event.registrationDeadline) return false;
    const deadline = new Date(event.registrationDeadline);
    return new Date() > deadline;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} />
              AI-Powered Discovery
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent mb-3 sm:mb-4">
            Discover Events
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
            Find and join events with Smart Semantic Query. Search naturally by topic, format, pricing, or timing.
          </p>
        </div>

        {/* F-02: Smart Semantic Search & Intent Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 animate-pulse" />
              <input
                type="text"
                placeholder="Ask naturally e.g. 'free tech workshops', 'virtual networking', 'in-person this weekend'..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveSemanticChip('');
                }}
                className="w-full pl-12 pr-10 py-3.5 bg-[#1E1E1E] border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm sm:text-base shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              {['all', 'upcoming', 'live', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-5 py-3 rounded-2xl font-semibold text-sm sm:text-base whitespace-nowrap transition-all ${
                    statusFilter === status
                      ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-lg shadow-cyan-500/20'
                      : 'bg-[#1E1E1E] text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Semantic Quick Intent Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-gray-500 font-medium mr-1 flex items-center gap-1">
              <Tag size={12} />
              Semantic Suggestions:
            </span>
            {QUICK_SEMANTIC_PRESETS.map((preset) => {
              const isSelected = activeSemanticChip === preset.label || searchQuery === preset.query;
              return (
                <button
                  key={preset.label}
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-500 text-black font-semibold shadow-md shadow-cyan-500/30 scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-cyan-500/30'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Active Semantic Intent Detection Bar */}
          {parsedIntent && parsedIntent.length > 0 && (
            <div className="flex items-center gap-2 text-xs bg-cyan-950/30 border border-cyan-500/30 rounded-xl px-4 py-2 text-cyan-300">
              <Sparkles size={14} className="text-cyan-400 flex-shrink-0" />
              <span className="font-semibold text-white">Detected Intents:</span>
              <div className="flex flex-wrap gap-1.5">
                {parsedIntent.map((intent, idx) => (
                  <span key={idx} className="bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-200 border border-cyan-500/30">
                    {intent.label}
                  </span>
                ))}
              </div>
              <span className="ml-auto text-gray-400">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event matched' : 'events matched'}
              </span>
            </div>
          )}
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-[#1E1E1E] rounded-3xl p-12 text-center border border-white/10 shadow-xl">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No matching events found</h3>
            <p className="text-gray-400 mb-4 max-w-md mx-auto">
              We couldn't find events matching "{searchQuery}". Try searching with broader semantic keywords like "tech", "free", or "weekend".
            </p>
            <button
              onClick={handleClearSearch}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-[#1E1E1E] rounded-3xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all group hover:-translate-y-1.5 duration-300 shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Event Image */}
                  <div className="relative h-48 sm:h-52 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 overflow-hidden group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-shadow">
                    {event.coverImage ? (
                      <img
                        src={event.coverImage}
                        alt={event.eventName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-gray-600" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full border backdrop-blur-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(event.status)}`}>
                      {event.status}
                    </div>

                    {/* Price Tag */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border text-xs font-bold flex items-center gap-1">
                      {event.ticketType === 'paid' ? (
                        <span className="text-yellow-400 border-yellow-500/30">₹{event.ticketPrice}</span>
                      ) : (
                        <span className="text-emerald-400 border-emerald-500/30">Free</span>
                      )}
                    </div>

                    {/* F-02 Semantic Match Badge */}
                    {event.matchReason && (
                      <div className="absolute bottom-3 left-3 right-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-cyan-500/40 text-[11px] font-medium text-cyan-300 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-cyan-400 flex-shrink-0" />
                        <span className="truncate">Match: {event.matchReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="p-5 sm:p-6 pb-2">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {event.eventName}
                    </h3>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                      {event.description || 'No description available for this event.'}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-400 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mr-3 flex-shrink-0">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="truncate">
                          {new Date(event.startDateTime).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-400 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mr-3 flex-shrink-0">
                          <MapPin className="w-4 h-4 text-pink-400" />
                        </div>
                        <span className="truncate">
                          {event.locationType === 'online' ? 'Online Virtual Event' : event.locationValue}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-400 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mr-3 flex-shrink-0">
                          <Users className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="truncate">
                          {event.registeredUsers} registered
                          {event.capacity && <span className="text-gray-500"> • {event.spotsLeft} spots left</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="p-5 sm:p-6 pt-0">
                  <button
                    onClick={() => handleJoinEvent(event._id)}
                    disabled={joiningEvent === event._id || isEventEnded(event) || isRegistrationClosed(event) || (event.capacity && event.spotsLeft === 0) || userInfo?.role === 'admin'}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all uppercase ${
                      userInfo?.role === 'admin'
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                        : isEventEnded(event)
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                        : isRegistrationClosed(event)
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                        : joiningEvent === event._id
                        ? 'bg-gray-700 text-white cursor-wait'
                        : event.capacity && event.spotsLeft === 0
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                        : 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95'
                    }`}
                  >
                    {userInfo?.role === 'admin' ? (
                      'Admin View Only'
                    ) : isEventEnded(event) ? (
                      'Event Ended'
                    ) : isRegistrationClosed(event) ? (
                      'Registration Closed'
                    ) : joiningEvent === event._id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : event.capacity && event.spotsLeft === 0 ? (
                      'Sold Out'
                    ) : (
                      'Join Event'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
