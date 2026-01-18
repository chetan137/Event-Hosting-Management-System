import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Filter, Search, Loader } from 'lucide-react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningEvent, setJoiningEvent] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user info from localStorage
    const info = localStorage.getItem('userInfo');
    if (info) {
      setUserInfo(JSON.parse(info));
    }
    fetchEvents();
  }, [statusFilter]);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery]);

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

  const filterEvents = () => {
    let filtered = events;
    if (searchQuery) {
      filtered = events.filter(event =>
        event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredEvents(filtered);
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
        // If already registered, just proceed to event room, or maybe waiting for approval
        if (regError.response?.status === 400 && regError.response?.data?.message?.includes('already')) {
           // Check if approved or pending. Usually backend just says "already registered".
           // We'll just toast info.
           window.showToast('You have already requested to join. Checking status... 🚀', 'info', 2000);
        } else {
          throw regError;
        }
      }
      // Redirect to event detail page
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
        <div className="mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent mb-3 sm:mb-4">
            Discover Events
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
            Find and join amazing events happening around you. Join the community and experience the future of events.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by event name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors text-sm sm:text-base"
            />
          </div>

          {/* Status Filter - Scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            {['all', 'upcoming', 'live', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-5 py-3 rounded-xl font-semibold text-sm sm:text-base whitespace-nowrap transition-all ${
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

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-[#1E1E1E] rounded-2xl p-12 text-center border border-white/10">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all group hover:-translate-y-1 duration-300 shadow-xl"
              >
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
                  {event.ticketType === 'paid' && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-yellow-400 border border-yellow-500/30 text-xs font-bold flex items-center gap-1">
                      <span>₹{event.ticketPrice}</span>
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="p-5 sm:p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {event.eventName}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {event.description || 'No description available for this event.'}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-400 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 flex-shrink-0">
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
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 flex-shrink-0">
                        <MapPin className="w-4 h-4 text-pink-400" />
                      </div>
                      <span className="truncate">
                        {event.locationType === 'online' ? 'Online Event' : event.locationValue}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-400 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 flex-shrink-0">
                        <Users className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="truncate">
                        {event.registeredUsers} registered
                        {event.capacity && <span className="text-gray-500"> • {event.spotsLeft} spots left</span>}
                      </span>
                    </div>
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={() => handleJoinEvent(event._id)}
                    disabled={joiningEvent === event._id || isEventEnded(event) || isRegistrationClosed(event) || (event.capacity && event.spotsLeft === 0) || userInfo?.role === 'admin'}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all uppercase ${
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
