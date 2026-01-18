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
        // If already registered, just proceed to event room
        if (regError.response?.status === 400 && regError.response?.data?.message?.includes('already')) {
          window.showToast('You are already registered. Entering event room... 🚀', 'info', 2000);
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
    <div className="min-h-screen bg-[#121212] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent mb-4">
            Discover Events
          </h1>
          <p className="text-gray-400 text-lg">
            Find and join amazing events happening around you
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'upcoming', 'live', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white'
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
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400">No events found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all group"
              >
                {/* Event Image */}
                <div className="relative h-48 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 overflow-hidden">
                  {event.coverImage ? (
                    <img src={event.coverImage} alt={event.eventName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border text-xs font-semibold ${getStatusBadge(event.status)}`}>
                    {event.status}
                  </div>
                  {event.ticketType === 'paid' && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-semibold">
                      ₹{event.ticketPrice}
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {event.eventName}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {event.description || 'No description available'}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      {new Date(event.startDateTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {event.locationType === 'online' ? 'Online Event' : event.locationValue}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                      {event.registeredUsers} registered
                      {event.capacity && ` • ${event.spotsLeft} spots left`}
                    </div>
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={() => handleJoinEvent(event._id)}
                    disabled={joiningEvent === event._id || isEventEnded(event) || isRegistrationClosed(event) || (event.capacity && event.spotsLeft === 0) || userInfo?.role === 'admin'}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      userInfo?.role === 'admin'
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : isEventEnded(event)
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : isRegistrationClosed(event)
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : joiningEvent === event._id
                        ? 'bg-gray-600 cursor-not-allowed'
                        : event.capacity && event.spotsLeft === 0
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white hover:shadow-lg hover:shadow-cyan-500/20'
                    }`}
                  >
                    {userInfo?.role === 'admin' ? (
                      'Admin cannot join events'
                    ) : isEventEnded(event) ? (
                      'Event Ended'
                    ) : isRegistrationClosed(event) ? (
                      'Registration Closed'
                    ) : joiningEvent === event._id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Joining...
                      </span>
                    ) : event.capacity && event.spotsLeft === 0 ? (
                      'Event Full'
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
