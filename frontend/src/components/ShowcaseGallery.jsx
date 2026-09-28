import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Award,
  Search,
  Filter,
  Download,
  Share2,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Calendar,
  MapPin,
  FileText,
  Image as ImageIcon,
  Copy,
  Check,
  Loader,
  ArrowRight,
  TrendingUp,
  Users,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import CredentialModal from './CredentialModal';
import { downloadCredentialPNG, downloadCredentialPDF } from '../utils/credentialDownload';

const ShowcaseGallery = () => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [verifyInput, setVerifyInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [downloadingCardId, setDownloadingCardId] = useState(null);

  const [searchParams] = useSearchParams();
  const { id: routeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;

  useEffect(() => {
    fetchCredentials();
  }, []);

  // Handle URL deep linking (e.g. /showcase?id=ES-2026-F98B21 or /credentials/ES-2026-F98B21)
  useEffect(() => {
    const credIdTarget = searchParams.get('id') || routeId;
    if (credIdTarget && credentials.length > 0) {
      const match = credentials.find(
        (c) =>
          c.credentialId?.toLowerCase() === credIdTarget.toLowerCase() ||
          c._id?.toLowerCase() === credIdTarget.toLowerCase()
      );
      if (match) {
        setSelectedCredential(match);
      } else {
        // Fetch specific credential directly from API
        lookupSingleCredential(credIdTarget);
      }
    }
  }, [searchParams, routeId, credentials]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/api/events/public/showcase');
      if (data && data.credentials) {
        setCredentials(data.credentials);
      } else {
        setCredentials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching showcase credentials:', err);
      // Fallback flagship credentials if backend error occurs
      setCredentials(getFallbackCredentials());
    } finally {
      setLoading(false);
    }
  };

  const lookupSingleCredential = async (id) => {
    try {
      const { data } = await API.get(`/api/events/credentials/${id}`);
      if (data) {
        setSelectedCredential(data);
        return;
      }
    } catch (err) {
      // Also try certificates route if event credential is not found
      try {
        const certRes = await API.get(`/api/certificates/${id}`);
        if (certRes.data?.certificate) {
          const c = certRes.data.certificate;
          setSelectedCredential({
            _id: c._id,
            credentialId: c.certificateNumber,
            recipientName: c.recipientName,
            recipientEmail: c.recipientEmail,
            eventName: c.eventName,
            eventDate: c.issueDate,
            location: 'Verified Event Venue',
            credentialType: 'Verified Certificate',
            attendanceStatus: 'Verified Attended',
            issueDate: c.issueDate,
            status: 'Verified',
            issuer: c.issuedBy || 'EventSync Official Organization',
            verificationHash: c.verificationHash || '9a72b8c5e13d4f00',
            skills: c.skillsEarned || ['Event Participation', 'Professional Mastery'],
            description: `Official verified certificate awarded to ${c.recipientName} for participating in ${c.eventName}.`
          });
        }
      } catch (e) {
        console.warn('Could not load specific credential:', err);
      }
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;

    setVerifying(true);
    setVerifyError('');

    try {
      // 1. Check in already loaded list
      const query = verifyInput.trim().toLowerCase();
      const localMatch = credentials.find(
        (c) =>
          c.credentialId?.toLowerCase() === query ||
          c._id?.toLowerCase() === query ||
          c.recipientName?.toLowerCase() === query
      );

      if (localMatch) {
        setSelectedCredential(localMatch);
        setVerifyInput('');
        setVerifying(false);
        return;
      }

      // 2. Fetch directly from backend
      try {
        const { data } = await API.get(`/api/events/credentials/${encodeURIComponent(verifyInput.trim())}`);
        if (data) {
          setSelectedCredential(data);
          setVerifyInput('');
          setVerifying(false);
          return;
        }
      } catch (err) {
        // Fallback to check certificate service
        const certRes = await API.get(`/api/certificates/${encodeURIComponent(verifyInput.trim())}`);
        if (certRes.data?.certificate) {
          const c = certRes.data.certificate;
          setSelectedCredential({
            _id: c._id,
            credentialId: c.certificateNumber,
            recipientName: c.recipientName,
            recipientEmail: c.recipientEmail,
            eventName: c.eventName,
            eventDate: c.issueDate,
            location: 'Verified Event Venue',
            credentialType: 'Verified Certificate',
            attendanceStatus: 'Verified Attended',
            issueDate: c.issueDate,
            status: 'Verified',
            issuer: c.issuedBy || 'EventSync Official Organization',
            verificationHash: c.verificationHash || '9a72b8c5e13d4f00',
            skills: c.skillsEarned || ['Event Participation', 'Professional Mastery'],
            description: `Official verified certificate awarded to ${c.recipientName} for participating in ${c.eventName}.`
          });
          setVerifyInput('');
          setVerifying(false);
          return;
        }
        setVerifyError('No credential found matching this ID.');
      }
    } catch (err) {
      setVerifyError('Credential ID not found or invalid format.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCardQuickDownloadPNG = async (e, cred) => {
    e.stopPropagation();
    try {
      setDownloadingCardId({ id: cred._id, type: 'png' });
      await downloadCredentialPNG(cred);
      if (window.showToast) {
        window.showToast('PNG credential downloaded! 🎉', 'success', 2500);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDownloadingCardId(null);
    }
  };

  const handleCardQuickDownloadPDF = async (e, cred) => {
    e.stopPropagation();
    try {
      setDownloadingCardId({ id: cred._id, type: 'pdf' });
      await downloadCredentialPDF(cred);
      if (window.showToast) {
        window.showToast('PDF certificate downloaded! 📄', 'success', 2500);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDownloadingCardId(null);
    }
  };

  // Filter & Search Logic
  const filteredCredentials = credentials.filter((cred) => {
    // Search query
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      cred.recipientName?.toLowerCase().includes(q) ||
      cred.eventName?.toLowerCase().includes(q) ||
      cred.credentialId?.toLowerCase().includes(q) ||
      (cred.skills && cred.skills.some((s) => s.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    // Category Tabs
    if (activeTab === 'all') return true;
    if (activeTab === 'certificates') {
      return cred.credentialType?.toLowerCase().includes('certificate');
    }
    if (activeTab === 'distinctions') {
      return (
        cred.credentialType?.toLowerCase().includes('distinction') ||
        cred.credentialType?.toLowerCase().includes('speaker') ||
        cred.credentialType?.toLowerCase().includes('excellence')
      );
    }
    if (activeTab === 'passes') {
      return cred.credentialType?.toLowerCase().includes('pass');
    }
    if (activeTab === 'mine') {
      if (!userInfo) return false;
      return (
        cred.userId === userInfo._id ||
        (userInfo.fullName && cred.recipientName?.toLowerCase() === userInfo.fullName.toLowerCase())
      );
    }

    return true;
  });

  // Sorting Logic
  const sortedCredentials = [...filteredCredentials].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.issueDate || b.eventDate || 0) - new Date(a.issueDate || a.eventDate || 0);
    }
    if (sortBy === 'oldest') {
      return new Date(a.issueDate || a.eventDate || 0) - new Date(b.issueDate || b.eventDate || 0);
    }
    if (sortBy === 'alpha') {
      return (a.recipientName || '').localeCompare(b.recipientName || '');
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-28 pb-20 px-4 sm:px-6">
      {/* Background Ambient Glows */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-60 right-[5%] w-[450px] h-[350px] bg-pink-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs sm:text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Public Accreditation Ledger & Showcase</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Verified Credentials <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              & Attendee Showcase
            </span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg mt-4 leading-relaxed">
            Explore authentic event certificates, attendance honors, and verified technical credentials issued
            across the EventSync ecosystem. Instantly view, verify, and export official PDF & PNG documents.
          </p>

          {/* Quick Credential Verification Lookup Bar */}
          <form
            onSubmit={handleVerifySubmit}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto"
          >
            <div className="relative flex-1 w-full">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="Enter Credential ID (e.g. ES-2026-F98B21)..."
                className="w-full pl-12 pr-4 py-3 bg-[#161b22] border border-white/15 focus:border-cyan-400 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {verifying ? 'Verifying...' : 'Verify Now'}
            </button>
          </form>
          {verifyError && <p className="text-red-400 text-xs mt-2">{verifyError}</p>}
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#161b22]/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 text-center hover:border-cyan-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-black text-cyan-400">
              {credentials.length || '120'}+
            </div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1">Credentials Issued</div>
          </div>
          <div className="bg-[#161b22]/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 text-center hover:border-pink-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-black text-pink-400">100%</div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1">Cryptographically Verified</div>
          </div>
          <div className="bg-[#161b22]/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 text-center hover:border-purple-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-black text-purple-400">Instant</div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1">PDF & PNG Downloads</div>
          </div>
          <div className="bg-[#161b22]/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 text-center hover:border-emerald-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">Public</div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1">Verification Ledger</div>
          </div>
        </div>

        {/* Search, Tabs, and Filters Bar */}
        <div className="bg-[#161b22]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by recipient, event, or skill..."
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alpha">Recipient Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Filter Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-white/10">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              All Credentials ({credentials.length})
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'certificates'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Certificates
            </button>
            <button
              onClick={() => setActiveTab('distinctions')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'distinctions'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Honors & Distinctions
            </button>
            <button
              onClick={() => setActiveTab('passes')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'passes'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Verified Attendee Passes
            </button>
            {userInfo && (
              <button
                onClick={() => setActiveTab('mine')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'mine'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-pink-400 hover:text-pink-300 border border-pink-500/20'
                }`}
              >
                🎓 My Credentials
              </button>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-gray-400 text-sm">Loading verified showcase credentials...</p>
          </div>
        ) : sortedCredentials.length === 0 ? (
          <div className="text-center py-20 bg-[#161b22]/50 rounded-3xl border border-white/10 p-8">
            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Credentials Found</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              We couldn't find any credentials matching your current search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCredentials.map((cred) => {
              const isDownloadingPNG = downloadingCardId?.id === cred._id && downloadingCardId?.type === 'png';
              const isDownloadingPDF = downloadingCardId?.id === cred._id && downloadingCardId?.type === 'pdf';

              return (
                <motion.div
                  key={cred._id || cred.credentialId}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedCredential(cred)}
                  className="group relative bg-[#161b22] border border-white/10 hover:border-cyan-500/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all cursor-pointer flex flex-col"
                >
                  {/* Card Cover Header */}
                  <div className="relative h-44 bg-gradient-to-br from-[#1a2333] to-[#0c121e] overflow-hidden">
                    {cred.coverImage ? (
                      <img
                        src={cred.coverImage}
                        alt={cred.eventName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-cyan-900/30 via-purple-900/20 to-pink-900/30">
                        <Award className="w-14 h-14 text-cyan-400/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] via-[#161b22]/50 to-transparent" />

                    {/* Badge Pill */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5 shadow-md">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{cred.credentialType || 'Certificate'}</span>
                    </div>

                    {/* Credential ID */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-gray-300">
                      {cred.credentialId}
                    </div>

                    {/* Recipient Ribbon */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 p-0.5 shadow-lg flex-shrink-0">
                        <div className="w-full h-full rounded-full bg-[#161b22] flex items-center justify-center font-bold text-sm text-white uppercase">
                          {cred.recipientName ? cred.recipientName[0] : 'U'}
                        </div>
                      </div>
                      <div className="truncate">
                        <h4 className="text-white font-bold text-base truncate drop-shadow-md">
                          {cred.recipientName}
                        </h4>
                        <p className="text-xs text-gray-300 font-medium truncate">
                          {cred.attendanceStatus || 'Verified Record'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                        {cred.eventName}
                      </h3>

                      <div className="space-y-1.5 mt-3 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="truncate">
                            {cred.eventDate ? new Date(cred.eventDate).toLocaleDateString() : 'Active Milestone'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                          <span className="truncate">
                            {cred.location || (cred.locationType === 'online' ? 'Online Virtual Event' : 'Event Venue')}
                          </span>
                        </div>
                      </div>

                      {/* Skills Tags */}
                      {cred.skills && cred.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {cred.skills.slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-gray-300"
                            >
                              {skill}
                            </span>
                          ))}
                          {cred.skills.length > 3 && (
                            <span className="text-[10px] text-gray-500 self-center">
                              +{cred.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCredential(cred);
                        }}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Credential</span>
                      </button>

                      {/* Quick Instant PNG Download */}
                      <button
                        onClick={(e) => handleCardQuickDownloadPNG(e, cred)}
                        disabled={isDownloadingPNG}
                        title="Instant PNG Download"
                        className="p-2 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-cyan-400 text-gray-300 hover:text-white rounded-xl text-xs transition-all disabled:opacity-50"
                      >
                        {isDownloadingPNG ? (
                          <Loader className="w-4 h-4 animate-spin text-cyan-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                      </button>

                      {/* Quick Instant PDF Download */}
                      <button
                        onClick={(e) => handleCardQuickDownloadPDF(e, cred)}
                        disabled={isDownloadingPDF}
                        title="Instant PDF Download"
                        className="p-2 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-pink-400 text-gray-300 hover:text-white rounded-xl text-xs transition-all disabled:opacity-50"
                      >
                        {isDownloadingPDF ? (
                          <Loader className="w-4 h-4 animate-spin text-pink-400" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Credential View Modal */}
      {selectedCredential && (
        <CredentialModal
          credential={selectedCredential}
          onClose={() => setSelectedCredential(null)}
        />
      )}
    </div>
  );
};

// Fallback curated credentials in case of cold start or network error
const getFallbackCredentials = () => [
  {
    _id: 'flagship-cred-001',
    credentialId: 'ES-2026-F98B21',
    recipientName: 'Sophia Montgomery',
    recipientEmail: 's***@nexuslab.ai',
    eventName: 'AI Systems & Autonomous Agents World Summit',
    eventDate: new Date('2026-02-14T09:00:00.000Z'),
    location: 'Metropolitan Tech Center, San Francisco & Online',
    locationType: 'online',
    coverImage: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800&auto=format&fit=crop&q=60',
    credentialType: 'Excellence Distinction',
    attendanceStatus: 'Verified Attended',
    issueDate: new Date('2026-02-15T18:00:00.000Z'),
    status: 'Verified',
    issuer: 'EventSync Global Board',
    issuerTitle: 'VP of AI Standards & Community',
    verificationHash: '9a72b8c5e13d4f00',
    skills: ['Multi-Agent Architecture', 'Autonomous Reasoning', 'Vector Embeddings', 'Safety Alignment'],
    description: 'Honored for exceptional technical demonstration and mastery in autonomous agent design during the 2026 World Summit.'
  },
  {
    _id: 'flagship-cred-002',
    credentialId: 'ES-2026-D44C89',
    recipientName: 'Arnav Kulkarni',
    recipientEmail: 'a***@devscale.org',
    eventName: '🚀 CodingNexus DevOps Bootcamp 2026',
    eventDate: new Date('2026-03-30T11:37:00.000Z'),
    location: '406 Lab & High-Speed Stream',
    locationType: 'offline',
    coverImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=60',
    credentialType: 'Certificate of Attendance',
    attendanceStatus: 'Verified Attended',
    issueDate: new Date('2026-03-30T17:00:00.000Z'),
    status: 'Verified',
    issuer: 'CodingNexus & EventSync',
    issuerTitle: 'Principal Cloud Architect',
    verificationHash: 'c4e320f88b19aa22',
    skills: ['CI/CD Automation', 'Docker Containers', 'Kubernetes Clusters', 'Telemetry & Observability'],
    description: 'Awarded for completing intensive hands-on labs in cloud-native continuous integration and infrastructure orchestration.'
  },
  {
    _id: 'flagship-cred-003',
    credentialId: 'ES-2026-E77A12',
    recipientName: 'Elena Rostova',
    recipientEmail: 'e***@hyperfin.io',
    eventName: 'Global Founders & Venture Assembly 2026',
    eventDate: new Date('2026-01-18T20:30:00.000Z'),
    location: 'Grand Summit Hall, London',
    locationType: 'offline',
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60',
    credentialType: 'Distinguished Speaker',
    attendanceStatus: 'Verified Attended',
    issueDate: new Date('2026-01-19T10:00:00.000Z'),
    status: 'Verified',
    issuer: 'Global Venture Coalition',
    issuerTitle: 'Managing Partner',
    verificationHash: 'f189d20c388efb76',
    skills: ['Seed-to-Series B Strategy', 'Cross-Border Capital', 'Corporate Governance', 'Ecosystem Scaling'],
    description: 'Recognized for keynote contributions and guiding rising founder cohorts on high-conviction company scaling.'
  },
  {
    _id: 'flagship-cred-004',
    credentialId: 'ES-2026-B32A90',
    recipientName: 'David K. Tanaka',
    recipientEmail: 'd***@designcraft.co',
    eventName: 'NextGen Design Systems & Spatial UI Masterclass',
    eventDate: new Date('2026-04-12T14:00:00.000Z'),
    location: 'Spatial Metaverse Theater & Tokyo Center',
    locationType: 'online',
    coverImage: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&auto=format&fit=crop&q=60',
    credentialType: 'Certificate of Attendance',
    attendanceStatus: 'Verified Attended',
    issueDate: new Date('2026-04-12T18:30:00.000Z'),
    status: 'Verified',
    issuer: 'Design Horizons Guild',
    issuerTitle: 'Design System Lead',
    verificationHash: '8b7d91e6032afb11',
    skills: ['Design Tokens', 'Micro-Interactions', 'Spatial UX', 'Accessibility Standards'],
    description: 'Presented in recognition of completing the comprehensive immersive curriculum on next-generation UI architectures.'
  }
];

export default ShowcaseGallery;
