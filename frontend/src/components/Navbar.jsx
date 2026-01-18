import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Calendar, LayoutDashboard, UserCircle, LogOut, PlusCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [userInfo, setUserInfo] = useState(localStorage.getItem('userInfo'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleStorageChange = () => {
      setUserInfo(localStorage.getItem('userInfo'));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userInfoChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userInfoChange', handleStorageChange);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.dispatchEvent(new Event('userInfoChange'));
    setMobileMenuOpen(false);
    window.location.href = '/';
  };

  const user = userInfo ? JSON.parse(userInfo) : null;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] px-4 sm:px-6 py-4 sm:py-6"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img
              src="/logo.png"
              alt="EventSync Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain transition-transform group-hover:scale-110"
            />
            <span className="text-white text-lg sm:text-2xl font-bold tracking-tight">EventSync</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors font-medium">Home</Link>
            <Link to="/events" className="text-gray-400 hover:text-white transition-colors font-medium">Events</Link>
            {user && user.role !== 'admin' && (
              <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors font-medium">My Events</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-gray-400 hover:text-white transition-colors font-medium">Admin Portal</Link>
            )}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white font-medium text-sm transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin/create"
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
                  >
                    Create Event
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all text-sm"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#1E1E1E] border-l border-white/10 z-[95] md:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <img
                      src="/logo.png"
                      alt="EventSync"
                      className="w-8 h-8 object-contain"
                    />
                    <span className="text-white text-xl font-bold">Menu</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* User Info */}
                {user && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-pink-500 rounded-full flex items-center justify-center">
                        <UserCircle size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{user.fullName}</p>
                        <p className="text-gray-400 text-xs capitalize">{user.role}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <nav className="space-y-2">
                  <Link
                    to="/"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Home size={20} />
                    <span className="font-medium">Home</span>
                  </Link>

                  <Link
                    to="/events"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Calendar size={20} />
                    <span className="font-medium">Events</span>
                  </Link>

                  {user && user.role !== 'admin' && (
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                      <LayoutDashboard size={20} />
                      <span className="font-medium">My Events</span>
                    </Link>
                  )}

                  {user?.role === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                      >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Admin Portal</span>
                      </Link>

                      <Link
                        to="/admin/create"
                        className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl transition-all"
                      >
                        <PlusCircle size={20} />
                        <span className="font-medium">Create Event</span>
                      </Link>
                    </>
                  )}
                </nav>

                {/* Auth Actions */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  {!user ? (
                    <>
                      <Link
                        to="/login"
                        className="block w-full px-4 py-3 text-center bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all"
                      >
                        Log In
                      </Link>
                      <Link
                        to="/signup"
                        className="block w-full px-4 py-3 text-center bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-semibold rounded-xl transition-all"
                      >
                        Sign Up
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold rounded-xl transition-all"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
