import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, QrCode, ClipboardList, CheckCircle, XCircle,
  Trash2, UserPlus, Search, Filter, Loader, Mail
} from 'lucide-react';
import API from '../services/api';
import QRScanner from './QRScanner';

const AdminEventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('registrations'); // registrations, scanner, attendance
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEventDetails();
    fetchRegistrations();
    fetchStats();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data } = await API.get(`/api/admin/events/${eventId}`);
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data } = await API.get(`/api/admin/events/${eventId}/registrations`);
      setRegistrations(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await API.get(`/api/attendance/event/${eventId}`);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (registrationId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this user?`)) return;

    try {
      await API.put(`/api/admin/events/${eventId}/registrations/${registrationId}`, {
        status
      });
      fetchRegistrations(); // Refresh list
      window.showToast(`Registration ${status} successfully ✅`, 'success', 2000);
    } catch (error) {
      window.showToast('Failed to update status', 'error', 3000);
    }
  };

  const handleRemoveUser = async (registrationId) => {
    if (!window.confirm('Are you sure you want to remove this user from the event? This cannot be undone.')) return;

    try {
      await API.delete(`/api/admin/events/${eventId}/registrations/${registrationId}`);
      fetchRegistrations();
      window.showToast('User removed from event ✓', 'success', 2000);
    } catch (error) {
      window.showToast('Failed to remove user', 'error', 3000);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesStatus = filterStatus === 'all' || reg.status === filterStatus;
    const matchesSearch = !searchTerm || 
                          (reg.user && reg.user.fullName && reg.user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (reg.user && reg.user.email && reg.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading || !event) {
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">{event.eventName}</h1>
            <p className="text-gray-400">Manage registrations, attendance, and details</p>
          </div>

          <div className="flex gap-2 bg-[#1E1E1E] p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'registrations'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users size={16} /> Registrations
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'scanner'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <QrCode size={16} /> Scanner
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'attendance'
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ClipboardList size={16} /> Attendance
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'registrations' && (
          <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex gap-2 md:w-1/3">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${filterStatus === 'all' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${filterStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${filterStatus === 'approved' ? 'bg-green-500/20 text-green-400' : 'text-gray-400'}`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${filterStatus === 'rejected' ? 'bg-red-500/20 text-red-400' : 'text-gray-400'}`}
                >
                  Rejected
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 text-sm">
                  <tr>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Registered</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No registrations found matching your filters.
                      </td>
                    </tr>
                  ) : filteredRegistrations.map((reg) => (
                    <tr key={reg._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white font-medium">{reg.user?.fullName || 'Unknown User'}</td>
                      <td className="p-4 text-gray-400">{reg.user?.email || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          reg.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          reg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(reg.registrationDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {reg.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(reg._id, 'approved')}
                                className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(reg._id, 'rejected')}
                                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleRemoveUser(reg._id)}
                            className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                            title="Remove User"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scanner Tab */}
        {activeTab === 'scanner' && (
          <div className="max-w-xl mx-auto">
             <QRScanner
               eventId={eventId}
               eventName={event.eventName}
               onScanSuccess={() => {
                 fetchStats();
                 window.showToast('User checked in successfully! ✅', 'success', 2000);
               }}
             />
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && stats && (
           <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-white/10 text-center">
                 <p className="text-gray-400 mb-2">Total Checked In</p>
                 <p className="text-4xl font-bold text-green-400">{stats.totalAttendance}</p>
               </div>
               <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-white/10 text-center">
                 <p className="text-gray-400 mb-2">Registrations</p>
                 <p className="text-4xl font-bold text-white">{stats.totalRegistrations}</p>
               </div>
               <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-white/10 text-center">
                 <p className="text-gray-400 mb-2">Turnout Rate</p>
                 <p className="text-4xl font-bold text-cyan-400">{stats.attendanceRate}%</p>
               </div>
             </div>

             <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 overflow-hidden">
               <div className="p-4 border-b border-white/10">
                 <h3 className="text-lg font-bold text-white">Attendance Log</h3>
               </div>
               <table className="w-full text-left">
                  <thead className="bg-white/5 text-gray-400 text-sm">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Time</th>
                      <th className="p-4">Scanned By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {stats.attendance && stats.attendance.length > 0 ? (
                      stats.attendance.map((record, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="p-4 text-white">
                            <div>{record.user.fullName}</div>
                            <div className="text-xs text-gray-500">{record.user.email}</div>
                          </td>
                          <td className="p-4 text-gray-400">
                            {new Date(record.scanTime).toLocaleString()}
                          </td>
                          <td className="p-4 text-gray-400 text-sm">
                            {record.scannedBy?.username || record.scannedBy?.fullName || 'Admin'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-gray-500">No attendance records yet.</td>
                      </tr>
                    )}
                  </tbody>
               </table>
             </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default AdminEventDetails;
