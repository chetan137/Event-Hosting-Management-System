import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  ShieldCheck,
  Search,
  Filter,
  Download,
  ExternalLink,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Share2
} from 'lucide-react';
import API from '../services/api';
import CertificateModal from './CertificateModal';
import { Link } from 'react-router-dom';

const ShowcaseGallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCertificatesIssued: 0,
    totalCertifiedAttendees: 0,
    totalCompletedEvents: 0,
    verificationRate: '100%'
  });
  const [categories, setCategories] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Quick Verification Tool state
  const [quickVerifyInput, setQuickVerifyInput] = useState('');
  const [quickVerifyLoading, setQuickVerifyLoading] = useState(false);
  const [quickVerifyResult, setQuickVerifyResult] = useState(null);

  // Selected Certificate for Visual Modal
  const [activeCertificate, setActiveCertificate] = useState(null);

  useEffect(() => {
    fetchShowcaseData(1);
  }, [selectedCategory, selectedType, sortBy]);

  const fetchShowcaseData = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 12,
        sort: sortBy
      });

      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedType !== 'all') params.append('certificateType', selectedType);

      const { data } = await API.get(`/api/certificates/showcase?${params.toString()}`);

      if (data.success && data.data) {
        setGalleryItems(data.data.galleryItems || []);
        if (data.data.metrics) setMetrics(data.data.metrics);
        if (data.data.categories) setCategories(data.data.categories);
        if (data.data.topEvents) setTopEvents(data.data.topEvents);
        if (data.data.pagination) setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching showcase gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchShowcaseData(1);
  };

  const handleQuickVerify = async (e) => {
    e.preventDefault();
    if (!quickVerifyInput.trim()) return;

    try {
      setQuickVerifyLoading(true);
      setQuickVerifyResult(null);

      const { data } = await API.get(
        `/api/certificates/verify/${encodeURIComponent(quickVerifyInput.trim().toUpperCase())}`
      );
      setQuickVerifyResult(data);
    } catch (error) {
      setQuickVerifyResult({
        verified: false,
        message: error.response?.data?.message || 'Certificate record not found.'
      });
    } finally {
      setQuickVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Background neon glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header / Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs sm:text-sm font-semibold mb-4"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Official Credentials & Achievement Registry</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight"
          >
            Public Showcase{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-pink-500">
              Gallery
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm sm:text-base mt-4"
          >
            Explore cryptographically verified certificates issued to attendees across our events.
            Verify credentials instantly or showcase your achievements.
          </motion.p>
        </div>

        {/* Aggregated Metrics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between text-cyan-400 mb-2">
              <Award className="w-6 h-6" />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
                Verified
              </span>
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold text-white">
              {metrics.totalCertificatesIssued}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-medium">
              Certificates Issued
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-pink-500/40 transition-all">
            <div className="flex items-center justify-between text-pink-400 mb-2">
              <Users className="w-6 h-6" />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400">
                Certified
              </span>
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold text-white">
              {metrics.totalCertifiedAttendees}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-medium">
              Certified Attendees
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between text-purple-400 mb-2">
              <Calendar className="w-6 h-6" />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                Events
              </span>
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold text-white">
              {metrics.totalCompletedEvents}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-medium">
              Completed Events
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-green-500/40 transition-all">
            <div className="flex items-center justify-between text-green-400 mb-2">
              <ShieldCheck className="w-6 h-6" />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                Security
              </span>
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold text-white">
              100%
            </div>
            <div className="text-xs text-gray-400 mt-1 font-medium">
              Ledger Authenticity
            </div>
          </div>
        </motion.div>

        {/* Quick Instant Verification Search Tool */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12 p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-cyan-500/30 backdrop-blur-xl shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Instant Credential Verification
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Enter any Certificate ID (e.g. <span className="font-mono text-cyan-300">ES-2026-XXXXXX</span>) to verify its cryptographic validity.
              </p>
            </div>

            <form
              onSubmit={handleQuickVerify}
              className="w-full md:w-auto flex-1 max-w-md flex items-center gap-2"
            >
              <input
                type="text"
                value={quickVerifyInput}
                onChange={(e) => setQuickVerifyInput(e.target.value)}
                placeholder="Enter Certificate ID..."
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors uppercase font-mono"
              />
              <button
                type="submit"
                disabled={quickVerifyLoading}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-sm transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
              >
                {quickVerifyLoading ? 'Checking...' : 'Verify'}
              </button>
            </form>
          </div>

          {/* Quick verification result modal / banner */}
          <AnimatePresence>
            {quickVerifyResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-white/10"
              >
                {quickVerifyResult.verified ? (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
                      <div>
                        <div className="text-green-400 font-bold text-sm sm:text-base flex items-center gap-2">
                          <span>AUTHENTIC & VERIFIED CREDENTIAL</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-green-500/20">
                            {quickVerifyResult.details?.certificateNumber}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300 mt-1">
                          Issued to <strong>{quickVerifyResult.details?.recipientName}</strong> for completing{' '}
                          <strong>"{quickVerifyResult.details?.eventName}"</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Link
                        to={`/verify-certificate/${quickVerifyResult.details?.certificateNumber}`}
                        className="w-full sm:w-auto px-4 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>Full Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    <div>
                      <div className="text-red-400 font-bold text-sm">
                        Verification Failed
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {quickVerifyResult.message || 'The specified certificate could not be authenticated.'}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by event or recipient..."
              className="w-full pl-9 pr-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </form>

          {/* Type & Category Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Certificate Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">All Certificate Types</option>
              <option value="completion">Completion</option>
              <option value="excellence">Excellence</option>
              <option value="participation">Participation</option>
              <option value="achievement">Achievement</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="recipient">Recipient (A-Z)</option>
              <option value="event">Event Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Gallery Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-white/5 border border-white/10 animate-pulse p-6 flex flex-col justify-between"
              >
                <div className="w-1/3 h-4 bg-white/10 rounded" />
                <div className="space-y-3">
                  <div className="w-3/4 h-6 bg-white/10 rounded" />
                  <div className="w-1/2 h-4 bg-white/10 rounded" />
                </div>
                <div className="w-full h-10 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white/5 rounded-3xl border border-white/10">
            <Award className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Verified Certificates Found</h3>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              No public certificates matched your current filters. Try changing your search query or category filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((cert) => (
              <motion.div
                key={cert._id}
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 hover:border-cyan-400/50 p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all"
              >
                {/* Card Top: Certificate Badge & Verification tag */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      {cert.certificateType || 'Completion'}
                    </span>

                    <span className="flex items-center gap-1 text-[11px] text-green-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>

                  {/* Recipient Name */}
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {cert.recipientName}
                  </h3>

                  {/* Event Name */}
                  <div className="text-xs sm:text-sm text-gray-300 font-medium mt-1 line-clamp-1">
                    "{cert.eventName}"
                  </div>

                  {/* Date & Location */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {new Date(cert.eventDate || cert.issuedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Certificate ID Pill */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-gray-400">
                    <span>ID: {cert.certificateNumber}</span>
                    <span className="text-cyan-400/80 font-sans">Active Credential</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveCertificate(cert)}
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View</span>
                  </button>

                  <a
                    href={`${API.defaults.baseURL || ''}/api/certificates/${cert.certificateNumber}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              onClick={() => fetchShowcaseData(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs sm:text-sm text-gray-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchShowcaseData(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Top Certified Events Section */}
        {topEvents.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-400" />
                  Top Certified Events
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Events with the highest number of verified graduate attendees.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topEvents.map((evt, idx) => (
                <div
                  key={evt.eventId || idx}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base line-clamp-1">
                      {evt.eventName}
                    </h4>
                    <span className="text-xs text-gray-400 mt-1 block">
                      Theme: {evt.theme || 'General'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs">
                      {evt.certifiedCount} Certified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visual Certificate Modal */}
      {activeCertificate && (
        <CertificateModal
          certificate={activeCertificate}
          onClose={() => setActiveCertificate(null)}
        />
      )}
    </div>
  );
};

export default ShowcaseGallery;
