import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Loader, QrCode, MessageSquare } from 'lucide-react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import QRCodeDisplay from './QRCodeDisplay';
import FeedbackForm from './FeedbackForm';

const UserDashboard = () => {
  const [myEvents, setMyEvents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFeedback, setShowFeedback] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const { data } = await API.get('/api/events/user/my-events');
      setMyEvents(data);

      // Check attendance for each event
      data.forEach(event => checkAttendance(event._id));
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkAttendance = async (eventId) => {
    try {
      const { data } = await API.get(`/api/attendance/event/${eventId}`);
      const userAttended = data.attendance.find(a => a.user._id === JSON.parse(localStorage.getItem('userInfo'))._id);
      if (userAttended) {
        setAttendance(prev => ({ ...prev, [eventId]: userAttended }));
      }
    } catch (error) {
      // Not attended yet
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      live: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return badges[status] || badges.upcoming;
  };

  const getRegistrationBadge = (status) => {
    const badges = {
      approved: { bg: 'bg-green-500/20 text-green-400', icon: CheckCircle, text: 'Approved' },
      pending: { bg: 'bg-yellow-500/20 text-yellow-400', icon: Clock, text: 'Pending' },
      rejected: { bg: 'bg-red-500/20 text-red-400', icon: XCircle, text: 'Rejected' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent mb-4">
            My Events
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            Track all your registered events in one place
          </p>
        </div>

        {/* Events Grid */}
        {myEvents.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-6">Start exploring and join exciting events!</p>
            <button
              onClick={() => navigate('/events')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myEvents.map((event) => {
              const StatusBadge = getRegistrationBadge(event.registrationStatus);
              const StatusIcon = StatusBadge.icon;
              const hasAttended = attendance[event._id];

              return (
                <div
                  key={event._id}
                  className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all"
                >
                  {/* Event Image */}
                  <div className="relative h-40 sm:h-48 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 overflow-hidden">
                    {event.coverImage ? (
                      <img src={event.coverImage} alt={event.eventName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border text-xs font-semibold ${getStatusBadge(event.eventStatus)}`}>
                      {event.eventStatus}
                    </div>
                    {hasAttended && (
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-green-500/90 text-white text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Attended
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                      {event.eventName}
                    </h3>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center text-gray-400">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(event.startDateTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {event.locationType === 'online' ? 'Online Event' : event.locationValue}
                        </span>
                      </div>
                    </div>

                    {/* Registration Status */}
                    <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg mb-4 ${StatusBadge.bg}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{StatusBadge.text}</span>
                    </div>

                    {/* Pending Status Message */}
                    {event.registrationStatus === 'pending' && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-sm">
                        <p className="text-yellow-300">⏳ <strong>Awaiting Admin Approval</strong></p>
                        <p className="text-yellow-200 text-xs mt-1">Your registration is pending. Once approved by an admin, you'll receive an email with your QR code.</p>
                      </div>
                    )}

                    {/* Rejected Status Message */}
                    {event.registrationStatus === 'rejected' && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-sm">
                        <p className="text-red-300">❌ <strong>Registration Rejected</strong></p>
                        <p className="text-red-200 text-xs mt-1">Unfortunately, your registration for this event could not be approved.</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {event.registrationStatus === 'approved' && (
                      <div className="space-y-2">
                        <button
                          onClick={() => navigate(`/events/${event._id}`)}
                          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          🚀 Enter Event Room
                        </button>

                        <button
                          onClick={() => setSelectedEvent(selectedEvent === event.registrationId ? null : event.registrationId)}
                          className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <QrCode className="w-4 h-4" />
                          {selectedEvent === event.registrationId ? 'Hide QR Code' : 'Show QR Code'}
                        </button>

                        {hasAttended && !hasAttended.feedbackSubmitted && (
                          <button
                            onClick={() => setShowFeedback(showFeedback === event._id ? null : event._id)}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {showFeedback === event._id ? 'Hide Feedback' : 'Give Feedback'}
                          </button>
                        )}

                        {hasAttended && hasAttended.feedbackSubmitted && (
                          <div className="text-center py-2 text-green-400 text-sm">
                            ✅ Feedback submitted - Thank you!
                          </div>
                        )}
                      </div>
                    )}

                    {/* QR Code Display */}
                    {selectedEvent === event.registrationId && (
                      <div className="mt-4">
                        <QRCodeDisplay
                          registrationId={event.registrationId}
                          eventName={event.eventName}
                        />
                      </div>
                    )}

                    {/* Feedback Form */}
                    {showFeedback === event._id && (
                      <div className="mt-4">
                        <FeedbackForm
                          eventId={event._id}
                          eventName={event.eventName}
                          onSubmitSuccess={() => {
                            setShowFeedback(null);
                            fetchMyEvents();
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
