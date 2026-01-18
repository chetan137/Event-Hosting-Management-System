import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Trophy, LogOut, Edit2 } from 'lucide-react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({
    eventsJoined: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    feedbackGiven: 0,
  });
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('userInfo');
    if (userData) {
      setUserInfo(JSON.parse(userData));
      fetchUserStats();
    }
  }, []);

  const fetchUserStats = async () => {
    try {
      const { data } = await API.get('/api/users/me/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.dispatchEvent(new Event('userInfoChange'));
    window.showToast('Logged out successfully 👋', 'success', 2000);
    setTimeout(() => {
      navigate('/login');
    }, 500);
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{userInfo.fullName}</h2>
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
              <Mail className="w-4 h-4" />
              {userInfo.email}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 text-gray-400 hover:text-red-400" />
          </button>
          {showLogout && (
            <div className="absolute right-0 top-12 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-lg z-10">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-red-400 hover:bg-red-500/10 text-left text-sm rounded-lg transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.eventsJoined}</p>
          <p className="text-gray-400 text-xs mt-1">Events Joined</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
          <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.upcomingEvents}</p>
          <p className="text-gray-400 text-xs mt-1">Upcoming</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
          <Calendar className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.pastEvents}</p>
          <p className="text-gray-400 text-xs mt-1">Attended</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
          <Trophy className="w-5 h-5 text-pink-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.feedbackGiven}</p>
          <p className="text-gray-400 text-xs mt-1">Feedback</p>
        </div>
      </div>

      {/* Edit Profile Button */}
      <button className="w-full mt-4 px-4 py-2 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition flex items-center justify-center gap-2">
        <Edit2 className="w-4 h-4" />
        Edit Profile
      </button>
    </div>
  );
};

export default UserProfile;
