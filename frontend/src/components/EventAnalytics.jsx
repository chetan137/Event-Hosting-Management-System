import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Eye, Clock, Target } from 'lucide-react';
import API from '../services/api';

const EventAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalAttendees: 0,
    upcomingEvents: 0,
    avgAttendanceRate: 0,
    topEvent: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/api/admin/analytics');
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, unit, color }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {value}
            {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-400', '-400/20')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Target}
          label="Total Events"
          value={analytics.totalEvents}
          color="text-cyan-400"
        />
        <StatCard
          icon={Users}
          label="Total Registrations"
          value={analytics.totalRegistrations}
          color="text-pink-400"
        />
        <StatCard
          icon={Eye}
          label="Total Attendees"
          value={analytics.totalAttendees}
          color="text-green-400"
        />
        <StatCard
          icon={Clock}
          label="Upcoming Events"
          value={analytics.upcomingEvents}
          color="text-blue-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Attendance Rate"
          value={analytics.avgAttendanceRate}
          unit="%"
          color="text-yellow-400"
        />
        <StatCard
          icon={BarChart3}
          label="Growth Rate"
          value="+12"
          unit="%"
          color="text-purple-400"
        />
      </div>

      {/* Top Performing Event */}
      {analytics.topEvent && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-400" />
            Top Performing Event
          </h3>
          <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-lg p-4">
            <h4 className="text-white font-semibold">{analytics.topEvent.eventName}</h4>
            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p className="text-gray-400">Registrations</p>
                <p className="text-cyan-400 font-bold text-lg">{analytics.topEvent.registrations}</p>
              </div>
              <div>
                <p className="text-gray-400">Attendance Rate</p>
                <p className="text-green-400 font-bold text-lg">{analytics.topEvent.attendanceRate}%</p>
              </div>
              <div>
                <p className="text-gray-400">Revenue</p>
                <p className="text-yellow-400 font-bold text-lg">₹{analytics.topEvent.revenue}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAnalytics;
