import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
  Plus,
  Activity,
  CheckCircle,
  Hourglass,
  Sparkles
} from 'lucide-react';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/api/admin/events');
      setEvents(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await API.delete(`/api/admin/events/${id}`);
        setEvents(events.filter(event => event._id !== id));
        window.showToast('Event deleted successfully', 'success', 2000);
      } catch (err) {
        console.error(err);
        window.showToast('Failed to delete event', 'error', 3000);
      }
    }
  };

  // Categorize events
  const now = new Date();
  const activeEvents = events.filter(e => new Date(e.startDateTime) <= now && new Date(e.endDateTime) >= now);
  const upcomingEvents = events.filter(e => new Date(e.startDateTime) > now);
  const finishedEvents = events.filter(e => new Date(e.endDateTime) < now);

  const EventCard = ({ event, type }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all group"
    >
      <div className="h-40 overflow-hidden relative">
        <img
          src={event.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80'}
          alt={event.eventName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase border border-white/10">
          {type}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{event.eventName}</h3>
        <p className="text-gray-400 text-sm line-clamp-2 mb-4 h-10">{event.description}</p>

        <div className="space-y-2 text-sm text-gray-400 mb-6">
          <div className="flex items-center space-x-2">
            <Calendar size={14} className="text-cyan-400" />
            <span>{new Date(event.startDateTime).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={14} className="text-cyan-400" />
            <span>{new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin size={14} className="text-cyan-400" />
            <span className="truncate">{event.locationValue}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
          <button
            onClick={() => navigate(`/admin/events/${event._id}/manage`)}
            className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            <Activity size={14} /> Manage & Scan
          </button>

          {type === 'Upcoming' && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/admin/edit/${event._id}`)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                onClick={() => handleDelete(event._id)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}

          {type !== 'Upcoming' && (
             <div className="mt-2 text-center">
               <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                 {type === 'Active' ? 'Happening Now' : 'Event Concluded'}
               </span>
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#121212] pt-32 pb-20 px-6 font-sans">
       {/* Background */}
       <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

       <div className="max-w-7xl mx-auto relative z-10">
         <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
           <div>
             <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Event Dashboard</h1>
             <p className="text-gray-400">Manage your virtual and physical events.</p>
           </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/analytics')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Sparkles size={20} /> AI Analytics
            </button>
            <button
              onClick={() => navigate('/admin/create')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Create Event
            </button>
          </div>
        </div>

         {loading ? (
             <div className="text-white text-center py-20">Loading events...</div>
         ) : error ? (
             <div className="text-red-400 text-center py-20">{error}</div>
         ) : (
             <div className="space-y-16">

               {/* Active Events */}
               {activeEvents.length > 0 && (
                 <section>
                   <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-green-500/10 rounded-lg">
                       <Activity className="text-green-500" size={24} />
                     </div>
                     <h2 className="text-2xl font-bold text-white">Active Now</h2>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {activeEvents.map(event => <EventCard key={event._id} event={event} type="Active" />)}
                   </div>
                 </section>
               )}

               {/* Upcoming Events */}
               <section>
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-cyan-500/10 rounded-lg">
                     <Hourglass className="text-cyan-500" size={24} />
                   </div>
                   <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
                 </div>
                 {upcomingEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcomingEvents.map(event => <EventCard key={event._id} event={event} type="Upcoming" />)}
                    </div>
                 ) : (
                    <p className="text-gray-500 italic">No upcoming events scheduled.</p>
                 )}
               </section>

               {/* Finished Events */}
               <section>
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-purple-500/10 rounded-lg">
                     <CheckCircle className="text-purple-500" size={24} />
                   </div>
                   <h2 className="text-2xl font-bold text-white">Past Events</h2>
                 </div>
                 {finishedEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70 hover:opacity-100 transition-opacity">
                      {finishedEvents.map(event => <EventCard key={event._id} event={event} type="Finished" />)}
                    </div>
                 ) : (
                    <p className="text-gray-500 italic">No past events found.</p>
                 )}
               </section>

             </div>
         )}
       </div>
    </div>
  );
};

export default AdminDashboard;
