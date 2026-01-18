import React, { useState, useEffect } from 'react';
import { Heart, Share2, Bookmark, TrendingUp, Clock, Users, Zap } from 'lucide-react';
import API from '../services/api';

const EventRecommendations = ({ currentEventId, eventCategory }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [currentEventId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      // Fetch similar events
      const { data } = await API.get(`/api/events?status=upcoming&limit=3`);
      const filtered = data.filter(
        (event) => event._id !== currentEventId && event.status !== 'completed'
      );
      setRecommendations(filtered.slice(0, 3));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-pink-400" />
        <h3 className="text-xl font-bold text-white">Recommended Events</h3>
      </div>

      <div className="space-y-4">
        {recommendations.map((event) => (
          <div key={event._id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-500/30 transition cursor-pointer">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold truncate">{event.eventName}</h4>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{event.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(event.startDateTime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.registeredUsers} going
                  </span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-pink-400 transition flex-shrink-0">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventRecommendations;
