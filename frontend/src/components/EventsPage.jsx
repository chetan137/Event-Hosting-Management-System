import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Filter,
  Search,
  Loader,
  Sparkles,
  X,
  RotateCcw,
  Tag,
  CheckCircle2,
  ChevronDown,
  Layers,
  Flame,
  SlidersHorizontal,
  CalendarRange
} from 'lucide-react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'all', name: 'All Events', icon: '✨' },
  { id: 'Technology', name: 'Technology', icon: '💻' },
  { id: 'Workshop', name: 'Workshop', icon: '🛠️' },
  { id: 'Business', name: 'Business', icon: '💼' },
  { id: 'Entertainment', name: 'Entertainment', icon: '🎭' },
  { id: 'Music', name: 'Music', icon: '🎵' },
  { id: 'Sports & Fitness', name: 'Sports & Fitness', icon: '🏃' },
  { id: 'Networking', name: 'Networking', icon: '🤝' },
  { id: 'Education', name: 'Education', icon: '📚' },
  { id: 'Design', name: 'Design', icon: '🎨' },
  { id: 'Gaming', name: 'Gaming', icon: '🎮' },
  { id: 'Other', name: 'Other', icon: '🌟' }
];

const DATE_PRESETS = [
  { id: 'all', label: 'Any Date' },
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'This Weekend' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom Range' }
];

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [joiningEvent, setJoiningEvent] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [semanticMeta, setSemanticMeta] = useState(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [seatAvailability, setSeatAvailability] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  // 1. Debounce Search Input (350ms delay)
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load User Info
  useEffect(() => {
    const info = localStorage.getItem('userInfo');
    if (info) {
      try {
        setUserInfo(JSON.parse(info));
      } catch (e) {
        console.error('Failed to parse userInfo', e);
      }
    }
  }, []);

  // Compute calculated start and end dates based on datePreset
  const { calculatedStartDate, calculatedEndDate } = useMemo(() => {
    const now = new Date();
    if (datePreset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      return { calculatedStartDate: todayStr, calculatedEndDate: todayStr };
    }
    if (datePreset === 'weekend') {
      const day = now.getDay();
      const diffToFriday = (5 - day + 7) % 7;
      const friday = new Date(now);
      friday.setDate(now.getDate() + diffToFriday);

      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);

      return {
        calculatedStartDate: friday.toISOString().split('T')[0],
        calculatedEndDate: sunday.toISOString().split('T')[0]
      };
    }
    if (datePreset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        calculatedStartDate: firstDay.toISOString().split('T')[0],
        calculatedEndDate: lastDay.toISOString().split('T')[0]
      };
    }
    if (datePreset === 'custom') {
      return {
        calculatedStartDate: customStartDate || null,
        calculatedEndDate: customEndDate || null
      };
    }
    return { calculatedStartDate: null, calculatedEndDate: null };
  }, [datePreset, customStartDate, customEndDate]);

  // 2. Fetch Events from Backend with Multi-criteria & Semantic Query
  useEffect(() => {
    fetchFilteredEvents();
  }, [
    debouncedQuery,
    selectedCategory,
    statusFilter,
    seatAvailability,
    calculatedStartDate,
    calculatedEndDate
  ]);

  const fetchFilteredEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('detailed', 'true');

      if (debouncedQuery.trim()) {
        params.append('search', debouncedQuery.trim());
      }
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (seatAvailability && seatAvailability !== 'all') {
        params.append('seatAvailability', seatAvailability);
      }
      if (calculatedStartDate) {
        params.append('startDate', calculatedStartDate);
      }
      if (calculatedEndDate) {
        params.append('endDate', calculatedEndDate);
      }

      const { data } = await API.get(`/api/events?${params.toString()}`);

      if (data && Array.isArray(data.events)) {
        setEvents(data.events);
        setSemanticMeta(data.semanticMeta || null);
      } else if (Array.isArray(data)) {
        setEvents(data);
        setSemanticMeta(null);
      } else {
        setEvents([]);
        setSemanticMeta(null);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      window.showToast?.('Failed to load events', 'error', 3000);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset All Filters
  const handleResetAllFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedCategory('all');
    setStatusFilter('all');
    setSeatAvailability('all');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSemanticMeta(null);
  };

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    debouncedQuery ||
    selectedCategory !== 'all' ||
    statusFilter !== 'all' ||
    seatAvailability !== 'all' ||
    datePreset !== 'all' ||
    customStartDate ||
    customEndDate
  );

  const activeFilterCount = [
    debouncedQuery ? 1 : 0,
    selectedCategory !== 'all' ? 1 : 0,
    statusFilter !== 'all' ? 1 : 0,
    seatAvailability !== 'all' ? 1 : 0,
    datePreset !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const handleJoinEvent = async (eventId) => {
    if (!userInfo) {
      window.showToast?.('Please login first', 'info', 2000);
      navigate('/login');
      return;
    }

    try {
      setJoiningEvent(eventId);
      try {
        await API.post(`/api/events/${eventId}/register`);
        window.showToast?.('Successfully registered! Welcome to the event 🎉', 'success', 2000);
      } catch (regError) {
        if (regError.response?.status === 400 && regError.response?.data?.message?.includes('already')) {
          window.showToast?.('You have already requested to join. Checking status... 🚀', 'info', 2000);
        } else {
          throw regError;
        }
      }
      setTimeout(() => {
        navigate(`/events/${eventId}`);
      }, 500);
    } catch (error) {
      window.showToast?.(error.response?.data?.message || 'Failed to register for event', 'error', 3000);
    } finally {
      setJoiningEvent(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      live: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse',
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

  return (
    <div className="min-h-screen bg-[#121212] pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                Smart Discovery Engine
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500 bg-clip-text text-transparent mb-3">
                Explore Events
              </h1>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
                Semantic search and multi-criteria filters powered by AI to find the perfect events for you.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-2xl px-5 py-3 shadow-lg self-start md:self-auto">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Events Found</span>
                <span className="text-2xl font-bold text-white flex items-center gap-2">
                  {events.length}
                  {loading && <Loader className="w-4 h-4 text-cyan-400 animate-spin" />}
                </span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Active Filters</span>
                <span className="text-2xl font-bold text-pink-400">{activeFilterCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 1. DEBOUNCED SEARCH BAR & QUICK CONTROLS                       */}
        {/* ============================================================== */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input with Debounce */}
            <div className="relative flex-1 group">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isSearching ? 'text-cyan-400 animate-pulse' : 'text-gray-400 group-focus-within:text-cyan-400'}`} />
              
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Try semantic search: 'learn python', 'hackathon', 'chill music', 'startup pitch'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-[#1A1A1A] border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm sm:text-base shadow-xl"
              />

              {/* Right Side Icons: Searching Spinner / Clear Button */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSearching && (
                  <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                )}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile / Quick Filter Toggle */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`sm:hidden flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border font-semibold text-sm transition-all ${
                showFilterDrawer || hasActiveFilters
                  ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white border-transparent shadow-lg shadow-cyan-500/20'
                  : 'bg-[#1A1A1A] border-white/10 text-gray-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </button>
          </div>

          {/* AI Semantic Keyword Enhancement Strip (When Query is Analyzed) */}
          {semanticMeta && semanticMeta.inferredCategories?.length > 0 && (
            <div className="bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-pink-950/40 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg backdrop-blur-md animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 mt-0.5 sm:mt-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        AI Semantic Match:
                      </span>
                      <span className="text-xs text-gray-300">
                        Mapped "{semanticMeta.originalQuery}" to categories:
                      </span>
                      {semanticMeta.inferredCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                            selectedCategory === cat
                              ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30'
                              : 'bg-white/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                          }`}
                        >
                          <span>{cat}</span>
                          {selectedCategory === cat && <CheckCircle2 className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                    {semanticMeta.explanation && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        "{semanticMeta.explanation}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                    {semanticMeta.semanticSource === 'gemini_ai' ? 'Gemini AI' : 'Vector Engine'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 2. CATEGORY PILL FILTERS                                       */}
        {/* ============================================================== */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white border-transparent shadow-lg shadow-cyan-500/25 scale-[1.02]'
                      : 'bg-[#1A1A1A] text-gray-400 hover:text-white border-white/10 hover:border-white/20 hover:bg-[#222222]'
                  }`}
                >
                  <span className="text-base leading-none">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. MULTI-CRITERIA FILTER CONTROLS BAR (Date, Seats, Status)    */}
        {/* ============================================================== */}
        <div className={`mb-6 p-4 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-xl space-y-4 ${showFilterDrawer ? 'block' : 'hidden sm:block'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Filter Dropdown */}
              <div className="flex items-center gap-2 bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Date:</span>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-sm"
                >
                  {DATE_PRESETS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1E1E1E] text-white">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seat Availability Filter */}
              <div className="flex items-center gap-2 bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300">
                <Users className="w-4 h-4 text-pink-400" />
                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Seats:</span>
                <select
                  value={seatAvailability}
                  onChange={(e) => setSeatAvailability(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-sm"
                >
                  <option value="all" className="bg-[#1E1E1E] text-white">All Seats</option>
                  <option value="available" className="bg-[#1E1E1E] text-white">Seats Available 🟢</option>
                  <option value="sold_out" className="bg-[#1E1E1E] text-white">Sold Out 🔴</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300">
                <Flame className="w-4 h-4 text-purple-400" />
                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-sm"
                >
                  <option value="all" className="bg-[#1E1E1E] text-white">All Statuses</option>
                  <option value="upcoming" className="bg-[#1E1E1E] text-white">Upcoming 🔵</option>
                  <option value="live" className="bg-[#1E1E1E] text-white">Live Now 🟢</option>
                  <option value="completed" className="bg-[#1E1E1E] text-white">Completed ⚪</option>
                </select>
              </div>
            </div>

            {/* Quick Reset All in filter bar */}
            {hasActiveFilters && (
              <button
                onClick={handleResetAllFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Custom Date Range Picker (Shows only when Custom is chosen) */}
          {datePreset === 'custom' && (
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 animate-fadeIn">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <CalendarRange className="w-4 h-4" /> Custom Range:
              </span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-[#242424] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-[#242424] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. ACTIVE FILTER RESET BADGE STRIP                             */}
        {/* ============================================================== */}
        {hasActiveFilters && (
          <div className="mb-8 p-3.5 bg-[#181818] border border-white/10 rounded-2xl flex flex-wrap items-center gap-2 shadow-lg animate-fadeIn">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 pl-1 pr-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              Active Filters:
            </span>

            {/* Search Query Badge */}
            {debouncedQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
                <span>Search: "{debouncedQuery}"</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white p-0.5 rounded-full hover:bg-cyan-500/30 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Category Badge */}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-medium">
                <span>Category: {selectedCategory}</span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-white p-0.5 rounded-full hover:bg-pink-500/30 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Date Range Badge */}
            {datePreset !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
                <span>
                  Date: {DATE_PRESETS.find((p) => p.id === datePreset)?.label}
                  {datePreset === 'custom' && (customStartDate || customEndDate) && ` (${customStartDate || '...'} → ${customEndDate || '...'})`}
                </span>
                <button
                  onClick={() => {
                    setDatePreset('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="hover:text-white p-0.5 rounded-full hover:bg-purple-500/30 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Seat Availability Badge */}
            {seatAvailability !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <span>Seats: {seatAvailability === 'available' ? 'Seats Available' : 'Sold Out'}</span>
                <button
                  onClick={() => setSeatAvailability('all')}
                  className="hover:text-white p-0.5 rounded-full hover:bg-emerald-500/30 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Status Badge */}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium">
                <span>Status: {statusFilter}</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="hover:text-white p-0.5 rounded-full hover:bg-blue-500/30 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Reset All Filters Button */}
            <button
              onClick={handleResetAllFilters}
              className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. EVENTS GRID                                                 */}
        {/* ============================================================== */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Searching and organizing events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-3xl p-12 text-center border border-white/10 shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No matching events found</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6 text-sm">
              We couldn't find any events matching your selected criteria. Try removing filters or searching with different terms.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetAllFilters}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const spotsLeft = event.spotsLeft;
              const isSoldOut = event.isSoldOut || (event.capacity && spotsLeft === 0);

              return (
                <div
                  key={event._id}
                  className="bg-[#1A1A1A] rounded-3xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all duration-300 group hover:-translate-y-1 shadow-xl flex flex-col"
                >
                  {/* Event Cover Image */}
                  <div className="relative h-48 sm:h-52 bg-gradient-to-br from-purple-900/30 to-cyan-900/30 overflow-hidden">
                    {event.coverImage ? (
                      <img
                        src={event.coverImage}
                        alt={event.eventName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/40">
                        <Calendar className="w-14 h-14 text-gray-600" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-black/60 pointer-events-none" />

                    {/* Category Pill Tag */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
                      <Tag className="w-3 h-3 text-cyan-400" />
                      <span>{event.category || 'Technology'}</span>
                    </div>

                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full border backdrop-blur-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(event.status)}`}>
                      {event.status}
                    </div>

                    {/* Price Tag if paid */}
                    {event.ticketType === 'paid' && (
                      <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1 shadow-md">
                        <span>₹{event.ticketPrice}</span>
                      </div>
                    )}

                    {/* Seat Availability Tag */}
                    <div className="absolute bottom-3 right-3">
                      {isSoldOut ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold uppercase">
                          Sold Out
                        </span>
                      ) : spotsLeft !== null ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                          {spotsLeft} spots left
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold">
                          Open Seats
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    {/* Semantic Match Reason if relevant */}
                    {event.matchedReasons && event.matchedReasons.length > 0 && (
                      <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-2.5 py-1 w-fit">
                        <Sparkles className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{event.matchedReasons[0]}</span>
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {event.eventName}
                    </h3>

                    <p className="text-gray-400 text-sm mb-5 line-clamp-2 min-h-[40px]">
                      {event.description || 'No description available for this event.'}
                    </p>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center text-gray-300 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mr-3 flex-shrink-0 border border-white/5">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="truncate">
                          {new Date(event.startDateTime).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-300 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mr-3 flex-shrink-0 border border-white/5">
                          <MapPin className="w-4 h-4 text-pink-400" />
                        </div>
                        <span className="truncate">
                          {event.locationType === 'online' ? 'Online Event' : event.locationValue}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-300 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mr-3 flex-shrink-0 border border-white/5">
                          <Users className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="truncate">
                          {event.registeredUsers} registered
                          {event.capacity && <span className="text-gray-500"> / {event.capacity} total</span>}
                        </span>
                      </div>
                    </div>

                    {/* Join / Action Button */}
                    <button
                      onClick={() => handleJoinEvent(event._id)}
                      disabled={
                        joiningEvent === event._id ||
                        isEventEnded(event) ||
                        isRegistrationClosed(event) ||
                        isSoldOut ||
                        userInfo?.role === 'admin'
                      }
                      className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all uppercase cursor-pointer ${
                        userInfo?.role === 'admin'
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                          : isEventEnded(event)
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                          : isRegistrationClosed(event)
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                          : isSoldOut
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                          : joiningEvent === event._id
                          ? 'bg-gray-700 text-white cursor-wait'
                          : 'bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98]'
                      }`}
                    >
                      {userInfo?.role === 'admin' ? (
                        'Admin View Only'
                      ) : isEventEnded(event) ? (
                        'Event Ended'
                      ) : isRegistrationClosed(event) ? (
                        'Registration Closed'
                      ) : isSoldOut ? (
                        'Sold Out'
                      ) : joiningEvent === event._id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        'Join Event'
                      )}
                    </button>
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

export default EventsPage;
